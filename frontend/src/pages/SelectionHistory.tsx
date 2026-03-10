import { Typography, Table, Button, Space, Tag, Card } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

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
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已完成' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">
            查看
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>选型历史</Title>
      
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