import { useState, useEffect } from 'react';
import { Table, Button, Card, Space, message, Tag, Modal } from 'antd';
import { LockOutlined, UnlockOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

export default function AdminShopPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchShops = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get(`/admin/shops?page=${page}&limit=${pageSize}`);
      if (res?.success) {
        setShops(res.data);
        setPagination({
          current: res.page,
          pageSize: res.limit,
          total: res.total,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể lấy danh sách cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchShops(newPagination.current, newPagination.pageSize);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      const res: any = await axiosClient.put(`/admin/shops/${id}`, { status: newStatus });
      if (res?.success) {
        message.success('Cập nhật trạng thái thành công');
        fetchShops(pagination.current, pagination.pageSize);
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
      title: 'Bạn có chắc chắn muốn xóa cửa hàng này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res: any = await axiosClient.delete(`/admin/shops/${id}`);
          if (res?.success) {
            message.success('Xóa cửa hàng thành công');
            fetchShops(pagination.current, pagination.pageSize);
          } else {
            message.error(res?.message || 'Xóa thất bại');
          }
        } catch (error) {
          console.error(error);
          message.error('Lỗi khi xóa cửa hàng');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Tên cửa hàng',
      dataIndex: 'translations',
      key: 'name',
      render: (translations: any[]) => {
        const viTranslation = translations?.find((t: any) => t.language_code === 'vi');
        return viTranslation ? viTranslation.name : 'N/A';
      },
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user?.email || user?.username || 'N/A',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone_number',
      key: 'phone_number',
    },
    {
      title: 'Số sản phẩm',
      dataIndex: '_count',
      key: 'products',
      render: (count: any) => count?.products || 0,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
        </Tag>
      ),
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
    <Card title="Quản lý Cửa hàng">
      <Table
        columns={columns}
        dataSource={shops}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </Card>
  );
}
