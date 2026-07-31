import React from 'react';
import { Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import AttractionForm from './AttractionForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function AttractionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.post('/attractions', values);
      if (response.success) {
        message.success('Tạo điểm du lịch thành công!');
        navigate('/attractions');
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
        <Title level={3}>Thêm Điểm Du Lịch</Title>
      </div>
      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0 }}>
        <AttractionForm onFinish={handleFinish} />
      </Card>
    </div>
  );
}
