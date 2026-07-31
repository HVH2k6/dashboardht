import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, Button, Upload, message, Tabs, Spin } from 'antd';
import axios from 'axios';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import axiosClient from '../../api/axiosClient';
import { generateSlug } from '../../utils/slugify';


interface CategoryFormProps {
  initialValues?: any;
  onFinish: (values: any) => Promise<void>;
  isEdit?: boolean;
}

export default function CategoryForm({ initialValues, onFinish, isEdit = false }: CategoryFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingLang, setFetchingLang] = useState(true);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  useEffect(() => {
    // Lấy danh sách ngôn ngữ đang bật
    const fetchLanguages = async () => {
      try {
        const response: any = await axiosClient.get('/languages');
        if (response.success) {
          setLanguages(response.data.filter((l: any) => l.is_active));
        }
      } catch (error) {
        message.error('Không thể lấy danh sách ngôn ngữ');
      } finally {
        setFetchingLang(false);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (initialValues && languages.length > 0) {
      // Chuyển đổi mảng translations từ API thành object để bind vào Form
      const translationsObj: any = {};
      if (initialValues.translations) {
        initialValues.translations.forEach((t: any) => {
          translationsObj[t.language_code] = {
            name: t.name,
            slug: t.slug,
          };
        });
      }

      form.setFieldsValue({
        is_active: initialValues.is_active,
        position: initialValues.position || 0,
        translations: translationsObj
      });

      if (initialValues.image) {
        setFileList([
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: initialValues.image,
          },
        ]);
      }
    }
  }, [initialValues, form, languages]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      let image = values.image;
      if (fileList.length > 0 && fileList[0].url) {
        image = fileList[0].url;
      } else if (fileList.length > 0 && fileList[0].response?.url) {
        image = fileList[0].response.url;
      } else {
        image = "";
      }

      // Format lại translations thành mảng cho API
      const translationsArray = [];
      if (values.translations) {
        for (const code of Object.keys(values.translations)) {
          const t = values.translations[code];
          if (t && t.name) {
            // Dùng slugify tối ưu cho tiếng Việt và các ký tự non-latin
            const generatedSlug = t.slug || generateSlug(t.name);
            translationsArray.push({
              language_code: code,
              name: t.name,
              slug: generatedSlug,
            });
          }
        }
      }

      if (translationsArray.length === 0) {
        message.error("Vui lòng nhập tên danh mục cho ít nhất 1 ngôn ngữ!");
        return;
      }

      await onFinish({
        is_active: values.is_active,
        position: values.position,
        image,
        translations: translationsArray
      });
    } finally {
      setLoading(false);
    }
  };

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("name", file.name || "logo");
    formData.append("file", file);

    try {
      const res = await axios.post("/upload-api/api/v1/image-upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data', }
      });
      const imageUrl = res.data?.image_url;
      if (imageUrl) {
        onSuccess({ url: imageUrl }, file);
      } else {
        throw new Error("Không lấy được link ảnh từ API");
      }
    } catch (err: any) {
      onError(err);
      message.error("Lỗi upload ảnh!");
    }
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.map((file) => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file;
    });
    setFileList(newFileList);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
    </div>
  );

  if (fetchingLang) {
    return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  }

  const tabItems = languages.map(lang => ({
    key: lang.code,
    forceRender: true, // Bắt buộc render để Form.Item không bị mất nếu tab chưa được click
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {lang.flag_icon && <img src={lang.flag_icon} alt="flag" style={{ width: 20 }} />}
        {lang.name}
      </span>
    ),
    children: (
      <div style={{ marginTop: 16 }}>
        <Form.Item
          name={['translations', lang.code, 'name']}
          label={`Tên danh mục (${lang.name})`}
          rules={[{ required: lang.code === 'vi', message: 'Vui lòng nhập tên!' }]}
        >
          <Input placeholder="Nhập tên..." />
        </Form.Item>
        <Form.Item
          name={['translations', lang.code, 'slug']}
          label={`Đường dẫn tĩnh (Slug - ${lang.name})`}
        >
          <Input placeholder="Tuỳ chọn, tự tạo nếu để trống" />
        </Form.Item>
      </div>
    )
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ is_active: true }}
      style={{ maxWidth: 800 }}
    >
      <Form.Item label="Ảnh đại diện (Image)">
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={handleChange}
          customRequest={customRequest}
          maxCount={1}
          accept="image/*"
        >
          {fileList.length >= 1 ? null : uploadButton}
        </Upload>
      </Form.Item>

      <Tabs items={tabItems} type="card" />

      <Form.Item
        name="position"
        label="Vị trí hiển thị (Số nhỏ xếp trước)"
        style={{ marginTop: 24 }}
      >
        <Input type="number" placeholder="Ví dụ: 0, 1, 2..." />
      </Form.Item>

      <Form.Item
        name="is_active"
        label="Trạng thái hiển thị"
        valuePropName="checked"
        style={{ marginTop: 24 }}
      >
        <Switch checkedChildren="Đang bật" unCheckedChildren="Đã tắt" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
          {isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
        <Button onClick={() => window.history.back()}>
          Hủy
        </Button>
      </Form.Item>
    </Form>
  );
}
