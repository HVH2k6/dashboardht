import React from 'react';
import { Typography, Breadcrumb, message, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import CulturalArtForm from './CulturalArtForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function CulturalArtCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.post('/cultural-arts', values);
      if (response.success) {
        message.success('Thêm mới thành công!');
        navigate('/cultural-arts');
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi hệ thống');
    }
  };

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><a onClick={() => navigate('/cultural-arts')}>Quản lý Văn hóa - Nghệ thuật</a></Breadcrumb.Item>
        <Breadcrumb.Item>Thêm mới</Breadcrumb.Item>
      </Breadcrumb>
      
      <Title level={3}>Thêm Văn hóa - Nghệ thuật mới</Title>

      <Card variant="borderless" style={{ borderRadius: 8 }}>
        <CulturalArtForm onFinish={handleFinish} />
      </Card>
    </div>
  );
}
