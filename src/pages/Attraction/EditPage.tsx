import React, { useEffect, useState } from 'react';
import { Card, Typography, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import AttractionForm from './AttractionForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function AttractionEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: any = await axiosClient.get(`/attractions/${id}`);
        if (response.success) {
          setData(response.data);
        } else {
          message.error('Không tìm thấy dữ liệu điểm du lịch');
          navigate('/attractions');
        }
      } catch (error: any) {
        message.error(error.message || 'Lỗi kết nối máy chủ');
        navigate('/attractions');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.put(`/attractions/${id}`, values);
      if (response.success) {
        message.success('Cập nhật điểm du lịch thành công!');
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
        <Title level={3}>Chỉnh Sửa Điểm Du Lịch</Title>
      </div>
      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <AttractionForm initialValues={data} onFinish={handleFinish} isEdit={true} />
        )}
      </Card>
    </div>
  );
}
