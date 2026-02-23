'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/lib/db/types';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; success: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapBackendUser(u: any): User {
  return {
    id: u._id || u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role === 'superadmin' ? 'admin' : u.role,
    avatar_url: u.avatar_url || undefined,
    created_at: u.createdAt || u.created_at || new Date().toISOString(),
    updated_at: u.updatedAt || u.updated_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('bb_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(mapBackendUser(data.user));
        setToken(storedToken);
      } else {
        localStorage.removeItem('bb_token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch user:', error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Login failed') };
      }

      localStorage.setItem('bb_token', data.token);
      setToken(data.token);
      setUser(mapBackendUser(data.user));
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message || 'Network error') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Registration failed') };
      }

      localStorage.setItem('bb_token', data.token);
      setToken(data.token);
      setUser(mapBackendUser(data.user));
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message || 'Network error') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('bb_token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    // TODO: Implement backend reset password
    console.log('[Auth] Reset Password for:', email);
    return { error: null, success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        signIn,
        signUp,
        signOut,
        refreshUser: fetchUser,
        resetPassword,
      }}
    >
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
