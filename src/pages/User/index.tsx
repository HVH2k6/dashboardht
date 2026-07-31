import { useState, useEffect } from 'react';
import { Table, Button, Card, Space, message, Modal, Tag, Input, Form, Select, Switch } from 'antd';
import { EditOutlined, LockOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

const { Option } = Select;

export default function UserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchUsers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get(`/admin/users?page=${page}&limit=${pageSize}`);
      if (res?.success) {
        setUsers(res.data);
        setPagination({
          current: res.pagination.current_page,
          pageSize: pageSize,
          total: res.pagination.total,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể lấy danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res: any = await axiosClient.get('/admin/roles');
      if (res?.success) {
        setRoles(res.data);
      }
    } catch (error) {
      console.error('Error fetching roles', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setModalVisible(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      status: user.status
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingUser) {
        // Update
        const res: any = await axiosClient.put(`/admin/users/${editingUser.id}`, values);
        if (res?.success) {
          message.success('Cập nhật tài khoản thành công');
          setModalVisible(false);
          fetchUsers(pagination.current, pagination.pageSize);
        }
      } else {
        // Create
        const res: any = await axiosClient.post('/admin/users', values);
        if (res?.success) {
          message.success('Tạo tài khoản thành công');
          setModalVisible(false);
          fetchUsers();
        }
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      setLoading(true);
      const newStatus = !user.status;
      const res: any = await axiosClient.put(`/admin/users/${user.id}`, { status: newStatus });
      if (res?.success) {
        message.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản`);
        fetchUsers(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      message.error('Không thể thay đổi trạng thái tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar: string) => (
        <img src={avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=1'} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      )
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phân quyền',
      dataIndex: 'role',
      key: 'role',
      render: (role: any) => role ? <Tag color="blue">{role.name}</Tag> : <Tag>N/A</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => (
        status ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Bị khóa</Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Button 
            danger={record.status} 
            type="default"
            icon={record.status ? <LockOutlined /> : <UnlockOutlined />} 
            onClick={() => handleToggleStatus(record)}
          >
            {record.status ? 'Khóa' : 'Mở khóa'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Quản lý Người dùng</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Thêm người dùng
        </Button>
      </div>

      <Card>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Tên người dùng (Username)"
            rules={[{ required: true, message: 'Vui lòng nhập tên người dùng' }]}
          >
            <Input placeholder="Nhập tên người dùng" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
            rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="Phân quyền (Role)"
          >
            <Select placeholder="Chọn quyền" allowClear>
              {roles.map(r => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái hoạt động"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Bị khóa" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
