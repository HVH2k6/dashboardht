import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Tabs, Skeleton, Upload, Row, Col, Select } from 'antd';
import { ShopOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useAuth } from '../../providers/AuthProvider';
import axiosClient from '../../api/axiosClient';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export default function MyShopPage() {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  const [logoList, setLogoList] = useState<UploadFile[]>([]);
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' }
  ];

  const fetchShopData = async () => {
    try {
      setInitialLoading(true);

      const wardRes: any = await axiosClient.get('/wards');
      if (wardRes?.success) {
        setWards(wardRes.data);
      }

      const res: any = await axiosClient.get('/seller/shop');
      if (res?.success && res?.data) {
        setHasShop(true);
        const shop = res.data;

        const translations: Record<string, any> = {};
        shop.translations?.forEach((t: any) => {
          if (!translations[t.language_code]) translations[t.language_code] = {};
          translations[t.language_code].id = t.id;
          translations[t.language_code].name = t.name;
          translations[t.language_code].description = t.description;
        });

        if (shop.address && shop.address.translations) {
          shop.address.translations.forEach((t: any) => {
            if (!translations[t.language_code]) translations[t.language_code] = {};
            translations[t.language_code].address_id = t.id;
            translations[t.language_code].address_detail = t.detail;
          });
        }

        form.setFieldsValue({
          phone_number: shop.phone_number,
          contact_email: shop.contact_email,
          ward_code: shop.address?.ward_code,
          map_url: shop.address?.map_url,
          translations
        });

        if (shop.logo_url) {
          setLogoList([{ uid: '-1', name: 'logo.png', status: 'done', url: shop.logo_url }]);
        }
        if (shop.cover_image_url) {
          setCoverList([{ uid: '-2', name: 'cover.png', status: 'done', url: shop.cover_image_url }]);
        }
      } else {
        setHasShop(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

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

  const handleLogoChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.map((file) => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file;
    });
    setLogoList(newFileList);
  };

  const handleCoverChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.map((file) => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file;
    });
    setCoverList(newFileList);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      let logo_url = '';
      if (logoList.length > 0 && logoList[0].url) {
        logo_url = logoList[0].url;
      } else if (logoList.length > 0 && logoList[0].response?.url) {
        logo_url = logoList[0].response.url;
      }

      let cover_image_url = '';
      if (coverList.length > 0 && coverList[0].url) {
        cover_image_url = coverList[0].url;
      } else if (coverList.length > 0 && coverList[0].response?.url) {
        cover_image_url = coverList[0].response.url;
      }

      const translationsArr = Object.keys(values.translations || {}).map(langCode => ({
        id: values.translations[langCode]?.id,
        address_id: values.translations[langCode]?.address_id,
        language_code: langCode,
        name: values.translations[langCode]?.name,
        description: values.translations[langCode]?.description,
        address_detail: values.translations[langCode]?.address_detail,
      })).filter(t => t.name || t.address_detail);

      const payload = {
        phone_number: values.phone_number,
        contact_email: values.contact_email,
        ward_code: values.ward_code,
        map_url: values.map_url,
        logo_url,
        cover_image_url,
        translations: translationsArr
      };

      if (hasShop) {
        const res: any = await axiosClient.put('/seller/shop', payload);
        if (res?.success) {
          message.success('Cập nhật cửa hàng thành công');
        } else {
          message.error(res?.message || 'Có lỗi xảy ra');
        }
      } else {
        const res: any = await axiosClient.post('/seller/shop', payload);
        if (res?.success) {
          message.success('Tạo cửa hàng thành công');
          setHasShop(true);
        } else {
          message.error(res?.message || 'Có lỗi xảy ra');
        }
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Card><Skeleton active /></Card>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2><ShopOutlined /> {hasShop ? 'Cài đặt Cửa hàng' : 'Tạo mới Cửa hàng'}</h2>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Row gutter={24}>
          <Col xs={24} lg={8}>
            <Card size="small" title="Thông tin cơ bản" style={{ marginBottom: 24 }}>
              <Form.Item label="Số điện thoại" name="phone_number">
                <Input placeholder="Nhập số điện thoại cửa hàng" />
              </Form.Item>

              <Form.Item label="Email liên hệ" name="contact_email">
                <Input placeholder="Nhập email liên hệ" />
              </Form.Item>

              <Form.Item label="Logo cửa hàng">
                <Upload
                  listType="picture-card"
                  fileList={logoList}
                  onChange={handleLogoChange}
                  customRequest={customRequest}
                  maxCount={1}
                  accept="image/*"
                >
                  {logoList.length >= 1 ? null : uploadButton}
                </Upload>
              </Form.Item>

              <Form.Item label="Ảnh bìa (Cover)">
                <Upload
                  listType="picture-card"
                  fileList={coverList}
                  onChange={handleCoverChange}
                  customRequest={customRequest}
                  maxCount={1}
                  accept="image/*"
                >
                  {coverList.length >= 1 ? null : uploadButton}
                </Upload>
              </Form.Item>
            </Card>

            <Card size="small" title="Vị trí & Địa chỉ">
              <Form.Item
                name="ward_code"
                label="Xã / Phường"
              >
                <Select
                  showSearch
                  allowClear
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

              <Form.Item name="map_url" label="Link Google Maps">
                <Input placeholder="https://goo.gl/maps/..." />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card size="small" title="Thông tin Đa ngôn ngữ (Tên, Mô tả & Địa chỉ chi tiết)">
              <Tabs defaultActiveKey="vi" type="card">
                {languages.map((lang) => (
                  <TabPane
                    tab={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{lang.name}</span>}
                    key={lang.code}
                  >
                    <div style={{ marginTop: 16 }}>
                      <Form.Item name={['translations', lang.code, 'id']} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item name={['translations', lang.code, 'address_id']} hidden>
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label={`Tên cửa hàng (${lang.code.toUpperCase()})`}
                        name={['translations', lang.code, 'name']}
                        rules={lang.code === 'vi' ? [{ required: true, message: 'Vui lòng nhập tên cửa hàng (tiếng Việt)!' }] : []}
                      >
                        <Input placeholder="Nhập tên cửa hàng" />
                      </Form.Item>

                      <Form.Item
                        name={['translations', lang.code, 'address_detail']}
                        label={`Địa chỉ chi tiết (Số nhà, đường - ${lang.code.toUpperCase()})`}
                      >
                        <TextArea rows={2} placeholder="Nhập địa chỉ chi tiết..." />
                      </Form.Item>

                      <Form.Item
                        label={`Mô tả (${lang.code.toUpperCase()})`}
                        name={['translations', lang.code, 'description']}
                      >
                        <TextArea rows={5} placeholder="Nhập mô tả cửa hàng" />
                      </Form.Item>
                    </div>
                  </TabPane>
                ))}
              </Tabs>
            </Card>

            <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large">
                {hasShop ? 'Lưu thay đổi' : 'Khởi tạo Cửa hàng'}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
