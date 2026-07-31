import React, { useEffect, useState } from 'react';
import { Card, Typography, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import UnitForm from './UnitForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function UnitEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initialValues, setInitialValues] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role?.name !== 'Admin') return;
    const fetchData = async () => {
      try {
        const response: any = await axiosClient.get(`/units/${id}`);
        if (response.success) {
          setInitialValues(response.data);
        } else {
          message.error(response.message || 'Không tìm thấy đơn vị tính');
          navigate('/units');
        }
      } catch (error: any) {
        message.error(error.message || 'Có lỗi xảy ra');
        navigate('/units');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, navigate, user]);

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.put(`/units/${id}`, values);
      if (response.success) {
        message.success('Cập nhật đơn vị tính thành công!');
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
        <Title level={3}>Chỉnh sửa Đơn vị tính</Title>
      </div>
      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <UnitForm initialValues={initialValues} onFinish={handleFinish} isEdit={true} />
        )}
      </Card>
    </div>
  );
}
