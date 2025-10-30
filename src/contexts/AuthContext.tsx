'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

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

  const login = async (
    adminUser: string,
    adminPassword: string
  ): Promise<boolean> => {
    const response = await api.post('salon/login', {
      adminUser,
      adminPassword,
    });

    const { token: newToken, salonId: newSalonId } = response.data;

    if (newToken && newSalonId) {
      localStorage.setItem('authTokenSalao', newToken);
      localStorage.setItem('salonId', String(newSalonId));
      setToken(newToken);
      setSalonId(newSalonId);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('authTokenSalao');
    localStorage.removeItem('salonId');
    setToken(null);
    setSalonId(null);
    delete api.defaults.headers.common['Authorization'];
    router.push('/admin');
  };

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
