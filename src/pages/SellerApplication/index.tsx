import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Typography, Space, Popconfirm, message, Tag, Modal, Input, Descriptions } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../providers/AuthProvider';
import NotPermissionPage from '../NotPermissionPage';

const { Title } = Typography;
const { TextArea } = Input;

export default function SellerApplicationList() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response: any = await axiosClient.get('/admin/seller-applications');
      if (response.success) {
        setData(response.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể lấy dữ liệu đơn đăng ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.name === 'Admin') {
      fetchData();
    }
  }, [user]);

  if (user?.role?.name !== 'Admin') {
    return <NotPermissionPage />;
  }

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      const response: any = await axiosClient.put(`/admin/seller-applications/${id}`, {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason : null,
      });

      if (response.success) {
        message.success(response.message);
        setIsModalVisible(false);
        setRejectionReason('');
        fetchData();
      } else {
        message.error(response.message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const showDetailModal = (record: any) => {
    setSelectedApp(record);
    setRejectionReason('');
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Tên cửa hàng',
      dataIndex: 'shop_name',
      key: 'shop_name',
      render: (text: string) => <b>{text}</b>
    },
    {
      title: 'Người đăng ký',
      key: 'user',
      render: (_: any, record: any) => (
        <span>{record.user?.username || record.user?.email || 'N/A'}</span>
      )
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone_number',
      key: 'phone_number',
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (dateStr: string) => new Date(dateStr).toLocaleString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        switch (status) {
          case 'pending': return <Tag color="orange">Đang chờ duyệt</Tag>;
          case 'approved': return <Tag color="green">Đã duyệt</Tag>;
          case 'rejected': return <Tag color="red">Từ chối</Tag>;
          default: return <Tag>{status}</Tag>;
        }
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            style={{ color: '#1890ff' }}
            onClick={() => showDetailModal(record)}
          >
            Xem & Duyệt
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Đơn Đăng Ký Mở Cửa Hàng</Title>
      </div>

      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Chi tiết Đơn đăng ký cửa hàng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Tên cửa hàng"><b>{selectedApp.shop_name}</b></Descriptions.Item>
              <Descriptions.Item label="Người đăng ký">{selectedApp.user?.username || selectedApp.user?.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedApp.phone_number}</Descriptions.Item>
              <Descriptions.Item label="Mô tả / Ngành hàng">{selectedApp.description || 'Không có mô tả'}</Descriptions.Item>
              
              {selectedApp.social_media && (
                <Descriptions.Item label="Mạng xã hội">
                  Facebook: <a href={selectedApp.social_media.facebook} target="_blank" rel="noreferrer">{selectedApp.social_media.facebook || 'N/A'}</a>
                  <br />
                  Zalo: {selectedApp.social_media.zalo || 'N/A'}
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Giấy tờ định danh">
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedApp.documents?.id_front && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 5px' }}>Mặt trước</p>
                      <a href={selectedApp.documents.id_front} target="_blank" rel="noreferrer">
                        <img src={selectedApp.documents.id_front} alt="ID Front" style={{ height: '100px', objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                      </a>
                    </div>
                  )}
                  {selectedApp.documents?.id_back && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 5px' }}>Mặt sau</p>
                      <a href={selectedApp.documents.id_back} target="_blank" rel="noreferrer">
                        <img src={selectedApp.documents.id_back} alt="ID Back" style={{ height: '100px', objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                      </a>
                    </div>
                  )}
                </div>
              </Descriptions.Item>
            </Descriptions>

            {selectedApp.status === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <p><b>Quyết định xét duyệt:</b></p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Popconfirm
                    title="Xác nhận duyệt đơn đăng ký này?"
                    description="Người dùng này sẽ được cấp quyền Seller ngay lập tức."
                    onConfirm={() => handleUpdateStatus(selectedApp.id, 'approved')}
                    okText="Đồng ý"
                    cancelText="Hủy"
                  >
                    <Button type="primary" icon={<CheckCircleOutlined />} style={{ backgroundColor: '#52c41a' }}>
                      Duyệt & Cấp Quyền Seller
                    </Button>
                  </Popconfirm>
                  
                  <div style={{ display: 'flex', flex: 1, gap: '10px' }}>
                    <Input 
                      placeholder="Nhập lý do từ chối (bắt buộc nếu từ chối)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <Button danger icon={<CloseCircleOutlined />} onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}>
                      Từ chối
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {selectedApp.status === 'rejected' && (
              <div style={{ marginTop: '10px', color: 'red' }}>
                <b>Lý do đã từ chối:</b> {selectedApp.rejection_reason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
