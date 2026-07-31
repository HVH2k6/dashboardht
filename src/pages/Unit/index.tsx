import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, Space, Popconfirm, message, Tag, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function UnitList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('vi');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitRes, langRes] = await Promise.all([
        axiosClient.get('/units'),
        axiosClient.get('/languages')
      ]) as any;

      if (unitRes.success) {
        setData(unitRes.data);
      }
      if (langRes.success) {
        setLanguages(langRes.data.filter((l: any) => l.is_active));
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể lấy dữ liệu');
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

  const handleDelete = async (id: string) => {
    try {
      const response: any = await axiosClient.delete(`/units/${id}`);
      if (response.success) {
        message.success('Xóa đơn vị tính thành công!');
        fetchData();
      } else {
        message.error(response.message || 'Không thể xóa đơn vị tính');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi xóa. Có thể do dữ liệu này đang được sử dụng ở nơi khác.');
    }
  };

  const columns = [
    {
      title: 'Mã (Code)',
      dataIndex: 'code',
      key: 'code',
      width: '20%',
      render: (code: string) => <b>{code}</b>
    },
    {
      title: `Tên hiển thị`,
      key: 'name',
      render: (_: any, record: any) => {
        const translation = record.translations?.find((t: any) => t.language_code === activeTab);
        return translation ? translation.name : `(Chưa có bản dịch)`;
      }
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
            onClick={() => navigate(`/units/edit/${record.id}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
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

  const tabItems = languages.map(lang => ({
    key: lang.code,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {lang.flag_icon && <img src={lang.flag_icon} alt="flag" style={{ width: 20 }} />}
        {lang.name}
      </span>
    )
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý Đơn vị tính</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/units/create')}
          size="large"
          style={{ borderRadius: 6 }}
        >
          Thêm Đơn vị tính mới
        </Button>
      </div>

      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        {languages.length > 0 && (
          <Tabs 
            activeKey={activeTab} 
            onChange={(key) => setActiveTab(key)} 
            items={tabItems} 
            style={{ marginBottom: 16 }}
            type="card"
          />
        )}
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
