import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Cookies from 'js-cookie';
interface Role {
  id: string;
  name: string;
}
interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: Role;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => { },
  setUser: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = Cookies.get('admin_access_token');
      const refreshToken = Cookies.get('admin_refresh_token');

      if (!accessToken && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data: any = await axiosClient.get('/admin-auth/me');
        if (data.success && data.user) {
          setUser(data.user);
        } else if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Lỗi khi fetchUser (/auth/me):', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    setIsLoading(true);
    try {
      await axiosClient.post('/admin-auth/logout');
    } catch (error) {
      console.error('Lỗi gọi API logout:', error);
    } finally {
      Cookies.remove('admin_access_token');
      Cookies.remove('admin_refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
