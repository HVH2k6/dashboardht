import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, Button, Upload, message, Tabs, Spin, Select, Row, Col, Card, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import axios from 'axios';
import axiosClient from '../../api/axiosClient';
import { generateSlug } from '../../utils/slugify';

const { Option } = Select;
const { TextArea } = Input;

interface LocalSpecialtyFormProps {
  initialValues?: any;
  onFinish: (values: any) => Promise<void>;
  isEdit?: boolean;
}

export default function LocalSpecialtyForm({ initialValues, onFinish, isEdit = false }: LocalSpecialtyFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [subFileList, setSubFileList] = useState<UploadFile[]>([]);

  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [langRes, catRes, unitRes, wardRes] = await Promise.all([
          axiosClient.get('/languages'),
          axiosClient.get('/categories'),
          axiosClient.get('/units'),
          axiosClient.get('/wards')
        ]) as any;

        if (langRes.success) setLanguages(langRes.data.filter((l: any) => l.is_active));
        if (catRes.success) setCategories(catRes.data.filter((c: any) => c.is_active));
        if (unitRes.success) setUnits(unitRes.data.filter((u: any) => u.is_active));
        if (wardRes.success) setWards(wardRes.data);
      } catch (error) {
        message.error('Không thể lấy dữ liệu phụ trợ');
      } finally {
        setFetchingData(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (initialValues && languages.length > 0) {
      const translationsObj: any = {};
      if (initialValues.translations) {
        initialValues.translations.forEach((t: any) => {
          if (!translationsObj[t.language_code]) translationsObj[t.language_code] = {};
          translationsObj[t.language_code].name = t.name;
          translationsObj[t.language_code].slug = t.slug;
          translationsObj[t.language_code].description = t.description;
          translationsObj[t.language_code].ingredients = t.ingredients;
        });
      }

      if (initialValues.address && initialValues.address.translations) {
        initialValues.address.translations.forEach((t: any) => {
          if (!translationsObj[t.language_code]) translationsObj[t.language_code] = {};
          translationsObj[t.language_code].address_detail = t.detail;
        });
      }

      form.setFieldsValue({
        status: initialValues.status || 'active',
        is_featured: initialValues.is_featured,
        category_id: initialValues.category_id,
        unit_id: initialValues.unit_id,
        ward_code: initialValues.address?.ward_code,
        map_url: initialValues.address?.map_url,
        price: initialValues.price,
        translations: translationsObj
      });

      if (initialValues.image) {
        setFileList([
          { uid: '-1', name: 'image.png', status: 'done', url: initialValues.image },
        ]);
      }

      if (initialValues.list_image && Array.isArray(initialValues.list_image)) {
        const subFiles = initialValues.list_image.map((url: string, index: number) => ({
          uid: `sub-${index}`, name: `list_image_${index}.png`, status: 'done', url: url
        }));
        setSubFileList(subFiles);
      }
    }
  }, [initialValues, form, languages]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 1. Lấy URL ảnh chính
      let image = values.image;
      if (fileList.length > 0 && fileList[0].url) {
        image = fileList[0].url;
      } else if (fileList.length > 0 && fileList[0].response?.url) {
        image = fileList[0].response.url;
      } else {
        image = "";
      }

      // 2. Lấy URL mảng ảnh phụ
      const list_image = subFileList.map(file => file.url || file.response?.url).filter(Boolean);

      // 3. Format translations array
      const translationsArray = [];
      if (values.translations) {
        for (const code of Object.keys(values.translations)) {
          const t = values.translations[code];
          if (t && (t.name || t.address_detail)) {
            const generatedSlug = t.name ? (t.slug || generateSlug(t.name)) : '';
            translationsArray.push({
              language_code: code,
              name: t.name || '',
              slug: generatedSlug,
              description: t.description || '',
              ingredients: t.ingredients || '',
              address_detail: t.address_detail || '',
            });
          }
        }
      }

      const hasName = translationsArray.some(t => t.name.trim() !== '');
      if (!hasName) {
        message.error("Vui lòng nhập tên đặc sản cho ít nhất 1 ngôn ngữ!");
        setLoading(false);
        return;
      }

      const submitData = {
        ...values,
        image,
        list_image,
        translations: translationsArray
      };

      await onFinish(submitData);
    } finally {
      setLoading(false);
    }
  };

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("name", file.name || "image");
    formData.append("file", file);

    try {
      const res = await axios.post("/upload-api/api/v1/image-upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data', }
      });
      const imageUrl = res.data?.image_url;
      if (imageUrl) {
        onSuccess({ url: imageUrl }, file);
      } else {
        throw new Error("Không lấy được link ảnh");
      }
    } catch (err: any) {
      onError(err);
      message.error("Lỗi upload ảnh!");
    }
  };

  const handleMainImageChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.map((file) => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file;
    });
    setFileList(newFileList.slice(-1));
  };

  const handleSubImageChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.map((file) => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file;
    });
    setSubFileList(newFileList);
  };

  if (fetchingData) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;

  const languageTabs = languages.map(lang => ({
    key: lang.code,
    label: (
      <span>
        <img src={lang.flag_icon} alt={lang.code} style={{ width: 16, marginRight: 8 }} />
        {lang.name}
      </span>
    ),
    children: (
      <Card bordered={false} style={{ background: '#fafafa' }}>
        <Form.Item label="Tên đặc sản" name={['translations', lang.code, 'name']}>
          <Input placeholder="Nhập tên đặc sản..." />
        </Form.Item>

        <Form.Item label="Đường dẫn (Slug)" name={['translations', lang.code, 'slug']} tooltip="Nếu để trống sẽ tự tạo từ tên.">
          <Input placeholder="ten-dac-san" />
        </Form.Item>

        <Form.Item label="Nguyên liệu" name={['translations', lang.code, 'ingredients']}>
          <Input placeholder="Thịt lợn, mắm, gia vị..." />
        </Form.Item>

        <Form.Item label="Mô tả chi tiết" name={['translations', lang.code, 'description']}>
          <TextArea rows={6} placeholder="Mô tả chi tiết về đặc sản..." />
        </Form.Item>

        <Form.Item label="Địa chỉ chi tiết (Thôn/Xóm/Số nhà)" name={['translations', lang.code, 'address_detail']}>
          <Input placeholder="VD: Thôn ABC, Xã XYZ" />
        </Form.Item>
      </Card>
    )
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ status: 'active', is_featured: false }}
    >
      <Row gutter={24}>
        <Col span={16}>
          <Tabs type="card" items={languageTabs} />
          <Card title="Địa điểm & Google Map" size="small" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Chọn Xã/Phường" name="ward_code" rules={[{ required: true, message: 'Bắt buộc chọn Xã/Phường' }]}>
                  <Select
                    showSearch
                    placeholder="Tìm kiếm Xã/Phường"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {wards.map(w => (
                      <Option key={w.code} value={w.code}>{w.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Link Google Map" name="map_url">
                  <Input placeholder="https://goo.gl/maps/..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Trạng thái hiển thị" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Trạng thái" name="status" valuePropName="value">
              <Select>
                <Option value="active">Hiển thị</Option>
                <Option value="inactive">Ẩn</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Nổi bật (Lên trang chủ)" name="is_featured" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Card>

          <Card title="Phân loại & Giá" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Danh mục" name="category_id">
              <Select placeholder="Chọn danh mục" allowClear>
                {categories.map(c => {
                  const viTrans = c.translations?.find((t: any) => t.language_code === 'vi');
                  return <Option key={c.id} value={c.id}>{viTrans?.name || c.id}</Option>;
                })}
              </Select>
            </Form.Item>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="Đơn vị tính" name="unit_id">
                  <Select placeholder="Hộp, Gói..." allowClear>
                    {units.map(u => {
                      const viTrans = u.translations?.find((t: any) => t.language_code === 'vi');
                      return <Option key={u.id} value={u.id}>{viTrans?.name || u.code}</Option>;
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Giá bán (VNĐ)" name="price">
                  <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Hình ảnh" size="small">
            <Form.Item label="Ảnh đại diện (Cover)" rules={[{ required: true, message: 'Bắt buộc tải ảnh' }]}>
              <Upload
                customRequest={customRequest}
                listType="picture-card"
                fileList={fileList}
                onChange={handleMainImageChange}
              >
                {fileList.length >= 1 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
            <Form.Item label="Album ảnh phụ (List Image)">
              <Upload
                customRequest={customRequest}
                listType="picture-card"
                fileList={subFileList}
                onChange={handleSubImageChange}
                multiple
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
        <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ width: '200px' }}>
          {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
        </Button>
      </div>
    </Form>
  );
}
