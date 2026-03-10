import { ConfigProvider, App as AntApp, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import Navbar from './components/Navbar';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: '100vh' }}>
          <Navbar />
          <Content style={{ background: '#f5f5f5' }}>
            <RouterProvider router={router} />
          </Content>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;