import { Typography, Button, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>产品选型系统</Title>
      <Paragraph>欢迎使用产品选型系统，快速选择并管理您的产品配置。</Paragraph>
      
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card 
            hoverable 
            onClick={() => navigate('/products')}
          >
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <ShoppingOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <Title level={4} style={{ marginTop: '16px' }}>开始选型</Title>
              <Paragraph>浏览产品列表，添加到选型单</Paragraph>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            hoverable 
            onClick={() => navigate('/history')}
          >
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <HistoryOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              <Title level={4} style={{ marginTop: '16px' }}>选型历史</Title>
              <Paragraph>查看和管理历史选型记录</Paragraph>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: '24px' }}>
        <Button type="primary" size="large" onClick={() => navigate('/selection')}>
          查看当前选型
        </Button>
      </div>
    </div>
  );
};

export default Home;