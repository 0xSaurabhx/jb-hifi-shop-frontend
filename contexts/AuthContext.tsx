"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  user_email: string;
  isGuest?: boolean;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
  getUserId: () => number | null;
  isTemporaryGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isTemporaryGuest, setIsTemporaryGuest] = useState(false);

  const API_BASE_URL = 'https://jb-hifi-search-backend-947132053690.us-central1.run.app';

  useEffect(() => {
    // Check localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsTemporaryGuest(false); // Reset temporary guest status if logged in
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', email);
      formData.append('password', password);
      formData.append('scope', '');
      formData.append('client_id', 'string');
      formData.append('client_secret', 'string');

      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/login`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, user } = response.data;
      setToken(access_token);
      setUser(user);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginAsGuest = () => {
    const user = { id: 0, first_name: 'Guest', last_name: '', user_email: 'guest', isGuest: true };
    setUser(user);
    setIsTemporaryGuest(true);
    // Clear any stored credentials to ensure popup shows on next visit
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsTemporaryGuest(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const getUserId = () => {
    return user?.id || null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginAsGuest, 
      logout, 
      isAuthenticated: !!token || isTemporaryGuest, 
      token,
      getUserId,
      isTemporaryGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
