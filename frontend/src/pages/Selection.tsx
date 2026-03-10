import { Typography, Card, List, Button, InputNumber, Space, Empty, Input, message } from 'antd';
import { useSelectionStore } from '../store/selectionStore';
import { DeleteOutlined, ShoppingCartOutlined, SaveOutlined, ClearOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

// 可排序项组件
interface SortableItemProps {
  id: string;
  name: string;
  quantity: number;
  specs?: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

const SortableItem = ({ id, name, quantity, specs, onQuantityChange, onRemove }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <List.Item
        actions={[
          <InputNumber
            key="qty"
            min={1}
            value={quantity}
            onChange={(val) => onQuantityChange(val || 1)}
            style={{ width: '80px' }}
          />,
          <Button 
            key="del"
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={onRemove} 
          />,
        ]}
      >
        <List.Item.Meta
          title={name}
          description={specs}
        />
      </List.Item>
    </div>
  );
};

const Selection = () => {
  const navigate = useNavigate();
  const { items, selectionName, remarks, reorderItems, updateQuantity, removeItem, setSelectionName, setRemarks, clearSelection } = useSelectionStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      reorderItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleSave = () => {
    if (items.length === 0) {
      message.warning('选型单为空');
      return;
    }
    if (!selectionName.trim()) {
      message.warning('请填写选型名称');
      return;
    }
    console.log('保存选型:', { selectionName, remarks, items });
    message.success('选型保存成功');
    navigate('/history');
  };

  const handleClear = () => {
    clearSelection();
    message.info('已清空选型单');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>当前选型单</Title>
        <Paragraph type="secondary">管理已添加的产品，调整数量或删除</Paragraph>
      </div>

      <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
        <Input
          placeholder="选型名称（必填）"
          value={selectionName}
          onChange={(e) => setSelectionName(e.target.value)}
          prefix={<SaveOutlined style={{ color: '#bfbfbf' }} />}
          style={{ maxWidth: '300px' }}
        />
        <Input.TextArea
          placeholder="备注信息"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
        />
      </Space>

      <Card>
        {items.length === 0 ? (
          <Empty
            description="暂无选型项目"
            image={<ShoppingCartOutlined style={{ fontSize: '64px', color: '#ccc' }} />}
          >
            <Button type="primary" onClick={() => navigate('/products')}>
              去添加产品
            </Button>
          </Empty>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <List
                dataSource={items}
                renderItem={(item) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    name={item.productName}
                    quantity={item.quantity}
                    specs={item.specs?.specs as string}
                    onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                    onRemove={() => removeItem(item.id)}
                  />
                )}
              />
            </SortableContext>
          </DndContext>
        )}
      </Card>

      <Space style={{ marginTop: '16px' }}>
        <Button type="primary" onClick={handleSave} disabled={items.length === 0}>
          保存选型
        </Button>
        <Button danger icon={<ClearOutlined />} onClick={handleClear} disabled={items.length === 0}>
          清空
        </Button>
        <Button onClick={() => navigate('/products')}>
          继续添加
        </Button>
      </Space>
    </div>
  );
};

export default Selection;