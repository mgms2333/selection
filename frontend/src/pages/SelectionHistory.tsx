import { Typography, Table, Button, Space, Tag, Card, message, Popconfirm } from 'antd';
import { EyeOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

// 模拟历史数据
const mockHistory = [
  { 
    id: '1', 
    name: '项目 A 配置', 
    itemCount: 5, 
    createdAt: '2024-01-15 10:30', 
    status: 'completed' 
  },
  { 
    id: '2', 
    name: '项目 B 配置', 
    itemCount: 3, 
    createdAt: '2024-01-14 14:20', 
    status: 'draft' 
  },
  { 
    id: '3', 
    name: '产线改造方案', 
    itemCount: 12, 
    createdAt: '2024-01-10 09:15', 
    status: 'completed' 
  },
];

const SelectionHistory = () => {
  const navigate = useNavigate();

  const handleView = (id: string) => {
    message.info(`查看选型 ${id}`);
    // TODO: 实现查看功能
  };

  const handleDelete = (id: string) => {
    message.success(`已删除选型 ${id}`);
    // TODO: 实现删除功能
  };

  const columns: ColumnsType<typeof mockHistory[0]> = [
    {
      title: '选型名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '产品数量',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已完成' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleView(record.id)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定要删除这条选型记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              icon={<DeleteOutlined />} 
              size="small"
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>选型历史</Title>
          <Paragraph type="secondary">查看和管理历史选型记录</Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={() => navigate('/selection/new')}
        >
          新建选型
        </Button>
      </div>
      
      <Card>
        <Table 
          columns={columns} 
          dataSource={mockHistory} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default SelectionHistory;