import React, { useEffect, useState } from 'react';
import { Card, Typography, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import LanguageForm from './LanguageForm';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;

export default function LanguageEditPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role?.name !== 'Admin') return;

    const fetchData = async () => {
      try {
        const response: any = await axiosClient.get(`/languages/${code}`);
        if (response.success) {
          setData(response.data);
        } else {
          message.error(response.message || 'Không tìm thấy dữ liệu');
          navigate('/languages');
        }
      } catch (error: any) {
        message.error(error.message || 'Lỗi kết nối máy chủ');
        navigate('/languages');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [code, navigate, user]);

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleFinish = async (values: any) => {
    try {
      const response: any = await axiosClient.put(`/languages/${code}`, values);
      if (response.success) {
        message.success('Cập nhật ngôn ngữ thành công!');
        navigate('/languages');
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
        <Title level={3}>Chỉnh Sửa Ngôn Ngữ</Title>
      </div>
      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <LanguageForm initialValues={data} onFinish={handleFinish} isEdit={true} />
        )}
      </Card>
    </div>
  );
}
