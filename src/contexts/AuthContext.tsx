'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { useToast } from '@/hooks/use-toast'; // Importante para avisar o usuário

interface IAuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  salonId: number | null;
  loading: boolean;
  login: (adminUser: string, adminPassword: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<IAuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast(); // Hook para o toast

  // Função de Logout (Centralizada)
  const logout = useCallback(() => {
    localStorage.removeItem('authTokenSalao');
    localStorage.removeItem('salonId');
    setToken(null);
    setSalonId(null);
    delete api.defaults.headers.common['Authorization'];
    router.push('/admin');
  }, [router]);

  // Carregar dados iniciais
  useEffect(() => {
    const storedToken = localStorage.getItem('authTokenSalao');
    const storedSalonId = localStorage.getItem('salonId');

    if (storedToken && storedSalonId) {
      setToken(storedToken);
      setSalonId(Number(storedSalonId));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  // --- INTERCEPTOR GLOBAL DE ERRO ---
  // Isso garante que se o token vencer em QUALQUER tela, o usuário vai pro login
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const errorMessage =
          error.response?.data?.error || error.response?.data?.message || '';

        // Pega 401 (Padrão) OU 400/403 se a mensagem falar de "token" ou "jwt"
        const isTokenError =
          status === 401 ||
          ((status === 400 || status === 403) &&
            (errorMessage.toString().toLowerCase().includes('token') ||
              errorMessage.toString().toLowerCase().includes('jwt') ||
              errorMessage.toString().toLowerCase().includes('expirado')));

        if (isTokenError) {
          if (token) {
            // Usa setTimeout para evitar conflito de renderização se estiver no meio de um load
            setTimeout(() => {
              logout();
              toast({
                title: 'Sessão Expirada',
                description: 'Sua credencial venceu. Faça login novamente.',
                variant: 'destructive',
                duration: 10000,
              });
            }, 100);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [logout, token, toast]);

  const login = useCallback(
    async (adminUser: string, adminPassword: string): Promise<boolean> => {
      try {
        const response = await api.post('salon/login', {
          adminUser,
          adminPassword,
        });

        const { token: newToken } = response.data;

        if (newToken) {
          const payload = JSON.parse(atob(newToken.split('.')[1]));
          const newSalonId = payload.salonId || payload.id;

          if (!newSalonId) {
            console.error('ID do salão não encontrado no token.');
            return false;
          }

          localStorage.setItem('authTokenSalao', newToken);
          localStorage.setItem('salonId', String(newSalonId));
          setToken(newToken);
          setSalonId(Number(newSalonId));
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          return true;
        }
        return false;
      } catch (error) {
        console.error('Erro no login:', error);
        return false;
      }
    },
    []
  );

  const value = {
    isAuthenticated: !!token,
    token,
    salonId,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}

export const useAuth = (): IAuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
