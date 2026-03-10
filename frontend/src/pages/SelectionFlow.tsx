import { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Card, Row, Col, Button, Space, message, Spin, Tag, 
  Steps, List, Divider, Alert, Badge
} from 'antd';
import { 
  LeftOutlined, RightOutlined, CheckOutlined, ShoppingCartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/selection';
import type { SelectionStep, StepOption, SessionInfo } from '../api/selection';

const { Title, Paragraph, Text } = Typography;

const SelectionFlow = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [steps, setSteps] = useState<SelectionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [options, setOptions] = useState<StepOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [autoBindings, setAutoBindings] = useState<any[]>([]);

  // 加载会话信息和步骤
  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    setLoading(true);
    try {
      const sessionData = await api.getSession(sessionId!);
      setSession(sessionData);
      
      const stepsData = await api.getWorkstationSteps(sessionData.workstation_type_id);
      setSteps(stepsData);
      
      // 加载已有选择
      const sessionSelections = await api.getSessionSelections(sessionId!);
      const selectionsMap: Record<number, number[]> = {};
      sessionSelections.forEach((sel: any) => {
        if (!selectionsMap[sel.step_id]) {
          selectionsMap[sel.step_id] = [];
        }
        selectionsMap[sel.step_id].push(sel.option_id);
      });
      setSelections(selectionsMap);
      
    } catch (error) {
      message.error('加载会话信息失败');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  // 加载当前步骤选项
  useEffect(() => {
    if (steps.length > 0 && sessionId) {
      loadStepOptions();
    }
  }, [currentStepIndex, steps, sessionId]);

  const loadStepOptions = async () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep || !sessionId) return;
    
    setOptionsLoading(true);
    try {
      const optionsData = await api.getStepOptions(currentStep.id, sessionId);
      setOptions(optionsData);
    } catch (error) {
      message.error('加载选项失败');
    } finally {
      setOptionsLoading(false);
    }
  };

  const currentStep = steps[currentStepIndex];
  const selectedOptionIds = currentStep ? (selections[currentStep.id] || []) : [];

  const handleOptionSelect = (optionId: number) => {
    if (!currentStep) return;
    
    const stepId = currentStep.id;
    
    if (currentStep.is_multiple) {
      // 多选模式
      setSelections(prev => {
        const current = prev[stepId] || [];
        const newSelection = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        
        // 检查最大选择数量
        if (newSelection.length > currentStep.max_selections) {
          message.warning(`最多只能选择 ${currentStep.max_selections} 个选项`);
          return prev;
        }
        
        return { ...prev, [stepId]: newSelection };
      });
    } else {
      // 单选模式
      setSelections(prev => ({ ...prev, [stepId]: [optionId] }));
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = async () => {
    if (!currentStep || !sessionId) return;
    
    // 检查是否必选
    if (currentStep.is_required && selectedOptionIds.length < currentStep.min_selections) {
      message.warning(`请至少选择 ${currentStep.min_selections} 个选项`);
      return;
    }
    
    // 保存当前步骤选择
    setSubmitting(true);
    try {
      const result = await api.saveSelection(sessionId, {
        step_id: currentStep.id,
        option_ids: selectedOptionIds
      });
      
      if (result.auto_bindings && result.auto_bindings.length > 0) {
        setAutoBindings(prev => [...prev, ...result.auto_bindings]);
        message.success(`已自动添加 ${result.auto_bindings.length} 个配套组件`);
      }
      
      // 移动到下一步
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // 最后一步，完成选型
        await api.completeSession(sessionId);
        message.success('选型完成！');
        navigate(`/selection/result/${sessionId}`);
      }
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalPrice = useCallback(() => {
    let total = 0;
    Object.values(selections).forEach(optionIds => {
      optionIds.forEach(optId => {
        const opt = options.find(o => o.id === optId);
        if (opt) {
          total += opt.price;
        }
      });
    });
    return total;
  }, [selections, options]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!session || steps.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={4}>会话不存在或已过期</Title>
        <Button type="primary" onClick={() => navigate('/home')}>返回首页</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 顶部信息 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {session.workstation_type_name} - 选型配置
            </Title>
            <Text type="secondary">
              工号: {session.employee_id} | 姓名: {session.employee_name}
            </Text>
          </Col>
          <Col>
            <Badge count={Object.values(selections).flat().length}>
              <ShoppingCartOutlined style={{ fontSize: '24px' }} />
            </Badge>
          </Col>
        </Row>
      </Card>

      {/* 步骤指示器 */}
      <Steps
        current={currentStepIndex}
        items={steps.map((step, index) => ({
          title: step.step_name,
          status: index < currentStepIndex ? 'finish' : index === currentStepIndex ? 'process' : 'wait',
        }))}
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={24}>
        {/* 左侧：选项列表 */}
        <Col xs={24} lg={16}>
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4}>
                {currentStep?.step_name}
                {currentStep?.is_required && <Tag color="red" style={{ marginLeft: '8px' }}>必选</Tag>}
                {currentStep?.is_multiple && <Tag color="blue" style={{ marginLeft: '4px' }}>可多选</Tag>}
              </Title>
              <Text type="secondary">
                {currentStep?.is_multiple 
                  ? `请选择 ${currentStep.min_selections}-${currentStep.max_selections} 个选项`
                  : '请选择一个选项'
                }
              </Text>
            </div>

            {currentStep?.is_required && selectedOptionIds.length < currentStep.min_selections && (
              <Alert
                message={`此步骤为必选项，请至少选择 ${currentStep.min_selections} 个选项`}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            {optionsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin />
              </div>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 2, xl: 3 }}
                dataSource={options.filter(opt => !opt.is_filtered)}
                renderItem={(option) => {
                  const isSelected = selectedOptionIds.includes(option.id);
                  const specs = option.specifications || {};
                  
                  return (
                    <List.Item>
                      <Card
                        hoverable
                        style={{
                          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          background: isSelected ? '#e6f7ff' : '#fff',
                        }}
                        styles={{ body: { padding: '16px' } }}
                        onClick={() => handleOptionSelect(option.id)}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong>{option.name}</Text>
                          {isSelected && <CheckOutlined style={{ color: '#1890ff', marginLeft: '8px' }} />}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <Tag color="blue">{option.model}</Tag>
                        </div>
                        {option.description && (
                          <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '8px' }} ellipsis={{ rows: 2 }}>
                            {option.description}
                          </Paragraph>
                        )}
                        {Object.keys(specs).length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            {Object.entries(specs).slice(0, 3).map(([key, value]) => (
                              <Text key={key} type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                                {key}: {String(value)}
                              </Text>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="danger" strong>¥{option.price.toLocaleString()}</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>{option.material_code}</Text>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        {/* 右侧：已选汇总 */}
        <Col xs={24} lg={8}>
          <Card title="已选配置">
            {steps.map((step) => {
              const stepSelections = selections[step.id] || [];
              if (stepSelections.length === 0) return null;
              
              return (
                <div key={step.id} style={{ marginBottom: '16px' }}>
                  <Text strong>{step.step_name}</Text>
                  {stepSelections.map(optId => {
                    const opt = options.find(o => o.id === optId);
                    return opt ? (
                      <div key={optId} style={{ marginLeft: '8px', marginTop: '4px' }}>
                        <Tag color="green">{opt.name}</Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          ¥{opt.price.toLocaleString()}
                        </Text>
                      </div>
                    ) : null;
                  })}
                </div>
              );
            })}

            {autoBindings.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary">
                  <InfoCircleOutlined style={{ marginRight: '4px' }} />
                  自动添加的配套组件:
                </Text>
                {autoBindings.map((binding, index) => (
                  <div key={index} style={{ marginLeft: '8px', marginTop: '4px' }}>
                    <Tag color="orange">{binding.name}</Tag>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {binding.material_code} x {binding.quantity}
                    </Text>
                  </div>
                ))}
              </>
            )}

            <Divider style={{ margin: '16px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">预估总价: </Text>
              <Text type="danger" strong style={{ fontSize: '18px' }}>
                ¥{getTotalPrice().toLocaleString()}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 底部操作按钮 */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space size="large">
          <Button
            size="large"
            icon={<LeftOutlined />}
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            上一步
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            loading={submitting}
            disabled={currentStep?.is_required && selectedOptionIds.length < (currentStep?.min_selections || 1)}
          >
            {currentStepIndex === steps.length - 1 ? '完成选型' : '下一步'}
            {currentStepIndex < steps.length - 1 && <RightOutlined />}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SelectionFlow;