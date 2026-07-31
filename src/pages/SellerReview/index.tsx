import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Space, message, Modal, Form, Input, Tag, Rate, Image } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

export default function SellerReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentReview, setCurrentReview] = useState<any>(null);

  const [form] = Form.useForm();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get('/seller/reviews');
      if (res?.success) {
        setReviews(res.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể lấy danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openReplyModal = (record: any) => {
    setCurrentReview(record);
    form.resetFields();
    form.setFieldsValue({ reply_message: record.reply_message || '' });
    setModalVisible(true);
  };

  const onFinish = async (values: any) => {
    if (!currentReview) return;
    try {
      setSubmitting(true);
      const payload = {
        reply_message: values.reply_message,
      };

      const res: any = await axiosClient.put(`/seller/reviews/${currentReview.id}`, payload);
      if (res?.success) {
        message.success('Phản hồi đánh giá thành công');
        setModalVisible(false);
        fetchReviews();
      } else {
        message.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
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
      render: (text: string, record: any) => (
        <Tag color={record.reviewable_type === 'Shop' || record.reviewable_type === 'App\\Models\\Shop' ? 'blue' : 'orange'}>
          {text}
        </Tag>
      )
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
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{content}</p>
          {record.list_image && record.list_image.length > 0 && (
            <Space style={{ marginTop: 8 }} wrap>
              {record.list_image.map((img: string, idx: number) => (
                <Image key={idx} width={40} height={40} src={img} style={{ objectFit: 'cover', borderRadius: 4 }} />
              ))}
            </Space>
          )}
        </div>
      )
    },
    {
      title: 'Trạng thái phản hồi',
      dataIndex: 'reply_message',
      key: 'reply_message',
      render: (reply: string) => (
        reply ? <Tag color="green">Đã phản hồi</Tag> : <Tag color="default">Chưa phản hồi</Tag>
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
          <Button 
            type={record.reply_message ? "default" : "primary"} 
            ghost={!record.reply_message} 
            icon={<MessageOutlined />} 
            onClick={() => openReplyModal(record)}
          >
            {record.reply_message ? 'Sửa phản hồi' : 'Phản hồi'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Quản lý Đánh giá</h2>
      </div>

      <Card>
        <Table
          dataSource={reviews}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Phản hồi khách hàng"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {currentReview && (
          <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <strong>{currentReview.user?.name}</strong>
              <Rate disabled defaultValue={currentReview.rating} style={{ fontSize: 12 }} />
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{currentReview.review_content}</p>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Nội dung phản hồi của bạn"
            name="reply_message"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung phản hồi!' }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập câu trả lời lịch sự để phản hồi lại đánh giá này..." />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Gửi phản hồi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
