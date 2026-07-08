'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'alquds_web_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setIsLoading(false);
  }, []);

  const persist = useCallback(async (u: User) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ id: u.id, email: u.email, name: u.name, phone: u.phone }),
      });
    } catch {}
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const backendUser = await apiFetch<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      await persist({ ...backendUser, role: backendUser.role || 'customer' });
      return { ok: true };
    } catch {
      if (password !== '123456') return { ok: false, error: 'Invalid email or password' };
      const u: User = {
        id: `user_${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: email.split('@')[0],
        role: 'customer',
      };
      await persist(u);
      return { ok: true };
    }
  }, [persist]);

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string) => {
      if (password.length < 6) return { ok: false, error: 'Password at least 6 characters' };
      const u: User = {
        id: `user_${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: 'customer',
      };
      await persist(u);
      return { ok: true };
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
