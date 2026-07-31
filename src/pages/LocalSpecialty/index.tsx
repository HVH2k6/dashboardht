import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, Space, Popconfirm, message, Tag, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function LocalSpecialtyList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('vi');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [specialtyRes, langRes] = await Promise.all([
        axiosClient.get('/local-specialties'),
        axiosClient.get('/languages')
      ]) as any;

      if (specialtyRes.success) {
        setData(specialtyRes.data);
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
      const response: any = await axiosClient.delete(`/local-specialties/${id}`);
      if (response.success) {
        message.success('Xóa đặc sản thành công!');
        fetchData();
      } else {
        message.error(response.message || 'Không thể xóa đặc sản');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi xóa.');
    }
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'image',
      key: 'image',
      width: '10%',
      render: (url: string) => url ? <img src={url} alt="image" style={{ width: 60, height: '45px', objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }} /> : '-'
    },
    {
      title: `Tên đặc sản`,
      key: 'name',
      render: (_: any, record: any) => {
        const translation = record.translations?.find((t: any) => t.language_code === activeTab);
        return <b>{translation ? translation.name : `(Chưa có bản dịch)`}</b>;
      }
    },
    {
      title: 'Phân loại',
      key: 'category',
      render: (_: any, record: any) => {
        const catTrans = record.category?.translations?.find((t: any) => t.language_code === activeTab)?.name || record.category?.id;
        return <Tag color="blue">{catTrans || 'Chưa phân loại'}</Tag>;
      }
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      render: (price: any) => {
        return price ? <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}</span> : '-';
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
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hiển thị' : 'Ẩn'}
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
            onClick={() => navigate(`/local-specialties/edit/${record.id}`)}
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
        <Title level={3} style={{ margin: 0 }}>Quản lý Đặc sản địa phương</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/local-specialties/create')}
          size="large"
          style={{ borderRadius: 6 }}
        >
          Thêm Đặc sản mới
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
