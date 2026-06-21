import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { getStoredUser, setStoredUser } from '@/utils/storage';
import { API_BASE_URL } from '@/constants/api';
import { toast } from '@/contexts/ToastContext';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  sendLoginOtp: (phone: string) => Promise<{ ok: boolean; error?: string; demoOtp?: string }>;
  loginWithPhone: (phone: string, otp: string) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'dateOfBirth'>>) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function tryBackendLogin(email: string, password: string): Promise<User | null> {
  if (!API_BASE_URL) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role || 'customer',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then(async (u) => {
      setUser(u);
      setIsLoading(false);
      if (u && API_BASE_URL) {
        try {
          await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: u.id, email: u.email, name: u.name, phone: u.phone }),
          });
        } catch (_) {}
      }
    });
  }, []);

  const syncUserToBackend = useCallback(async (u: User): Promise<boolean> => {
    if (!API_BASE_URL) return true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, email: u.email, name: u.name, phone: u.phone }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }, []);

  const sendLoginOtp = useCallback(async (phone: string) => {
    if (!phone.trim()) return { ok: false, error: 'Enter phone number' };
    if (!API_BASE_URL) return { ok: false, error: 'Backend not configured' };
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), purpose: 'login' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'Failed to send OTP' };
      return { ok: true, demoOtp: data.demoOtp };
    } catch {
      return { ok: false, error: 'Could not reach server' };
    }
  }, []);

  const loginWithPhone = useCallback(async (phone: string, otp: string) => {
    if (!phone.trim()) return { ok: false, error: 'Enter phone number' };
    if (!otp.trim()) return { ok: false, error: 'Enter OTP' };
    if (!API_BASE_URL) return { ok: false, error: 'Backend not configured' };
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'Login failed' };
      const backendUser: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role || 'customer',
      };
      await setStoredUser(backendUser);
      setUser(backendUser);
      return { ok: true, role: backendUser.role || 'customer' };
    } catch {
      return { ok: false, error: 'Could not reach server' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim()) return { ok: false, error: 'Enter email' };
    if (!password) return { ok: false, error: 'Enter password' };

    const backendUser = await tryBackendLogin(email, password);
    if (backendUser) {
      await setStoredUser(backendUser);
      setUser(backendUser);
      return { ok: true, role: backendUser.role || 'customer' };
    }

    if (password !== '123456') {
      return { ok: false, error: 'Invalid email or password' };
    }

    const u: User = {
      id: `user_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: email.split('@')[0],
      role: 'customer',
    };
    await setStoredUser(u);
    setUser(u);
    const synced = await syncUserToBackend(u);
    if (!synced && API_BASE_URL) {
      toast.info(
        'Your account is saved here. To see it in the admin dashboard, ensure the backend is running at ' +
          API_BASE_URL +
          '. On a phone, set the API URL to your computer\'s IP (e.g. in .env: EXPO_PUBLIC_API_URL=http://192.168.1.x:4000) and restart the app.',
        'Saved on device'
      );
    }
    return { ok: true, role: 'customer' };
  }, [syncUserToBackend]);

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string) => {
      if (!name.trim()) return { ok: false, error: 'Enter name' };
      if (!email.trim()) return { ok: false, error: 'Enter email' };
      if (password.length < 6) return { ok: false, error: 'Password at least 6 characters' };
      const u: User = {
        id: `user_${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: 'customer',
      };
      await setStoredUser(u);
      setUser(u);
      const synced = await syncUserToBackend(u);
      if (!synced && API_BASE_URL) {
        toast.info(
          'Your account is saved on this device. To see it in the admin dashboard, ensure the backend is running. If you\'re on a phone, set the API URL to your computer\'s IP in a .env file: EXPO_PUBLIC_API_URL=http://YOUR_IP:4000 then restart the app.',
          'Account created'
        );
      }
      return { ok: true };
    },
    [syncUserToBackend]
  );

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'dateOfBirth'>>) => {
      if (!user) return { ok: false, error: 'Not logged in' };
      if (updates.email !== undefined && !updates.email.trim()) {
        return { ok: false, error: 'Email is required' };
      }
      if (updates.name !== undefined && !updates.name.trim()) {
        return { ok: false, error: 'Name is required' };
      }
      const next: User = {
        ...user,
        ...updates,
        email: updates.email !== undefined ? updates.email.trim().toLowerCase() : user.email,
        name: updates.name !== undefined ? updates.name.trim() : user.name,
        phone: updates.phone !== undefined ? updates.phone.trim() || undefined : user.phone,
        dateOfBirth: updates.dateOfBirth !== undefined ? updates.dateOfBirth.trim() || undefined : user.dateOfBirth,
      };
      await setStoredUser(next);
      setUser(next);
      await syncUserToBackend(next);
      return { ok: true };
    },
    [user, syncUserToBackend]
  );

  const deleteAccount = useCallback(async () => {
    await setStoredUser(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    await setStoredUser(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, sendLoginOtp, loginWithPhone, register, updateProfile, deleteAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
