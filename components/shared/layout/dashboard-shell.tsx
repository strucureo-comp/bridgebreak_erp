'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { TitleUpdater } from '../title-updater';
import { Loader2 } from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export function DashboardShell({
  children,
  requireAuth = true,
  requireAdmin = false,
}: DashboardShellProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && requireAuth) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && user.role !== 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, requireAuth, requireAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) return null;
  if (requireAdmin && user?.role !== 'admin') return null;

  return (
    <>
      <TitleUpdater />
      {children}
    </>
  );
}
