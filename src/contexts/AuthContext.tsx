import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/utils/api';

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // True until we've read the persisted session from localStorage. Prevents
  // deep links / page refreshes from bouncing to /login (and then /dashboard)
  // before the saved user has been restored.
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sm_current_user');
    const token = localStorage.getItem('sm_auth_token');
    if (saved && token) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setInitializing(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email.trim(), password) as {
        token?: string;
        user?: User;
        id?: string;
      };
      const loggedInUser = response?.user || (response?.id ? (response as unknown as User) : null);
      if (loggedInUser) {
        localStorage.setItem('sm_auth_token', response?.token || `sm-local-${loggedInUser.id}`);
        localStorage.setItem('sm_current_user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sm_current_user');
    localStorage.removeItem('sm_auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
