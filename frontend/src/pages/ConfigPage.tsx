import { useState } from 'react';
import { 
  Typography, 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Switch,
  Select,
  InputNumber,
  Divider,
  message,
  Popconfirm,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SettingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ToolOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Paragraph } = Typography;

// 分类数据类型
interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

// 参数模板数据类型
interface ParamTemplate {
  id: string;
  name: string;
  category: string;
  type: 'text' | 'number' | 'select' | 'multiSelect';
  unit?: string;
  options?: string;
  required: boolean;
}

// 系统配置类型
interface SystemConfig {
  key: string;
  value: string | number | boolean;
  description: string;
}

// 模拟分类数据
const mockCategories: Category[] = [
  { id: '1', name: '电机', code: 'MOTOR', description: '各类电机产品', status: 'active', sortOrder: 1 },
  { id: '2', name: '减速机', code: 'REDUCER', description: '减速机及传动部件', status: 'active', sortOrder: 2 },
  { id: '3', name: '传感器', code: 'SENSOR', description: '传感器及检测元件', status: 'active', sortOrder: 3 },
  { id: '4', name: '控制器', code: 'CONTROLLER', description: 'PLC及控制设备', status: 'active', sortOrder: 4 },
  { id: '5', name: '气动元件', code: 'PNEUMATIC', description: '气缸、阀岛等气动部件', status: 'inactive', sortOrder: 5 },
];

// 模拟参数模板数据
const mockParamTemplates: ParamTemplate[] = [
  { id: '1', name: '功率', category: 'MOTOR', type: 'number', unit: 'W', required: true },
  { id: '2', name: '电压', category: 'MOTOR', type: 'select', options: '220V,380V,24V', required: true },
  { id: '3', name: '减速比', category: 'REDUCER', type: 'text', required: true },
  { id: '4', name: '响应时间', category: 'SENSOR', type: 'number', unit: 'ms', required: false },
  { id: '5', name: '通道数', category: 'CONTROLLER', type: 'number', unit: '路', required: true },
];

// 模拟系统配置
const mockSystemConfigs: SystemConfig[] = [
  { key: 'site_name', value: '产品选型系统', description: '系统名称' },
  { key: 'items_per_page', value: 20, description: '每页显示数量' },
  { key: 'enable_export', value: true, description: '启用导出功能' },
  { key: 'auto_save', value: true, description: '自动保存选型' },
  { key: 'max_selection_items', value: 100, description: '单次选型最大产品数' },
];

const ConfigPage = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [paramTemplates, setParamTemplates] = useState<ParamTemplate[]>(mockParamTemplates);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>(mockSystemConfigs);
  
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [paramModalVisible, setParamModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingParam, setEditingParam] = useState<ParamTemplate | null>(null);
  
  const [categoryForm] = Form.useForm();
  const [paramForm] = Form.useForm();
  const [systemForm] = Form.useForm();

  // 分类表格列定义
  const categoryColumns: ColumnsType<Category> = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditCategory(record)}
          />
          <Popconfirm
            title="确定删除此分类?"
            onConfirm={() => handleDeleteCategory(record.id)}
          >
            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 参数模板表格列定义
  const paramColumns: ColumnsType<ParamTemplate> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '所属分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const cat = categories.find(c => c.code === category);
        return cat?.name || category;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          text: '文本',
          number: '数字',
          select: '单选',
          multiSelect: '多选',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit?: string) => unit || '-',
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'}>
          {required ? '必填' : '选填'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditParam(record)}
          />
          <Popconfirm
            title="确定删除此参数模板?"
            onConfirm={() => handleDeleteParam(record.id)}
          >
            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 分类操作
  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (record: Category) => {
    setEditingCategory(record);
    categoryForm.setFieldsValue(record);
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    message.success('分类已删除');
  };

  const handleSaveCategory = async () => {
    try {
      const values = await categoryForm.validateFields();
      if (editingCategory) {
        setCategories(categories.map(c => 
          c.id === editingCategory.id ? { ...c, ...values } : c
        ));
        message.success('分类已更新');
      } else {
        const newCategory: Category = {
          id: Date.now().toString(),
          ...values,
        };
        setCategories([...categories, newCategory]);
        message.success('分类已添加');
      }
      setCategoryModalVisible(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 参数模板操作
  const handleAddParam = () => {
    setEditingParam(null);
    paramForm.resetFields();
    setParamModalVisible(true);
  };

  const handleEditParam = (record: ParamTemplate) => {
    setEditingParam(record);
    paramForm.setFieldsValue(record);
    setParamModalVisible(true);
  };

  const handleDeleteParam = (id: string) => {
    setParamTemplates(paramTemplates.filter(p => p.id !== id));
    message.success('参数模板已删除');
  };

  const handleSaveParam = async () => {
    try {
      const values = await paramForm.validateFields();
      if (editingParam) {
        setParamTemplates(paramTemplates.map(p => 
          p.id === editingParam.id ? { ...p, ...values } : p
        ));
        message.success('参数模板已更新');
      } else {
        const newParam: ParamTemplate = {
          id: Date.now().toString(),
          ...values,
        };
        setParamTemplates([...paramTemplates, newParam]);
        message.success('参数模板已添加');
      }
      setParamModalVisible(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 系统配置保存
  const handleSaveSystemConfig = async () => {
    try {
      const values = await systemForm.validateFields();
      setSystemConfigs(systemConfigs.map(c => ({
        ...c,
        value: values[c.key],
      })));
      message.success('系统配置已保存');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 渲染系统配置表单
  const renderSystemConfigForm = () => {
    systemForm.setFieldsValue(
      systemConfigs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, unknown>)
    );

    return (
      <Form form={systemForm} layout="vertical">
        <Row gutter={24}>
          {systemConfigs.map(config => (
            <Col span={12} key={config.key}>
              <Form.Item
                name={config.key}
                label={config.description}
              >
                {typeof config.value === 'boolean' ? (
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                ) : typeof config.value === 'number' ? (
                  <InputNumber style={{ width: '100%' }} />
                ) : (
                  <Input />
                )}
              </Form.Item>
            </Col>
          ))}
        </Row>
        <Divider />
        <Button type="primary" onClick={handleSaveSystemConfig}>
          保存配置
        </Button>
      </Form>
    );
  };

  const tabItems = [
    {
      key: 'categories',
      label: (
        <span>
          <AppstoreOutlined />
          分类管理
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>
              新增分类
            </Button>
          </div>
          <Table 
            columns={categoryColumns} 
            dataSource={categories} 
            rowKey="id"
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'params',
      label: (
        <span>
          <FileTextOutlined />
          参数模板
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddParam}>
              新增参数
            </Button>
          </div>
          <Table 
            columns={paramColumns} 
            dataSource={paramTemplates} 
            rowKey="id"
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'system',
      label: (
        <span>
          <SettingOutlined />
          系统设置
        </span>
      ),
      children: renderSystemConfigForm(),
    },
    {
      key: 'tools',
      label: (
        <span>
          <ToolOutlined />
          工具
        </span>
      ),
      children: (
        <div>
          <Paragraph>数据维护和系统工具</Paragraph>
          <Space>
            <Button onClick={() => message.info('导出功能开发中...')}>
              导出配置
            </Button>
            <Button onClick={() => message.info('导入功能开发中...')}>
              导入配置
            </Button>
            <Button danger onClick={() => {
              Modal.confirm({
                title: '重置配置',
                content: '确定要重置所有配置到默认值吗？此操作不可恢复。',
                onOk: () => message.warning('重置功能开发中...'),
              });
            }}>
              重置配置
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>后台配置</Title>
      <Paragraph type="secondary">
        管理产品分类、参数模板和系统设置
      </Paragraph>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* 分类编辑弹窗 */}
      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={categoryModalVisible}
        onOk={handleSaveCategory}
        onCancel={() => setCategoryModalVisible(false)}
        destroyOnClose
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="分类代码"
            rules={[{ required: true, message: '请输入分类代码' }]}
          >
            <Input placeholder="如：MOTOR" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={2} placeholder="分类描述" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            initialValue={1}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 参数模板编辑弹窗 */}
      <Modal
        title={editingParam ? '编辑参数模板' : '新增参数模板'}
        open={paramModalVisible}
        onOk={handleSaveParam}
        onCancel={() => setParamModalVisible(false)}
        destroyOnClose
      >
        <Form form={paramForm} layout="vertical">
          <Form.Item
            name="name"
            label="参数名称"
            rules={[{ required: true, message: '请输入参数名称' }]}
          >
            <Input placeholder="如：功率" />
          </Form.Item>
          <Form.Item
            name="category"
            label="所属分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categories.filter(c => c.status === 'active').map(c => (
                <Select.Option key={c.code} value={c.code}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="参数类型"
            rules={[{ required: true, message: '请选择参数类型' }]}
          >
            <Select placeholder="请选择参数类型">
              <Select.Option value="text">文本</Select.Option>
              <Select.Option value="number">数字</Select.Option>
              <Select.Option value="select">单选</Select.Option>
              <Select.Option value="multiSelect">多选</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="unit"
            label="单位"
          >
            <Input placeholder="如：W、V、mm" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.type !== curr.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === 'select' || type === 'multiSelect') {
                return (
                  <Form.Item
                    name="options"
                    label="选项"
                    rules={[{ required: true, message: '请输入选项' }]}
                  >
                    <Input placeholder="多个选项用逗号分隔，如：220V,380V,24V" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item
            name="required"
            label="是否必填"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="必填" unCheckedChildren="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigPage;