import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, Space, Popconfirm, message, Tag, Tabs, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function AttractionList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('vi');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attractionRes, langRes] = await Promise.all([
        axiosClient.get('/attractions'),
        axiosClient.get('/languages')
      ]) as any;

      if (attractionRes.success) {
        setData(attractionRes.data);
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
      const response: any = await axiosClient.delete(`/attractions/${id}`);
      if (response.success) {
        message.success('Xóa điểm du lịch thành công!');
        fetchData();
      } else {
        message.error(response.message || 'Không thể xóa điểm du lịch');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi xóa. Có thể do dữ liệu này đang được sử dụng ở nơi khác.');
    }
  };

  const columns = [
    {
      title: 'Ảnh đại diện',
      dataIndex: 'image',
      key: 'image',
      width: '10%',
      render: (url: string) => url ? <img src={url} alt="image" style={{ width: 60, height: '45px', objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }} /> : '-'
    },
    {
      title: `Tên điểm du lịch`,
      key: 'name',
      render: (_: any, record: any) => {
        const translation = record.translations?.find((t: any) => t.language_code === activeTab);
        return <b>{translation ? translation.name : `(Chưa có bản dịch)`}</b>;
      }
    },
    {
      title: 'Phân loại',
      key: 'category_type',
      render: (_: any, record: any) => {
        const catTrans = record.category?.translations?.find((t: any) => t.language_code === activeTab)?.name || record.category?.id;
        const typeTrans = record.type?.translations?.find((t: any) => t.language_code === activeTab)?.name || record.type?.id;
        return (
          <div>
            <div><Tag color="blue">{catTrans || 'Chưa phân loại'}</Tag></div>
            <div style={{ marginTop: 4 }}><Tag color="cyan">{typeTrans || 'Chưa phân loại'}</Tag></div>
          </div>
        );
      }
    },
    {
      title: 'Địa chỉ',
      key: 'address',
      render: (_: any, record: any) => {
        const ward = record.address?.ward;
        if (!ward) return '-';
        return <span><EnvironmentOutlined /> {ward.name}, {ward.district_name}</span>;
      }
    },
    {
      title: 'Nổi bật',
      dataIndex: 'is_featured',
      key: 'is_featured',
      align: 'center' as const,
      render: (isFeatured: boolean) => (
        isFeatured ? <Tag color="gold">Có</Tag> : <Tag>Không</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Đang bật' : 'Đã tắt'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: '15%',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            style={{ color: '#1890ff' }}
            onClick={() => navigate(`/attractions/edit/${record.id}`)}
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
        <Title level={3} style={{ margin: 0 }}>Quản lý Điểm Du Lịch</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/attractions/create')}
          size="large"
          style={{ borderRadius: 6 }}
        >
          Thêm Điểm Du Lịch mới
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
