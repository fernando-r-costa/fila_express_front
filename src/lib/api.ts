import axios, { type InternalAxiosRequestConfig } from 'axios';

const principalTimeoutRaw = Number.parseInt(
  process.env.NEXT_PUBLIC_AI_PRINCIPAL_TIMEOUT_MS ?? '',
  10
);
const principalTimeout = Number.isFinite(principalTimeoutRaw)
  ? principalTimeoutRaw
  : 60000;

const optimizeQueueTimeoutRaw = Number.parseInt(
  process.env.NEXT_PUBLIC_AI_RECALC_TIMEOUT_MS ?? '',
  10
);
const optimizeQueueTimeout = Number.isFinite(optimizeQueueTimeoutRaw)
  ? optimizeQueueTimeoutRaw
  : 90000;

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
      config.timeout = principalTimeout;
    }
    // Para operações de join, usar timeout maior (a IA pode demorar)
    if (config.url?.includes('/join')) {
      config.timeout = principalTimeout;
    }
    // Para operações de otimização, usar timeout do back (90s)
    if (config.url?.includes('/optimize-queue')) {
      config.timeout = optimizeQueueTimeout;
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
