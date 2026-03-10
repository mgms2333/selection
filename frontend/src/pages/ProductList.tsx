import { Typography, Card, List, Button, Space, Tag, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelectionStore } from '../store/selectionStore';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

// 模拟产品数据
const mockProducts = [
  { id: '1', name: '电机 A-100', category: '电机', specs: '功率: 100W, 电压: 220V' },
  { id: '2', name: '减速机 B-50', category: '减速机', specs: '减速比: 50:1' },
  { id: '3', name: '传感器 C-200', category: '传感器', specs: '类型: 光电, 响应: <1ms' },
  { id: '4', name: '控制器 D-300', category: '控制器', specs: '通道: 16路, 协议: Modbus' },
  { id: '5', name: '气缸 E-150', category: '气动元件', specs: '行程: 150mm, 缸径: 32mm' },
];

const ProductList = () => {
  const navigate = useNavigate();
  const addItem = useSelectionStore((state) => state.addItem);

  const handleAddToSelection = (product: typeof mockProducts[0]) => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      specs: { specs: product.specs, category: product.category },
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>产品列表</Title>
      
      <Space style={{ marginBottom: '16px', width: '100%' }} direction="vertical">
        <Search 
          placeholder="搜索产品..." 
          enterButton 
          style={{ maxWidth: '400px' }} 
        />
      </Space>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
        dataSource={mockProducts}
        renderItem={(product) => (
          <List.Item>
            <Card
              title={product.name}
              extra={<Tag>{product.category}</Tag>}
              actions={[
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => handleAddToSelection(product)}
                >
                  添加
                </Button>,
              ]}
            >
              <p>{product.specs}</p>
            </Card>
          </List.Item>
        )}
      />

      <div style={{ marginTop: '24px' }}>
        <Button onClick={() => navigate('/selection')}>
          查看选型单
        </Button>
      </div>
    </div>
  );
};

export default ProductList;