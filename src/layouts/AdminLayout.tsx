import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, theme, Spin } from 'antd';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  ShoppingOutlined,
  MessageOutlined,
  GiftOutlined,
  HeartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuth } from '../providers/AuthProvider';
import NotPermissionPage from '../pages/NotPermissionPage';

const { Header, Sider, Content } = Layout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: logout,
    },
  ];

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />

  </div>;
  if (!user) return null;
  if (user?.role?.name === "User") {
    return (
      <NotPermissionPage />
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          } else {
            setCollapsed(false);
          }
        }}
        theme="light"
        style={{ boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)', zIndex: 10 }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <h2 style={{ margin: 0, color: '#1890ff', whiteSpace: 'nowrap' }}>
            {collapsed ? 'HT' : 'Hà Tĩnh Travel'}
          </h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={[
            {
              key: '/',
              icon: <DashboardOutlined />,
              label: 'Tổng quan',
            },
            user?.role?.name === 'Seller' ? {
              key: '/my-shop',
              icon: <ShopOutlined />,
              label: 'Cửa hàng của tôi',
            } : null,
            user?.role?.name === 'Seller' ? {
              key: '/my-products',
              icon: <ShoppingOutlined />,
              label: 'Sản phẩm của tôi',
            } : null,
            user?.role?.name === 'Seller' ? {
              key: '/my-reviews',
              icon: <MessageOutlined />,
              label: 'Quản lý đánh giá',
            } : null,
            user?.role?.name !== 'Seller' ? {
              key: '/users',
              icon: <UserOutlined />,
              label: 'Người dùng',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/seller-applications',
              icon: <FolderOpenOutlined />,
              label: 'Đơn đăng ký cửa hàng',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/languages',
              icon: <GlobalOutlined />,
              label: 'Ngôn ngữ',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/types',
              icon: <AppstoreOutlined />,
              label: 'Loại địa điểm',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/categories',
              icon: <FolderOpenOutlined />,
              label: 'Danh mục',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/attractions',
              icon: <EnvironmentOutlined />,
              label: 'Điểm du lịch',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/units',
              icon: <AppstoreOutlined />,
              label: 'Đơn vị tính',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/local-specialties',
              icon: <GiftOutlined />,
              label: 'Đặc sản địa phương',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/cultural-arts',
              icon: <HeartOutlined />,
              label: 'Văn hóa nghệ thuật',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/reviews',
              icon: <MessageOutlined />,
              label: 'Quản lý đánh giá',
            } : null,
            user?.role?.name === 'Admin' ? {
              key: '/blogs',
              icon: <FileTextOutlined />,
              label: 'Quản lý Blog',
            } : null,
          ].filter(Boolean) as any}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 1 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ paddingRight: 24 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" style={{ height: 'auto', padding: '4px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1890ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <span style={{ display: collapsed ? 'none' : 'inline' }}>{user?.fullName || user?.email}</span>
                </div>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {/* React Router sẽ nhét nội dung các trang con (Dashboard, User...) vào cái Outlet này */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
