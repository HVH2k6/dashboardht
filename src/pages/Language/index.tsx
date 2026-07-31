import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function LanguageList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response: any = await axiosClient.get('/languages');
      if (response.success) {
        setData(response.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể lấy dữ liệu ngôn ngữ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.name === 'Admin') {
      fetchData();
    }
  }, [user]);

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleDelete = async (code: string) => {
    try {
      const response: any = await axiosClient.delete(`/languages/${code}`);
      if (response.success) {
        message.success('Xóa ngôn ngữ thành công!');
        fetchData();
      } else {
        message.error(response.message || 'Không thể xóa ngôn ngữ');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const columns = [
    {
      title: 'Mã (Code)',
      dataIndex: 'code',
      key: 'code',
      width: '15%',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Tên ngôn ngữ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Cờ (Flag)',
      dataIndex: 'flag_icon',
      key: 'flag_icon',
      width: '15%',
      render: (url: string) => url ? <img src={url} alt="flag" style={{ width: 40, height: 'auto', borderRadius: 4, border: '1px solid #f0f0f0' }} /> : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: '15%',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Đang bật' : 'Đã tắt'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: '20%',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            style={{ color: '#1890ff' }}
            onClick={() => navigate(`/languages/edit/${record.code}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa ngôn ngữ này?"
            onConfirm={() => handleDelete(record.code)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý Ngôn ngữ</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/languages/create')}
          size="large"
          style={{ borderRadius: 6 }}
        >
          Thêm ngôn ngữ
        </Button>
      </div>

      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="code"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
