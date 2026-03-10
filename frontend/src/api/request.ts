import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    // 统一错误处理
    const message = error.response?.data?.message || error.message || '请求失败';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// 封装请求方法
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    request.get(url, config),
  
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    request.post(url, data, config),
  
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    request.put(url, data, config),
  
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    request.delete(url, config),
  
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    request.patch(url, data, config),
};

export default request;