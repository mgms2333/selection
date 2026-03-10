import { Layout, Menu, Dropdown, Avatar, Space } from 'antd';
import { 
  HomeOutlined, 
  ShoppingCartOutlined, 
  HistoryOutlined, 
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const { Header } = Layout;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('用户');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.name || user.username || '用户');
      } catch {
        setUsername('用户');
      }
    }
  }, []);

  // 不在登录页显示导航栏
  if (location.pathname === '/login') {
    return null;
  }

  const menuItems = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/selection/new',
      icon: <AppstoreOutlined />,
      label: '新建选型',
    },
    {
      key: '/products',
      icon: <ShoppingCartOutlined />,
      label: '产品列表',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '选型历史',
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: '后台配置',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Header 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div 
          style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            marginRight: '32px',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/home')}
        >
          产品选型系统
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ 
            flex: 1, 
            minWidth: 0,
            border: 'none',
          }}
        />
      </div>
      <div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar 
              style={{ backgroundColor: '#1890ff' }} 
              icon={<UserOutlined />} 
            />
            <span style={{ color: '#333' }}>{username}</span>
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
};

export default Navbar;