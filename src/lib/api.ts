import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60000, // 60 segundos de timeout padrão
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authTokenSalao');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Para operações de estimate-time, usar timeout maior (a IA pode demorar)
    if (config.url?.includes('estimate-time')) {
      config.timeout = 300000; // 5 minutos para estimate
    }
    // Para operações de join, usar timeout maior (a IA pode demorar)
    if (config.url?.includes('/join')) {
      config.timeout = 300000; // 5 minutos para join
    }
    // Para operações de GET (dashboard), usar timeout menor
    if (config.method === 'get') {
      config.timeout = 30000; // 30 segundos para GET
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
