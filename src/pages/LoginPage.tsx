import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, Form, message, Row, Col, Checkbox, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, GithubOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import Cookies from 'js-cookie';
import { useAuth } from '../providers/AuthProvider';

const { Title, Text } = Typography;

export default function Login() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const data: any = await axiosClient.post('/admin-auth/login', {
                email: values.email,
                password: values.password,
            });

            if (data.success) {
                message.success('Đăng nhập thành công!');

                const expires = new Date(Date.now() + 55 * 60 * 1000); // Tăng lên 55 phút để khớp với token Supabase (1 tiếng)
                const cookieOptions: Cookies.CookieAttributes = { 
                    expires, 
                    secure: window.location.protocol === 'https:', 
                    sameSite: 'strict' 
                };
                Cookies.set('admin_access_token', data.access_token, cookieOptions);
                
                if (data.refresh_token) {
                    Cookies.set('admin_refresh_token', data.refresh_token, { 
                        expires: values.remember ? 30 : 1, // 30 days if remember, else 1 day
                        secure: window.location.protocol === 'https:', 
                        sameSite: 'strict' 
                    });
                }

                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);

                navigate('/');
            } else {
                message.error(data.message || 'Sai tài khoản hoặc mật khẩu.');
            }
        } catch (error: any) {
            message.error(error?.message || 'Sai tài khoản hoặc mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row style={{ minHeight: '100vh', width: '100%' }}>
            {/* Cột Trái: Hình ảnh và Branding (Sẽ ẩn trên màn hình nhỏ) */}
            <Col xs={0} md={12} lg={14} style={{
                position: 'relative',
                backgroundImage: 'url("https://images.unsplash.com/photo-1557053964-937650b6338c?q=80&w=2000&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '60px',
            }}>
                {/* Lớp phủ Gradient mờ */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
                    zIndex: 1
                }} />
                
                <div style={{ position: 'relative', zIndex: 2, color: 'white' }}>
                    <div style={{
                        width: 48, height: 48, 
                        background: '#1890ff', 
                        borderRadius: 12, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 'bold', marginBottom: 24
                    }}>
                        HT
                    </div>
                    <Title style={{ color: 'white', fontSize: '3rem', marginBottom: 16 }}>Hà Tĩnh Travel</Title>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.2rem', maxWidth: 600, display: 'block' }}>
                        Hệ thống quản trị tổng thể dành cho các đối tác, nhà cung cấp và quản trị viên của nền tảng du lịch hàng đầu Hà Tĩnh.
                    </Text>
                </div>
            </Col>

            {/* Cột Phải: Form Đăng Nhập */}
            <Col xs={24} md={12} lg={10} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#ffffff',
                padding: '40px'
            }}>
                <div style={{ width: '100%', maxWidth: 420 }}>
                    <div style={{ marginBottom: 40 }}>
                        <Title level={2} style={{ marginBottom: 8 }}>Chào mừng trở lại! 👋</Title>
                        <Text type="secondary" style={{ fontSize: 16 }}>Vui lòng đăng nhập vào tài khoản của bạn.</Text>
                    </div>

                    <Form
                        name="login_form"
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ remember: true }}
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            label={<span style={{ fontWeight: 500 }}>Email</span>}
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không hợp lệ!' }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                                placeholder="admin@hatinhtravel.com"
                                style={{ borderRadius: 8 }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                            style={{ marginBottom: 16 }}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                                placeholder="••••••••"
                                style={{ borderRadius: 8 }}
                            />
                        </Form.Item>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                            </Form.Item>
                            <a style={{ color: '#1890ff', fontWeight: 500 }}>Quên mật khẩu?</a>
                        </div>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{ borderRadius: 8, height: 48, fontSize: 16, fontWeight: 600, boxShadow: '0 4px 14px 0 rgba(24,144,255,0.39)' }}
                            >
                                Đăng Nhập
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider plain>
                        <Text type="secondary" style={{ fontSize: 12 }}>Hoặc đăng nhập với</Text>
                    </Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Button block icon={<GoogleOutlined />} style={{ height: 44, borderRadius: 8 }}>Google</Button>
                        </Col>
                        <Col span={12}>
                            <Button block icon={<GithubOutlined />} style={{ height: 44, borderRadius: 8 }}>Github</Button>
                        </Col>
                    </Row>
                </div>
            </Col>
        </Row>
    );
}
