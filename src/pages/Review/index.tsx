import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Space, message, Modal, Tag, Rate, Image, Popconfirm } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

export default function AdminReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentReview, setCurrentReview] = useState<any>(null);

  const fetchReviews = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get(`/admin/reviews?page=${page}&limit=${pageSize}`);
      if (res?.success) {
        setReviews(res.data);
        setPagination({
          current: res.pagination.current_page,
          pageSize: pageSize,
          total: res.pagination.total,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể lấy danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchReviews(newPagination.current, newPagination.pageSize);
  };

  const handleDelete = async (id: string) => {
    try {
      const res: any = await axiosClient.delete(`/admin/reviews/${id}`);
      if (res?.success) {
        message.success('Đã xóa đánh giá thành công');
        fetchReviews(pagination.current, pagination.pageSize);
      } else {
        message.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Lỗi hệ thống khi xóa');
    }
  };

  const openDetailModal = (record: any) => {
    setCurrentReview(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <Space>
          <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/miniavs/svg?seed=1'} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <span>{user?.name}</span>
        </Space>
      )
    },
    {
      title: 'Mục đánh giá',
      dataIndex: 'target_name',
      key: 'target_name',
      render: (text: string, record: any) => {
        let color = 'default';
        if (record.reviewable_type?.includes('Shop')) color = 'blue';
        else if (record.reviewable_type?.includes('Product')) color = 'green';
        else if (record.reviewable_type?.includes('LocalSpecialty')) color = 'orange';
        else if (record.reviewable_type?.includes('CulturalArt')) color = 'purple';
        else if (record.reviewable_type?.includes('TouristAttraction')) color = 'cyan';
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />
    },
    {
      title: 'Nội dung',
      dataIndex: 'review_content',
      key: 'review_content',
      render: (content: string, record: any) => (
        <div style={{ maxWidth: 300 }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {content}
          </p>
          {record.list_image && record.list_image.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Tag icon={<EyeOutlined />}>{record.list_image.length} ảnh</Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EyeOutlined />} onClick={() => openDetailModal(record)}>
            Xem chi tiết
          </Button>
          <Popconfirm
            title="Xóa đánh giá này?"
            description="Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Đồng ý xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý Đánh giá toàn hệ thống">
      <Table
        columns={columns}
        dataSource={reviews}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="Chi tiết Đánh giá"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {currentReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={currentReview.user?.avatar_url || 'https://api.dicebear.com/7.x/miniavs/svg?seed=1'} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%' }} />
              <div>
                <h3 style={{ margin: 0 }}>{currentReview.user?.name}</h3>
                <span style={{ color: '#888' }}>{currentReview.created_at}</span>
              </div>
            </div>
            
            <div>
              <strong>Mục được đánh giá: </strong>
              <span style={{ color: '#1890ff' }}>{currentReview.target_name}</span>
            </div>

            <div>
              <Rate disabled defaultValue={currentReview.rating} />
            </div>

            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
              {currentReview.review_content || <em style={{ color: '#aaa' }}>Không có nội dung chữ</em>}
            </div>

            {currentReview.list_image && currentReview.list_image.length > 0 && (
              <div>
                <h4>Hình ảnh đính kèm:</h4>
                <Space wrap>
                  {currentReview.list_image.map((img: string, idx: number) => (
                    <Image key={idx} width={100} height={100} src={img} style={{ objectFit: 'cover', borderRadius: '8px' }} />
                  ))}
                </Space>
              </div>
            )}

            {currentReview.reply_message && (
              <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #1890ff' }}>
                <h4>Phản hồi từ Người bán/Quản lý:</h4>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{currentReview.reply_message}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
