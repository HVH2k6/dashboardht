import React, { useEffect, useState } from 'react';
import { Typography, Breadcrumb, message, Card, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import LocalSpecialtyForm from './LocalSpecialtyForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function LocalSpecialtyEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: any = await axiosClient.get(`/local-specialties/${id}`);
        if (response.success) {
          setInitialData(response.data);
        } else {
          message.error('Không tìm thấy dữ liệu');
          navigate('/local-specialties');
        }
      } catch (error) {
        message.error('Lỗi khi tải dữ liệu');
        navigate('/local-specialties');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role?.name === 'Admin') {
      fetchData();
    }
  }, [id, navigate, user]);

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.put(`/local-specialties/${id}`, values);
      if (response.success) {
        message.success('Cập nhật đặc sản địa phương thành công!');
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
        <Breadcrumb.Item>Cập nhật</Breadcrumb.Item>
      </Breadcrumb>
      
      <Title level={3}>Cập nhật Đặc sản địa phương</Title>

      <Card variant="borderless" style={{ borderRadius: 8 }}>
        {loading ? (
          <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <LocalSpecialtyForm initialValues={initialData} onFinish={handleFinish} isEdit={true} />
        )}
      </Card>
    </div>
  );
}
