import axios, { type InternalAxiosRequestConfig } from 'axios';

const resolveApiBaseURL = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window === 'undefined') {
    return configuredBaseUrl;
  }

  const browserBaseUrl = '/api/fila-express/';

  if (!configuredBaseUrl) {
    return browserBaseUrl;
  }

  try {
    const configuredHost = new URL(configuredBaseUrl).hostname;
    if (
      configuredHost === 'localhost' ||
      configuredHost === '127.0.0.1' ||
      configuredHost === window.location.hostname
    ) {
      return browserBaseUrl;
    }

    // Em produção com API externa (ex.: Render), usar a URL configurada.
    return configuredBaseUrl;
  } catch {
    // Se a URL configurada vier inválida, cai para o host do navegador.
    return browserBaseUrl;
  }
};

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
  baseURL: resolveApiBaseURL(),
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
