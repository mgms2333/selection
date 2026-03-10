import type { ReactNode } from 'react';
import { Breadcrumb, Button } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  extra?: ReactNode;
}

// 路由名称映射
const routeNameMap: Record<string, string> = {
  '/home': '首页',
  '/products': '产品列表',
  '/selection': '选型单',
  '/selection/new': '新建选型',
  '/history': '选型历史',
  '/summary': '选型汇总',
  '/config': '后台配置',
};

const PageLayout = ({ 
  title, 
  children, 
  showBackButton = true,
  backPath,
  extra
}: PageLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 生成面包屑
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ path: '/home', name: '首页' }];
    
    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      if (routeNameMap[currentPath]) {
        breadcrumbs.push({ path: currentPath, name: routeNameMap[currentPath] });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // 处理返回
  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="page-container">
      {/* 顶部导航栏 */}
      <div className="page-header">
        <div className="page-header-left">
          {showBackButton && location.pathname !== '/home' && (
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              className="back-button"
            >
              返回
            </Button>
          )}
          <Breadcrumb items={breadcrumbs.map(item => ({
            title: item.path === location.pathname ? item.name : (
              <span onClick={() => navigate(item.path)} style={{ cursor: 'pointer' }}>
                {item.path === '/home' ? <><HomeOutlined /> {item.name}</> : item.name}
              </span>
            ),
          }))} />
        </div>
        {extra && <div className="page-header-extra">{extra}</div>}
      </div>

      {/* 页面标题 */}
      <h1 className="page-title">{title}</h1>

      {/* 页面内容 */}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;