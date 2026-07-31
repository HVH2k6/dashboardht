import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Modal, Form, Input, InputNumber, Switch, Tabs, Select, Upload, type UploadProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import axios from 'axios';
import { languages } from '../../utils/const';



const { TabPane } = Tabs;

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageList, setImageList] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [form] = Form.useForm();

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

  const handleImageChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.map((file) => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file;
    });
    setImageList(newFileList);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );


  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get('/seller/products');
      if (res?.success) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể lấy danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const fetchUnits = async () => {
      try {
        const res: any = await axiosClient.get('/units');
        if (res?.success) {
          setUnits(res.data.filter((u: any) => u.is_active));
        }
      } catch (error) {
        console.error('Không thể lấy danh sách đơn vị tính', error);
      }
    };
    fetchUnits();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res: any = await axiosClient.delete(`/seller/products/${id}`);
      if (res?.success) {
        message.success('Xóa sản phẩm thành công');
        fetchProducts();
      } else {
        message.error(res?.message || 'Lỗi khi xóa');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi hệ thống');
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setImageList([]);
    form.resetFields();
    form.setFieldsValue({ status: 'active', is_featured: false, price: 0, unit_id: undefined });
    setModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingId(record.id);
    form.resetFields();

    if (record.image) {
      setImageList([{ uid: '-1', name: 'image', status: 'done', url: record.image }]);
    } else {
      setImageList([]);
    }

    const translations: Record<string, any> = {};
    if (record.translations) {
      record.translations.forEach((t: any) => {
        translations[t.language_code] = {
          id: t.id,
          name: t.name,
          description: t.description
        };
      });
    }

    form.setFieldsValue({
      price: record.price,
      status: record.status,
      is_featured: record.is_featured,
      unit_id: record.unit_id,
      translations
    });

    setModalVisible(true);
  };

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true);

      const translationsArr = Object.keys(values.translations || {}).map(langCode => ({
        id: values.translations[langCode]?.id,
        language_code: langCode,
        name: values.translations[langCode]?.name,
        description: values.translations[langCode]?.description,
      })).filter(t => t.name);

      let image = '';
      if (imageList.length > 0 && imageList[0].url) {
        image = imageList[0].url;
      } else if (imageList.length > 0 && imageList[0].response?.url) {
        image = imageList[0].response.url;
      }

      const payload = {
        price: values.price,
        image,
        status: values.status,
        is_featured: values.is_featured,
        unit_id: values.unit_id,
        translations: translationsArr
      };

      if (editingId) {
        const res: any = await axiosClient.put(`/seller/products/${editingId}`, payload);
        if (res?.success) {
          message.success('Cập nhật sản phẩm thành công');
          setModalVisible(false);
          fetchProducts();
        } else {
          message.error(res?.message || 'Có lỗi xảy ra');
        }
      } else {
        const res: any = await axiosClient.post('/seller/products', payload);
        if (res?.success) {
          message.success('Thêm sản phẩm mới thành công');
          setModalVisible(false);
          fetchProducts();
        } else {
          message.error(res?.message || 'Có lỗi xảy ra');
        }
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Tên sản phẩm (VI)',
      dataIndex: 'translations',
      key: 'name',
      render: (translations: any[]) => {
        const viTrans = translations?.find((t: any) => t.language_code === 'vi');
        return viTrans?.name || 'N/A';
      }
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (img: string) => img ? <img src={img} alt="product" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} /> : 'Không có'
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: string) => {
        // format as currency if needed
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);
      }
    },
    {
      title: 'Đơn vị tính',
      key: 'unit',
      render: (_: any, record: any) => {
        const viTrans = record.unit?.translations?.find((t: any) => t.language_code === 'vi');
        return viTrans?.name || '-';
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'active' ? 'green' : 'red' }}>
          {status === 'active' ? 'Hoạt động' : 'Đang ẩn'}
        </span>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" ghost icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Sản phẩm của tôi</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Thêm sản phẩm
        </Button>
      </div>

      <Card>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Tabs defaultActiveKey="vi">
            {languages.map((lang) => (
              <TabPane tab={lang.name} key={lang.code}>
                <Form.Item name={['translations', lang.code, 'id']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  label={`Tên sản phẩm (${lang.code.toUpperCase()})`}
                  name={['translations', lang.code, 'name']}
                  rules={lang.code === 'vi' ? [{ required: true, message: 'Vui lòng nhập tên sản phẩm (tiếng Việt)!' }] : []}
                >
                  <Input placeholder="Nhập tên sản phẩm" />
                </Form.Item>
                <Form.Item
                  label={`Mô tả (${lang.code.toUpperCase()})`}
                  name={['translations', lang.code, 'description']}
                >
                  <Input.TextArea rows={4} placeholder="Nhập mô tả sản phẩm" />
                </Form.Item>
              </TabPane>
            ))}
          </Tabs>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Giá bán" name="price" rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Nhập giá (VNĐ)" />
            </Form.Item>

            <Form.Item label="Đơn vị tính" name="unit_id" rules={[{ required: true, message: 'Vui lòng chọn đơn vị tính!' }]}>
              <Select placeholder="Chọn đơn vị tính">
                {units.map((u: any) => {
                  const name = u.translations?.find((t: any) => t.language_code === 'vi')?.name || u.code;
                  return <Select.Option key={u.id} value={u.id}>{name}</Select.Option>;
                })}
              </Select>
            </Form.Item>

            <Form.Item label="Hình ảnh sản phẩm">
              <Upload
                listType="picture-card"
                fileList={imageList}
                onChange={handleImageChange}
                customRequest={customRequest}
                maxCount={1}
                accept="image/*"
              >
                {imageList.length >= 1 ? null : uploadButton}
              </Upload>
            </Form.Item>

            <Form.Item label="Trạng thái" name="status">
              <Select>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Đang ẩn</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Nổi bật" name="is_featured" valuePropName="checked">
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </div>

          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
