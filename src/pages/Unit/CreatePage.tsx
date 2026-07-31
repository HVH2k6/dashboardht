import React from 'react';
import { Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import UnitForm from './UnitForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function UnitCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.post('/units', values);
      if (response.success) {
        message.success('Tạo đơn vị tính thành công!');
        navigate('/units');
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi kết nối máy chủ');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Thêm Đơn vị tính</Title>
      </div>
      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <UnitForm onFinish={handleFinish} />
      </Card>
    </div>
  );
}
