import React from 'react';
import { Typography } from 'antd';
import { useAuth } from '../../providers/AuthProvider';

const { Title } = Typography;

export default function DashboardOverview() {
  const { user } = useAuth();

  return (
    <div>
      <Title level={2}>Chào mừng trở lại, {user?.fullName || user?.email}!</Title>
      <p>Đây là trang quản trị dành cho {user?.role?.name || 'bạn'}.</p>
    </div>
  );
}
