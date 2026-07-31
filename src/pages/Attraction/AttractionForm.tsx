import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, Button, Upload, message, Tabs, Spin, Select, Row, Col, Card, InputNumber, TimePicker } from 'antd';
import axios from 'axios';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import axiosClient from '../../api/axiosClient';
import { generateSlug } from '../../utils/slugify';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface AttractionFormProps {
  initialValues?: any;
  onFinish: (values: any) => Promise<void>;
  isEdit?: boolean;
}

export default function AttractionForm({ initialValues, onFinish, isEdit = false }: AttractionFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [subFileList, setSubFileList] = useState<UploadFile[]>([]);

  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [langRes, catRes, typeRes, wardRes] = await Promise.all([
          axiosClient.get('/languages'),
          axiosClient.get('/categories'),
          axiosClient.get('/types'),
          axiosClient.get('/wards')
        ]) as any;

        if (langRes.success) setLanguages(langRes.data.filter((l: any) => l.is_active));
        if (catRes.success) setCategories(catRes.data.filter((c: any) => c.is_active));
        if (typeRes.success) setTypes(typeRes.data.filter((t: any) => t.is_active));
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
        });
      }

      if (initialValues.address && initialValues.address.translations) {
        initialValues.address.translations.forEach((t: any) => {
          if (!translationsObj[t.language_code]) translationsObj[t.language_code] = {};
          translationsObj[t.language_code].address_detail = t.detail;
        });
      }

      form.setFieldsValue({
        is_active: initialValues.is_active,
        is_featured: initialValues.is_featured,
        category_id: initialValues.category_id,
        type_id: initialValues.type_id,
        ward_code: initialValues.address?.ward_code,
        map_url: initialValues.address?.map_url,
        phone_number: initialValues.phone_number,
        website: initialValues.website,
        min_price: initialValues.min_price,
        max_price: initialValues.max_price,
        opening_time: initialValues.opening_time ? dayjs(initialValues.opening_time) : null,
        closing_time: initialValues.closing_time ? dayjs(initialValues.closing_time) : null,
        translations: translationsObj
      });

      if (initialValues.image) {
        setFileList([
          { uid: '-1', name: 'image.png', status: 'done', url: initialValues.image },
        ]);
      }

      if (initialValues.sub_image && Array.isArray(initialValues.sub_image)) {
        const subFiles = initialValues.sub_image.map((url: string, index: number) => ({
          uid: `sub-${index}`, name: `sub_image_${index}.png`, status: 'done', url: url
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
      const sub_image = subFileList.map(file => file.url || file.response?.url).filter(Boolean);

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
              address_detail: t.address_detail || '',
            });
          }
        }
      }

      const hasName = translationsArray.some(t => t.name.trim() !== '');
      if (!hasName) {
        message.error("Vui lòng nhập tên điểm du lịch cho ít nhất 1 ngôn ngữ!");
        setLoading(false);
        return;
      }

      // 4. Định dạng lại thời gian
      const opening_time = values.opening_time ? values.opening_time.toISOString() : null;
      const closing_time = values.closing_time ? values.closing_time.toISOString() : null;

      const submitData = {
        ...values,
        image,
        sub_image,
        opening_time,
        closing_time,
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
    setFileList(newFileList);
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

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );

  if (fetchingData) {
    return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  }

  const tabItems = languages.map(lang => ({
    key: lang.code,
    forceRender: true,
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
          label={`Tên điểm du lịch (${lang.name})`}
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
        <Form.Item
          name={['translations', lang.code, 'address_detail']}
          label={`Địa chỉ chi tiết (Số nhà, đường - ${lang.name})`}
        >
          <TextArea rows={2} placeholder="Nhập địa chỉ chi tiết..." />
        </Form.Item>
        <Form.Item
          name={['translations', lang.code, 'description']}
          label={`Mô tả chi tiết (${lang.name})`}
        >
          <TextArea rows={4} placeholder="Nhập mô tả..." />
        </Form.Item>
      </div>
    )
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ is_active: true, is_featured: false }}
    >
      <Row gutter={24}>
        {/* Cột trái: Hình ảnh, Phân loại, Thuộc tính */}
        <Col xs={24} lg={8}>
          <Card size="small" title="Hình ảnh" style={{ marginBottom: 24 }}>
            <Form.Item label="Ảnh đại diện (Chính)">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleMainImageChange}
                customRequest={customRequest}
                maxCount={1}
                accept="image/*"
              >
                {fileList.length >= 1 ? null : uploadButton}
              </Upload>
            </Form.Item>
            <Form.Item label="Ảnh phụ (Nhiều ảnh)">
              <Upload
                listType="picture-card"
                fileList={subFileList}
                onChange={handleSubImageChange}
                customRequest={customRequest}
                multiple
                accept="image/*"
              >
                {uploadButton}
              </Upload>
            </Form.Item>
          </Card>

          <Card size="small" title="Phân loại & Thuộc tính" style={{ marginBottom: 24 }}>
            <Form.Item name="category_id" label="Danh mục">
              <Select placeholder="Chọn danh mục" allowClear>
                {categories.map(c => (
                  <Option key={c.id} value={c.id}>
                    {c.translations?.find((t: any) => t.language_code === 'vi')?.name || c.id}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="type_id" label="Loại hình">
              <Select placeholder="Chọn loại hình" allowClear>
                {types.map(t => (
                  <Option key={t.id} value={t.id}>
                    {t.translations?.find((tr: any) => tr.language_code === 'vi')?.name || t.id}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="is_active" label="Trạng thái hiển thị" valuePropName="checked">
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="is_featured" label="Nổi bật" valuePropName="checked">
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="Thời gian & Giá cả (Tùy chọn)">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="opening_time" label="Giờ mở cửa">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="closing_time" label="Giờ đóng cửa">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="min_price" label="Giá thấp nhất (VNĐ)">
                  <InputNumber style={{ width: '100%' }} min={0} step={1000} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="max_price" label="Giá cao nhất (VNĐ)">
                  <InputNumber style={{ width: '100%' }} min={0} step={1000} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Cột phải: Thông tin Đa ngôn ngữ, Vị trí */}
        <Col xs={24} lg={16}>
          <Card size="small" title="Thông tin Đa ngôn ngữ" style={{ marginBottom: 24 }}>
            <Tabs items={tabItems} type="card" />
          </Card>

          <Card size="small" title="Vị trí & Liên hệ">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ward_code"
                  label="Xã / Phường"
                  rules={[{ required: true, message: 'Bắt buộc chọn Xã/Phường!' }]}
                >
                  <Select
                    showSearch
                    placeholder="Chọn xã/phường"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {wards.map(w => (
                      <Option key={w.code} value={w.code}>
                        {w.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="map_url" label="Link Google Maps">
                  <Input placeholder="https://goo.gl/maps/..." />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="phone_number" label="Số điện thoại">
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="website" label="Website">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
        <Button onClick={() => window.history.back()} style={{ marginRight: 8 }}>
          Hủy
        </Button>
        <Button type="primary" htmlType="submit" loading={loading} size="large">
          {isEdit ? 'Cập nhật Điểm du lịch' : 'Tạo mới Điểm du lịch'}
        </Button>
      </div>
    </Form>
  );
}
