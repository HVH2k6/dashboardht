import React from 'react';
import { Typography, Breadcrumb, message, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import LocalSpecialtyForm from './LocalSpecialtyForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function LocalSpecialtyCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.post('/local-specialties', values);
      if (response.success) {
        message.success('Thêm đặc sản địa phương thành công!');
        navigate('/local-specialties');
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
        <Breadcrumb.Item><a onClick={() => navigate('/local-specialties')}>Quản lý Đặc sản</a></Breadcrumb.Item>
        <Breadcrumb.Item>Thêm mới</Breadcrumb.Item>
      </Breadcrumb>
      
      <Title level={3}>Thêm Đặc sản địa phương mới</Title>

      <Card variant="borderless" style={{ borderRadius: 8 }}>
        <LocalSpecialtyForm onFinish={handleFinish} />
      </Card>
    </div>
  );
}
