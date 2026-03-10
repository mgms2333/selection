import { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Button, Space, Input, message, Spin } from 'antd';
import { PlayCircleOutlined, HistoryOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/selection';
import type { WorkstationType } from '../api/selection';

const { Title, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [workstationTypes, setWorkstationTypes] = useState<WorkstationType[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWorkstationTypes();
  }, []);

  const loadWorkstationTypes = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkstationTypes();
      setWorkstationTypes(data);
    } catch (error) {
      message.error('加载工作站类型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!employeeId.trim()) {
      message.warning('请输入工号');
      return;
    }
    if (!employeeName.trim()) {
      message.warning('请输入姓名');
      return;
    }
    if (!selectedType) {
      message.warning('请选择工作站类型');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.createSession({
        employee_id: employeeId,
        employee_name: employeeName,
        workstation_type_id: selectedType
      });
      
      message.success('创建选型会话成功');
      navigate(`/selection/flow/${result.session_id}`);
    } catch (error) {
      message.error('创建会话失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title level={2}>产品选型系统</Title>
        <Paragraph type="secondary">
          码垛/拆垛工作站智能选型，快速配置您的自动化解决方案
        </Paragraph>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>请填写基本信息</Title>
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>工号 *</label>
              <Input
                placeholder="请输入工号"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                size="large"
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>姓名 *</label>
              <Input
                placeholder="请输入姓名"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                size="large"
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>选择工作站类型</Title>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {workstationTypes.map((type) => (
              <Col xs={24} sm={12} key={type.id}>
                <Card
                  hoverable
                  style={{
                    border: selectedType === type.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    background: selectedType === type.id ? '#e6f7ff' : '#fff',
                  }}
                  styles={{ body: { padding: '20px' } }}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <ShopOutlined style={{ fontSize: '36px', color: '#1890ff' }} />
                    <div>
                      <Title level={5} style={{ margin: 0 }}>{type.name}</Title>
                      <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
                        {type.description}
                      </Paragraph>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleStart}
            loading={submitting}
            disabled={!employeeId || !employeeName || !selectedType}
          >
            开始选型
          </Button>
          <Button
            size="large"
            icon={<HistoryOutlined />}
            onClick={() => navigate('/history')}
          >
            历史记录
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Home;