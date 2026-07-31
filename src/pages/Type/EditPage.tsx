import React, { useEffect, useState } from 'react';
import { Card, Typography, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import TypeForm from './TypeForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function TypeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role?.name !== 'Admin') return;

    const fetchData = async () => {
      try {
        const response: any = await axiosClient.get(`/types/${id}`);
        if (response.success) {
          setData(response.data);
        } else {
          message.error(response.message || 'Không tìm thấy dữ liệu');
          navigate('/types');
        }
      } catch (error: any) {
        message.error(error.message || 'Lỗi kết nối máy chủ');
        navigate('/types');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, user]);

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.put(`/types/${id}`, values);
      if (response.success) {
        message.success('Cập nhật loại địa điểm thành công!');
        navigate('/types');
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
        <Title level={3}>Chỉnh Sửa Loại Địa Điểm</Title>
      </div>
      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <TypeForm initialValues={data} onFinish={handleFinish} isEdit={true} />
        )}
      </Card>
    </div>
  );
}
