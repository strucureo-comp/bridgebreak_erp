'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/db/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; success: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// MOCK AUTH PROVIDER (Disconnected)
// Always provides a system admin session
// ==========================================

const MOCK_ADMIN: User = {
    id: 'u1',
    email: 'admin@example.com',
    full_name: 'System Admin',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_ADMIN); // Default to logged in
  const [loading, setLoading] = useState(false); // No loading delay for mockup
  const router = useRouter();

  const fetchUser = async () => {
    // Simply keep the mock user
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[Mock Auth] Sign In:', email);
    setUser(MOCK_ADMIN);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('[Mock Auth] Sign Up:', fullName);
    setUser({ ...MOCK_ADMIN, full_name: fullName, email });
    return { error: null };
  };

  const signOut = async () => {
    console.log('[Mock Auth] Sign Out');
    setUser(null);
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    console.log('[Mock Auth] Reset Password for:', email);
    return { error: null, success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
