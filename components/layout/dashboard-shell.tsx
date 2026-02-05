'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && requireAuth) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, requireAuth, requireAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        <main className={cn(
          "flex-1 p-4 md:p-8 pt-6 transition-all duration-300 ease-in-out",
          isCollapsed ? "ml-0 md:ml-[80px]" : "ml-0 md:ml-64"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
