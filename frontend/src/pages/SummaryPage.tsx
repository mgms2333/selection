import { Typography, Card, Table, Space, Button, Divider, Descriptions, Empty, Statistic, Row, Col, message } from 'antd';
import { useSelectionStore, type SelectionItem } from '../store/selectionStore';
import { useNavigate } from 'react-router-dom';
import { FileTextOutlined, ExportOutlined, EditOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SummaryPage = () => {
  const navigate = useNavigate();
  const { items, selectionName, remarks, currentSelectionId } = useSelectionStore();

  // 计算统计数据
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: SelectionItem, index: number) => index + 1,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '规格',
      dataIndex: 'specs',
      key: 'specs',
      render: (specs: Record<string, unknown>) => {
        if (!specs) return '-';
        const specsText = Object.entries(specs)
          .filter(([key]) => key !== 'specs')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        return specsText || specs.specs || '-';
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (unit: string) => unit || '件',
    },
  ];

  // 导出功能
  const handleExport = () => {
    const exportData = {
      选型名称: selectionName || '未命名选型',
      创建时间: new Date().toLocaleString('zh-CN'),
      备注: remarks || '无',
      产品列表: items.map((item, index) => ({
        序号: index + 1,
        产品名称: item.productName,
        规格: item.specs ? JSON.stringify(item.specs) : '-',
        数量: item.quantity,
        单位: item.unit || '件',
      })),
    };

    // 创建 JSON 文件下载
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectionName || '选型单'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    message.success('导出成功');
  };

  // 复制到剪贴板
  const handleCopy = () => {
    const text = `选型名称: ${selectionName || '未命名选型'}
备注: ${remarks || '无'}

产品列表:
${items.map((item, index) => `${index + 1}. ${item.productName} - 数量: ${item.quantity} ${item.unit || '件'}`).join('\n')}

总计: ${totalItems} 种产品，${totalQuantity} 件`;

    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <Title level={2}>选型汇总</Title>
        <Empty
          description="暂无选型数据"
          image={<ShoppingCartOutlined style={{ fontSize: '64px', color: '#ccc' }} />}
        >
          <Button type="primary" onClick={() => navigate('/products')}>
            去选择产品
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2}>
        <FileTextOutlined style={{ marginRight: '8px' }} />
        选型汇总
      </Title>

      {/* 基本信息 */}
      <Card style={{ marginBottom: '16px' }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="选型名称">
            {selectionName || (
              <Text type="secondary">未命名选型</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="选型 ID">
            {currentSelectionId || (
              <Text type="secondary">新建选型</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date().toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Text type="success">待提交</Text>
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {remarks || (
              <Text type="secondary">无备注</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="产品种类"
              value={totalItems}
              suffix="种"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="产品总数"
              value={totalQuantity}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="选型状态"
              value="待确认"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 产品列表 */}
      <Card title="产品列表" style={{ marginBottom: '16px' }}>
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* 操作按钮 */}
      <Card>
        <Space split={<Divider type="vertical" />}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate('/selection')}
          >
            编辑选型
          </Button>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            导出 JSON
          </Button>
          <Button onClick={handleCopy}>
            复制到剪贴板
          </Button>
          <Button onClick={() => navigate('/products')}>
            继续添加产品
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default SummaryPage;