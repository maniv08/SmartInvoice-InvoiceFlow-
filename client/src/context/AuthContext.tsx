import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { User, UserRole } from '../lib/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFinance: boolean;
  isApprover: boolean;
  isVendor: boolean;
  login: (email: string, password?: string, twoFactorToken?: string) => Promise<{ requires2FA?: boolean }>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password = 'Password123!', twoFactorToken?: string) => {
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        twoFactorToken,
      });

      if (res.data.requires2FA) {
        return { requires2FA: true };
      }

      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success(`Welcome back, ${res.data.user.name}!`);
        return { requires2FA: false };
      }
      throw new Error(res.data.message || 'Login failed');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Authentication failed';
      toast.error(msg);
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        toast.success('Registration successful! Welcome to InvoiceFlow.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.info('Logged out successfully');
  };

  const refetchUser = async () => {
    await fetchProfile();
  };

  // Demo Switcher for fast evaluation across roles
  const switchDemoRole = async (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      ADMIN: 'admin@invoiceflow.io',
      FINANCE_MANAGER: 'finance@invoiceflow.io',
      APPROVER: 'approver@invoiceflow.io',
      VENDOR: 'vendor@tata.com',
    };

    const targetEmail = roleEmailMap[role];
    try {
      await login(targetEmail, 'Password123!');
      toast.success(`Switched role to ${role.replace('_', ' ')} for demonstration.`);
    } catch (err) {
      toast.error('Failed to switch demo role.');
    }
  };

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isFinance = role === 'FINANCE_MANAGER' || isAdmin;
  const isApprover = role === 'APPROVER' || isFinance;
  const isVendor = role === 'VENDOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isFinance,
        isApprover,
        isVendor,
        login,
        register,
        logout,
        refetchUser,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
