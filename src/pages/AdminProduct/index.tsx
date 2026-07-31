import { useState, useEffect } from 'react';
import { Table, Button, Card, Space, message, Tag, Modal, Image } from 'antd';
import { LockOutlined, UnlockOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

export default function AdminProductPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchProducts = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get(`/admin/products?page=${page}&limit=${pageSize}`);
      if (res?.success) {
        setProducts(res.data);
        setPagination({
          current: res.page,
          pageSize: res.limit,
          total: res.total,
        });
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
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchProducts(newPagination.current, newPagination.pageSize);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      const res: any = await axiosClient.put(`/admin/products/${id}`, { status: newStatus });
      if (res?.success) {
        message.success('Cập nhật trạng thái thành công');
        fetchProducts(pagination.current, pagination.pageSize);
      } else {
        message.error(res?.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res: any = await axiosClient.delete(`/admin/products/${id}`);
          if (res?.success) {
            message.success('Xóa sản phẩm thành công');
            fetchProducts(pagination.current, pagination.pageSize);
          } else {
            message.error(res?.message || 'Xóa thất bại');
          }
        } catch (error) {
          console.error(error);
          message.error('Lỗi khi xóa sản phẩm');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (text: string) => (
        <Image width={50} height={50} src={text} style={{ objectFit: 'cover', borderRadius: '4px' }} />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'translations',
      key: 'name',
      render: (translations: any[]) => {
        const viTranslation = translations?.find((t: any) => t.language_code === 'vi');
        return viTranslation ? viTranslation.name : 'N/A';
      },
    },
    {
      title: 'Cửa hàng',
      dataIndex: 'shop',
      key: 'shop',
      render: (shop: any) => {
        const shopTranslation = shop?.translations?.find((t: any) => t.language_code === 'vi');
        return shopTranslation ? shopTranslation.name : 'N/A';
      },
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : (status === 'locked' ? 'red' : 'orange')}>
          {status === 'active' ? 'Đang hoạt động' : (status === 'locked' ? 'Đã khóa' : status)}
        </Tag>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            danger={record.status === 'active'}
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => toggleStatus(record.id, record.status)}
          >
            {record.status === 'active' ? 'Khóa' : 'Mở khóa'}
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý Sản phẩm">
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </Card>
  );
}
