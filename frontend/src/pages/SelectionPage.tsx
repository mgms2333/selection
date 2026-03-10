import { useState, useMemo } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Input, 
  Button, 
  Space, 
  Tag, 
  List, 
  InputNumber,
  Empty,
  Divider,
  Badge,
  message,
  Popconfirm,
  Tooltip,
  Select,
  Drawer,
  Descriptions,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ShoppingCartOutlined,
  ClearOutlined,
  SaveOutlined,
  EyeOutlined,
  FilterOutlined,
  DragOutlined
} from '@ant-design/icons';
import { useSelectionStore } from '../store/selectionStore';
import type { SelectionItem } from '../store/selectionStore';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Title, Text } = Typography;
const { Search } = Input;

// 模拟产品数据
const mockProducts = [
  { id: '1', name: '伺服电机 ASM-100', category: '电机', categoryCode: 'MOTOR', specs: { power: '100W', voltage: '220V', speed: '3000rpm' }, price: 1200 },
  { id: '2', name: '伺服电机 ASM-200', category: '电机', categoryCode: 'MOTOR', specs: { power: '200W', voltage: '220V', speed: '3000rpm' }, price: 1800 },
  { id: '3', name: '伺服电机 ASM-400', category: '电机', categoryCode: 'MOTOR', specs: { power: '400W', voltage: '380V', speed: '3000rpm' }, price: 2500 },
  { id: '4', name: '行星减速机 PR-50', category: '减速机', categoryCode: 'REDUCER', specs: { ratio: '50:1', torque: '50N·m' }, price: 800 },
  { id: '5', name: '行星减速机 PR-100', category: '减速机', categoryCode: 'REDUCER', specs: { ratio: '100:1', torque: '100N·m' }, price: 1200 },
  { id: '6', name: '光电传感器 PS-100', category: '传感器', categoryCode: 'SENSOR', specs: { type: '对射型', response: '<1ms', range: '5m' }, price: 150 },
  { id: '7', name: '接近传感器 PS-200', category: '传感器', categoryCode: 'SENSOR', specs: { type: '电感式', response: '<0.5ms', range: '10mm' }, price: 80 },
  { id: '8', name: 'PLC控制器 PLC-16', category: '控制器', categoryCode: 'CONTROLLER', specs: { channels: '16路', protocol: 'Modbus RTU/TCP' }, price: 3500 },
  { id: '9', name: 'PLC控制器 PLC-32', category: '控制器', categoryCode: 'CONTROLLER', specs: { channels: '32路', protocol: 'Modbus RTU/TCP, EtherNet/IP' }, price: 5800 },
  { id: '10', name: '标准气缸 SC-32x150', category: '气动元件', categoryCode: 'PNEUMATIC', specs: { bore: '32mm', stroke: '150mm' }, price: 280 },
  { id: '11', name: '标准气缸 SC-50x200', category: '气动元件', categoryCode: 'PNEUMATIC', specs: { bore: '50mm', stroke: '200mm' }, price: 420 },
  { id: '12', name: '电磁阀岛 VB-8', category: '气动元件', categoryCode: 'PNEUMATIC', specs: { ports: '8位', voltage: '24V DC' }, price: 680 },
];

// 分类选项
const categories = [
  { label: '全部', value: '' },
  { label: '电机', value: 'MOTOR' },
  { label: '减速机', value: 'REDUCER' },
  { label: '传感器', value: 'SENSOR' },
  { label: '控制器', value: 'CONTROLLER' },
  { label: '气动元件', value: 'PNEUMATIC' },
];

// 可排序选型项组件
interface SortableItemProps {
  item: SelectionItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

const SortableSelectionItem = ({ item, onQuantityChange, onRemove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const specsText = item.specs 
    ? Object.entries(item.specs)
        .filter(([key]) => key !== 'specs' && key !== 'category')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';

  return (
    <div ref={setNodeRef} style={style}>
      <List.Item
        style={{ background: isDragging ? '#f0f5ff' : 'transparent' }}
        actions={[
          <InputNumber
            key="quantity"
            min={1}
            max={999}
            value={item.quantity}
            onChange={(val) => onQuantityChange(val || 1)}
            style={{ width: '70px' }}
            size="small"
          />,
          <Tooltip title="删除" key="delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={onRemove}
              size="small"
            />
          </Tooltip>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <span {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: '8px' }}>
              <DragOutlined style={{ color: '#999' }} />
            </span>
          }
          title={
            <Space>
              <Text strong>{item.productName}</Text>
              {item.specs?.category ? <Tag color="blue">{String(item.specs.category)}</Tag> : null}
            </Space>
          }
          description={
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {specsText || String(item.specs?.specs ?? '') || '无规格信息'}
            </Text>
          }
        />
      </List.Item>
    </div>
  );
};

const SelectionPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    selectionName, 
    remarks, 
    addItem, 
    removeItem, 
    updateQuantity, 
    reorderItems,
    setSelectionName,
    setRemarks,
    clearSelection
  } = useSelectionStore();

  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  // 筛选后的产品列表
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = !categoryFilter || product.categoryCode === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchText, categoryFilter]);

  // 统计数据
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const product = mockProducts.find(p => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  // 添加产品到选型
  const handleAddProduct = (product: typeof mockProducts[0]) => {
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
      message.success(`${product.name} 数量已增加`);
    } else {
      addItem({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: '件',
        specs: { ...product.specs, category: product.category },
      });
      message.success(`已添加 ${product.name}`);
    }
  };

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      reorderItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  // 保存选型
  const handleSave = () => {
    if (items.length === 0) {
      message.warning('选型单为空，请先添加产品');
      return;
    }
    if (!selectionName.trim()) {
      message.warning('请填写选型名称');
      return;
    }
    // TODO: 调用 API 保存
    console.log('保存选型:', { selectionName, remarks, items });
    message.success('选型保存成功');
    navigate('/history');
  };

  // 产品卡片
  const ProductCard = ({ product }: { product: typeof mockProducts[0] }) => {
    const inCart = items.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
    
    return (
      <Card
        hoverable
        size="small"
        style={{ height: '100%' }}
        styles={{ body: { padding: '12px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <Text strong ellipsis style={{ flex: 1, marginRight: '8px' }}>
            {product.name}
          </Text>
          <Tag color="blue">{product.category}</Tag>
        </div>
        <div style={{ marginBottom: '8px' }}>
          {Object.entries(product.specs).map(([key, value]) => (
            <Text key={key} type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              {key}: {value}
            </Text>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="danger" strong>¥{product.price}</Text>
          <Badge count={inCart} size="small" offset={[-5, 0]}>
            <Button 
              type="primary" 
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddProduct(product)}
            >
              添加
            </Button>
          </Badge>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Row gutter={24}>
        {/* 左侧：产品列表 */}
        <Col xs={24} lg={16}>
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0, marginBottom: '16px' }}>
                <FilterOutlined style={{ marginRight: '8px' }} />
                产品列表
              </Title>
              <Space wrap style={{ width: '100%' }}>
                <Search
                  placeholder="搜索产品名称或分类..."
                  allowClear
                  style={{ width: 280 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onSearch={setSearchText}
                />
                <Select
                  placeholder="选择分类"
                  allowClear
                  style={{ width: 150 }}
                  value={categoryFilter || undefined}
                  onChange={setCategoryFilter}
                  options={categories}
                />
                <Text type="secondary">
                  共 {filteredProducts.length} 个产品
                </Text>
              </Space>
            </div>
            
            <List
              grid={{ gutter: 12, xs: 1, sm: 2, md: 2, lg: 2, xl: 3, xxl: 4 }}
              dataSource={filteredProducts}
              renderItem={(product) => (
                <List.Item>
                  <ProductCard product={product} />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧：选型单 */}
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>
                  <Badge count={items.length} offset={[10, 0]}>
                    <ShoppingCartOutlined style={{ marginRight: '8px' }} />
                    选型单
                  </Badge>
                </Title>
                <Space>
                  <Tooltip title="清空选型">
                    <Popconfirm
                      title="确定清空所有选型产品？"
                      onConfirm={clearSelection}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        size="small" 
                        icon={<ClearOutlined />}
                        disabled={items.length === 0}
                      >
                        清空
                      </Button>
                    </Popconfirm>
                  </Tooltip>
                  <Button 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setDrawerVisible(true)}
                    disabled={items.length === 0}
                  >
                    详情
                  </Button>
                </Space>
              </div>
            </div>

            {/* 选型名称和备注 */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
              <Input
                placeholder="选型名称（必填）"
                value={selectionName}
                onChange={(e) => setSelectionName(e.target.value)}
                prefix={<SaveOutlined style={{ color: '#bfbfbf' }} />}
              />
              <Input.TextArea
                placeholder="备注信息（选填）"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                style={{ resize: 'none' }}
              />
            </Space>

            <Divider style={{ margin: '12px 0' }} />

            {/* 选型列表 */}
            {items.length === 0 ? (
              <Empty
                description="暂无选型产品"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '20px 0' }}
              />
            ) : (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              >
                <SortableContext
                  items={items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <List
                    dataSource={items}
                    renderItem={(item) => (
                      <SortableSelectionItem
                        key={item.id}
                        item={item}
                        onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                        onRemove={() => {
                          removeItem(item.id);
                          message.info('已移除产品');
                        }}
                      />
                    )}
                    style={{ maxHeight: '300px', overflow: 'auto' }}
                  />
                </SortableContext>
              </DndContext>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* 统计信息 */}
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic 
                  title="种类" 
                  value={items.length} 
                  suffix="种"
                  valueStyle={{ fontSize: '18px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="数量" 
                  value={totalQuantity} 
                  suffix="件"
                  valueStyle={{ fontSize: '18px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="预估金额" 
                  value={totalPrice}
                  prefix="¥"
                  valueStyle={{ fontSize: '18px', color: '#cf1322' }}
                />
              </Col>
            </Row>

            {/* 操作按钮 */}
            <Space style={{ width: '100%' }} direction="vertical">
              <Button 
                type="primary" 
                block 
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={items.length === 0}
              >
                保存选型
              </Button>
              <Space style={{ width: '100%' }}>
                <Button 
                  block
                  onClick={() => navigate('/history')}
                >
                  历史记录
                </Button>
                <Button 
                  block
                  onClick={() => navigate('/summary')}
                  disabled={items.length === 0}
                >
                  查看汇总
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 详情抽屉 */}
      <Drawer
        title="选型详情"
        placement="right"
        width={400}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="选型名称">
            {selectionName || <Text type="secondary">未命名</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="产品种类">{items.length} 种</Descriptions.Item>
          <Descriptions.Item label="产品总数">{totalQuantity} 件</Descriptions.Item>
          <Descriptions.Item label="预估金额">
            <Text type="danger" strong>¥{totalPrice.toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {remarks || <Text type="secondary">无</Text>}
          </Descriptions.Item>
        </Descriptions>

        <Divider>产品明细</Divider>
        
        <List
          dataSource={items}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                title={`${index + 1}. ${item.productName}`}
                description={
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    数量: {item.quantity} {item.unit || '件'}
                    {item.specs?.category ? ` | 分类: ${String(item.specs.category)}` : ''}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

export default SelectionPage;