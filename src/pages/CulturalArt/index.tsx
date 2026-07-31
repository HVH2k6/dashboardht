import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, Space, Popconfirm, message, Tag, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, YoutubeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function CulturalArtList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('vi');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [artRes, langRes] = await Promise.all([
        axiosClient.get('/cultural-arts'),
        axiosClient.get('/languages')
      ]) as any;

      if (artRes.success) {
        setData(artRes.data);
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
      const response: any = await axiosClient.delete(`/cultural-arts/${id}`);
      if (response.success) {
        message.success('Xóa dữ liệu thành công!');
        fetchData();
      } else {
        message.error(response.message || 'Không thể xóa dữ liệu');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi xóa.');
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
      title: `Tên gọi`,
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
        return <Tag color="magenta">{catTrans || 'Chưa phân loại'}</Tag>;
      }
    },
    {
      title: 'Video',
      dataIndex: 'link_video',
      key: 'link_video',
      align: 'center' as const,
      render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer"><YoutubeOutlined style={{ color: 'red', fontSize: 24 }} /></a> : '-'
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
      title: 'Hoạt động',
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
            onClick={() => navigate(`/cultural-arts/edit/${record.id}`)}
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
        <Title level={3} style={{ margin: 0 }}>Quản lý Văn hóa - Nghệ thuật</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/cultural-arts/create')}
          size="large"
          style={{ borderRadius: 6 }}
        >
          Thêm mới
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
