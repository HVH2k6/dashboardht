import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, Button, Upload, message } from 'antd';
import axios from 'axios';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface LanguageFormProps {
  initialValues?: any;
  onFinish: (values: any) => Promise<void>;
  isEdit?: boolean;
}

export default function LanguageForm({ initialValues, onFinish, isEdit = false }: LanguageFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.flag_icon) {
        setFileList([
          {
            uid: '-1',
            name: 'flag.png',
            status: 'done',
            url: initialValues.flag_icon,
          },
        ]);
      }
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      let flag_icon = values.flag_icon;
      if (fileList.length > 0 && fileList[0].url) {
        flag_icon = fileList[0].url;
      } else if (fileList.length > 0 && fileList[0].response?.url) {
        flag_icon = fileList[0].response.url;
      } else {
        flag_icon = "";
      }

      await onFinish({ ...values, flag_icon });
    } finally {
      setLoading(false);
    }
  };

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    // Gắn name và file theo API của bác
    formData.append("name", file.name || "logo");
    formData.append("file", file);

    try {
      const res = await axios.post("/upload-api/api/v1/image-upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data', }
      });

      // Theo source code PHP của bác, API trả về "image_url" ở ngoài cùng
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

    // Cập nhật url vào file list khi upload xong
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

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ is_active: true }}
      style={{ maxWidth: 600 }}
    >
      <Form.Item
        name="code"
        label="Mã ngôn ngữ (Code)"
        rules={[{ required: true, message: 'Vui lòng nhập mã ngôn ngữ! (vd: vi, en)' }]}
      >
        <Input placeholder="vd: vi, en, fr" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Tên ngôn ngữ"
        rules={[{ required: true, message: 'Vui lòng nhập tên ngôn ngữ!' }]}
      >
        <Input placeholder="vd: Tiếng Việt, English" />
      </Form.Item>

      <Form.Item
        label="Cờ (Flag Icon)"
      >
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

      <Form.Item
        name="is_active"
        label="Trạng thái hiển thị"
        valuePropName="checked"
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
