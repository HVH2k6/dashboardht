import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, Button, message, Tabs, Spin } from 'antd';
import axiosClient from '../../api/axiosClient';

interface UnitFormProps {
  initialValues?: any;
  onFinish: (values: any) => Promise<void>;
  isEdit?: boolean;
}

export default function UnitForm({ initialValues, onFinish, isEdit = false }: UnitFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingLang, setFetchingLang] = useState(true);
  const [languages, setLanguages] = useState<any[]>([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response: any = await axiosClient.get('/languages');
        if (response.success) {
          setLanguages(response.data.filter((l: any) => l.is_active));
        }
      } catch (error) {
        message.error('Không thể lấy danh sách ngôn ngữ');
      } finally {
        setFetchingLang(false);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (initialValues && languages.length > 0) {
      const translationsObj: any = {};
      if (initialValues.translations) {
        initialValues.translations.forEach((t: any) => {
          translationsObj[t.language_code] = {
            name: t.name,
          };
        });
      }

      form.setFieldsValue({
        code: initialValues.code,
        is_active: initialValues.is_active,
        translations: translationsObj
      });
    }
  }, [initialValues, form, languages]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const translationsArray = [];
      if (values.translations) {
        for (const code of Object.keys(values.translations)) {
          const t = values.translations[code];
          if (t && t.name) {
            translationsArray.push({
              language_code: code,
              name: t.name,
            });
          }
        }
      }

      if (translationsArray.length === 0) {
        message.error("Vui lòng nhập tên đơn vị tính cho ít nhất 1 ngôn ngữ!");
        return;
      }

      await onFinish({ 
        code: values.code,
        is_active: values.is_active, 
        translations: translationsArray
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingLang) {
    return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  }

  const tabItems = languages.map(lang => ({
    key: lang.code,
    forceRender: true,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {lang.flag_icon && <img src={lang.flag_icon} alt="flag" style={{ width: 20 }} />}
        {lang.name}
      </span>
    ),
    children: (
      <div style={{ marginTop: 16 }}>
        <Form.Item
          name={['translations', lang.code, 'name']}
          label={`Tên đơn vị tính (${lang.name})`}
          rules={[{ required: lang.code === 'vi', message: 'Vui lòng nhập tên!' }]}
        >
          <Input placeholder="Ví dụ: Cái, Chiếc, Kg..." />
        </Form.Item>
      </div>
    )
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ is_active: true }}
      style={{ maxWidth: 800 }}
    >
      <Form.Item
        name="code"
        label="Mã đơn vị tính (Code)"
        rules={[{ required: true, message: 'Vui lòng nhập mã!' }]}
      >
        <Input placeholder="Nhập mã duy nhất (ví dụ: CAI, KILOGRAM)..." />
      </Form.Item>

      <Tabs items={tabItems} type="card" />

      <Form.Item
        name="is_active"
        label="Trạng thái hiển thị"
        valuePropName="checked"
        style={{ marginTop: 24 }}
      >
        <Switch checkedChildren="Đang bật" unCheckedChildren="Đã tắt" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
          {isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
        <Button onClick={() => window.history.back()}>
          Hủy
        </Button>
      </Form.Item>
    </Form>
  );
}
