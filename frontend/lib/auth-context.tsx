'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { authApi } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isLandlord: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'STUDENT' | 'LANDLORD';
  }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (typeof window === 'undefined') return;
      const storedToken = localStorage.getItem('saf_token');
      const storedUser = localStorage.getItem('saf_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Validate with server
          const res = await authApi.getMe();
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('saf_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token invalid or expired
          localStorage.removeItem('saf_token');
          localStorage.removeItem('saf_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    loadUser();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      const { user: loggedInUser, token: authToken } = res.data;

      setToken(authToken);
      setUser(loggedInUser);
      localStorage.setItem('saf_token', authToken);
      localStorage.setItem('saf_user', JSON.stringify(loggedInUser));

      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'STUDENT' | 'LANDLORD';
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      const { user: registeredUser, token: authToken } = res.data;

      setToken(authToken);
      setUser(registeredUser);
      localStorage.setItem('saf_token', authToken);
      localStorage.setItem('saf_user', JSON.stringify(registeredUser));

      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('saf_token');
      localStorage.removeItem('saf_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isStudent: user?.role === 'STUDENT',
        isLandlord: user?.role === 'LANDLORD',
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
