import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

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
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;