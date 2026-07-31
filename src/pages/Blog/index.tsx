import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Switch, Popconfirm, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import axiosClient from '../../api/axiosClient';
import axios from 'axios';

export default function BlogPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  
  const [form] = Form.useForm();

  const fetchBlogs = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get(`/admin/blogs?page=${page}&limit=${pageSize}`);
      if (res?.success) {
        setBlogs(res.data);
        setPagination({
          current: res.pagination.current_page,
          pageSize: pageSize,
          total: res.pagination.total_items,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể lấy danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchBlogs(newPagination.current, newPagination.pageSize);
  };

  const handleOpenModal = (record?: any) => {
    setEditingBlog(record || null);
    if (record) {
      form.setFieldsValue(record);
      if (record.image) {
        setFileList([
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: record.image,
          },
        ]);
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      setFileList([]);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res: any = await axiosClient.delete(`/admin/blogs/${id}`);
      if (res?.success) {
        message.success('Xóa bài viết thành công');
        fetchBlogs(pagination.current, pagination.pageSize);
      } else {
        message.error(res?.message || 'Lỗi khi xóa bài viết');
      }
    } catch (error) {
      message.error('Lỗi khi xóa bài viết');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const imageUrl = fileList[0]?.url || fileList[0]?.response?.url || '';
      
      const payload = {
        ...values,
        image: imageUrl,
      };

      let res: any;
      if (editingBlog) {
        res = await axiosClient.put(`/admin/blogs/${editingBlog.id}`, payload);
      } else {
        res = await axiosClient.post('/admin/blogs', payload);
      }

      if (res?.success) {
        message.success(editingBlog ? 'Cập nhật thành công' : 'Thêm mới thành công');
        setModalVisible(false);
        fetchBlogs(editingBlog ? pagination.current : 1, pagination.pageSize);
      } else {
        message.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Vui lòng kiểm tra lại form');
      } else {
        message.error('Có lỗi xảy ra');
      }
    }
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    
    newFileList = newFileList.map((file) => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file;
    });

    setFileList(newFileList);
  };

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/upload-api/api/v1/image-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = res.data?.image_url;
      if (imageUrl) {
        onSuccess({ url: imageUrl }, file);
        message.success("Upload ảnh thành công!");
      } else {
        onError(new Error("Lỗi upload ảnh"));
        message.error("Lỗi upload ảnh!");
      }
    } catch (err) {
      onError(err);
      message.error("Lỗi upload ảnh!");
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const columns = [
    {
      title: 'Ảnh bìa',
      dataIndex: 'image',
      key: 'image',
      render: (text: string) => (
        text ? <img src={text} alt="blog" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} /> : '-'
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
      render: (text: string) => text || 'Ẩn danh',
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (val: boolean) => (
        <Switch checked={val} disabled />
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bài viết này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Bài Viết (Blog)</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Thêm Bài Viết
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={blogs}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <Modal
        title={editingBlog ? 'Sửa Bài Viết' : 'Thêm Bài Viết Mới'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="name"
            label="Tiêu đề bài viết"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề..." />
          </Form.Item>

          <Form.Item label="Ảnh bìa" required>
            <Upload
              customRequest={customRequest}
              listType="picture-card"
              fileList={fileList}
              onChange={handleChange}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item
            name="author"
            label="Tác giả"
          >
            <Input placeholder="Nhập tên tác giả (không bắt buộc)" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <Input.TextArea rows={12} placeholder="Nhập nội dung bài viết..." />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng thái hiển thị"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
