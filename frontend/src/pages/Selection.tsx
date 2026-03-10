import { Typography, Card, List, Button, InputNumber, Space, Empty, Input } from 'antd';
import { useSelectionStore } from '../store/selectionStore';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Title } = Typography;

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
            min={1}
            value={quantity}
            onChange={(val) => onQuantityChange(val || 1)}
            style={{ width: '80px' }}
          />,
          <Button danger icon={<DeleteOutlined />} onClick={onRemove} />,
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
    console.log('保存选型:', { selectionName, remarks, items });
    // TODO: 调用 API 保存
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>选型单</Title>

      <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
        <Input
          placeholder="选型名称"
          value={selectionName}
          onChange={(e) => setSelectionName(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <Input.TextArea
          placeholder="备注信息"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
        />
      </Space>

      <Card>
        {items.length === 0 ? (
          <Empty
            description="暂无选型项目"
            image={<ShoppingCartOutlined style={{ fontSize: '64px', color: '#ccc' }} />}
          />
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
        <Button danger onClick={clearSelection} disabled={items.length === 0}>
          清空
        </Button>
      </Space>
    </div>
  );
};

export default Selection;