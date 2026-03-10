import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

// 懒加载页面组件
const LoginPage = lazy(() => import('../pages/LoginPage'));
const Home = lazy(() => import('../pages/Home'));
const ProductList = lazy(() => import('../pages/ProductList'));
const Selection = lazy(() => import('../pages/Selection'));
const SelectionPage = lazy(() => import('../pages/SelectionPage'));
const SelectionHistory = lazy(() => import('../pages/SelectionHistory'));
const SummaryPage = lazy(() => import('../pages/SummaryPage'));
const ConfigPage = lazy(() => import('../pages/ConfigPage'));

// 加载组件
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <Spin size="large" />
  </div>
);

// 路由守卫 - 检查登录状态
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <Home />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/products',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <ProductList />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/selection',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <Selection />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/selection/new',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <SelectionPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/history',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <SelectionHistory />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/summary',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <SummaryPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/config',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <ConfigPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
]);

export default router;