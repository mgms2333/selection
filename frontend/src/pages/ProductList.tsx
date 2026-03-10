import { Typography, Card, List, Button, Space, Tag, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelectionStore } from '../store/selectionStore';
import { PlusOutlined, ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

// 模拟产品数据
const mockProducts = [
  { id: '1', name: '伺服电机 ASM-100', category: '电机', specs: '功率: 100W, 电压: 220V', price: 1200 },
  { id: '2', name: '伺服电机 ASM-200', category: '电机', specs: '功率: 200W, 电压: 220V', price: 1800 },
  { id: '3', name: '行星减速机 PR-50', category: '减速机', specs: '减速比: 50:1, 扭矩: 50N·m', price: 800 },
  { id: '4', name: '行星减速机 PR-100', category: '减速机', specs: '减速比: 100:1, 扭矩: 100N·m', price: 1200 },
  { id: '5', name: '光电传感器 PS-100', category: '传感器', specs: '类型: 对射型, 响应: <1ms', price: 150 },
  { id: '6', name: '接近传感器 PS-200', category: '传感器', specs: '类型: 电感式, 响应: <0.5ms', price: 80 },
  { id: '7', name: 'PLC控制器 PLC-16', category: '控制器', specs: '通道: 16路, 协议: Modbus RTU/TCP', price: 3500 },
  { id: '8', name: 'PLC控制器 PLC-32', category: '控制器', specs: '通道: 32路, 协议: EtherNet/IP', price: 5800 },
  { id: '9', name: '标准气缸 SC-32x150', category: '气动元件', specs: '缸径: 32mm, 行程: 150mm', price: 280 },
  { id: '10', name: '标准气缸 SC-50x200', category: '气动元件', specs: '缸径: 50mm, 行程: 200mm', price: 420 },
];

const ProductList = () => {
  const navigate = useNavigate();
  const addItem = useSelectionStore((state) => state.addItem);
  const items = useSelectionStore((state) => state.items);

  const handleAddToSelection = (product: typeof mockProducts[0]) => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      specs: { specs: product.specs, category: product.category },
    });
    message.success(`已添加 ${product.name} 到选型单`);
  };

  const totalItems = items.length;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>产品列表</Title>
        <Button 
          type="primary" 
          icon={<ShoppingCartOutlined />}
          onClick={() => navigate('/selection')}
        >
          选型单 ({totalItems})
        </Button>
      </div>
      
      <Search 
        placeholder="搜索产品名称或分类..." 
        enterButton={<SearchOutlined />}
        style={{ marginBottom: '24px', maxWidth: '400px' }} 
      />

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
        dataSource={mockProducts}
        renderItem={(product) => (
          <List.Item>
            <Card
              hoverable
              styles={{ body: { padding: '16px' } }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text strong style={{ fontSize: '16px' }}>{product.name}</Text>
                <Tag color="blue">{product.category}</Tag>
              </div>
              <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                {product.specs}
              </Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <Text type="danger" strong style={{ fontSize: '16px' }}>¥{product.price}</Text>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => handleAddToSelection(product)}
                >
                  添加
                </Button>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={() => navigate('/selection/new')}>
            去选型页面
          </Button>
          <Button onClick={() => navigate('/selection')}>
            查看选型单
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ProductList;