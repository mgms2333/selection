import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { http } from '../api/request';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await http.post<LoginResponse>('/auth/login', values);
      
      // 存储 token 和用户信息
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      message.success('登录成功');
      navigate('/home');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              产品选型系统
            </Title>
            <Text type="secondary">请登录以继续使用</Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              还没有账号？请联系管理员
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;