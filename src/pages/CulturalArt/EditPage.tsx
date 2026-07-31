import React, { useEffect, useState } from 'react';
import { Typography, Breadcrumb, message, Card, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import CulturalArtForm from './CulturalArtForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function CulturalArtEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: any = await axiosClient.get(`/cultural-arts/${id}`);
        if (response.success) {
          setInitialData(response.data);
        } else {
          message.error('Không tìm thấy dữ liệu');
          navigate('/cultural-arts');
        }
      } catch (error) {
        message.error('Lỗi khi tải dữ liệu');
        navigate('/cultural-arts');
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
      const response: any = await axiosClient.put(`/cultural-arts/${id}`, values);
      if (response.success) {
        message.success('Cập nhật thành công!');
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
        <Breadcrumb.Item>Cập nhật</Breadcrumb.Item>
      </Breadcrumb>
      
      <Title level={3}>Cập nhật Văn hóa - Nghệ thuật</Title>

      <Card variant="borderless" style={{ borderRadius: 8 }}>
        {loading ? (
          <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <CulturalArtForm initialValues={initialData} onFinish={handleFinish} isEdit={true} />
        )}
      </Card>
    </div>
  );
}
