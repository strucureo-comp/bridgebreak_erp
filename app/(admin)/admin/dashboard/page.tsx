'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/shared/layout/dashboard-shell';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-12">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="space-y-4 text-center">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground/90">
                            {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </h1>
                        <p className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-widest mt-2 max-w-md mx-auto">
                            Welcome back, {user?.full_name || 'Administrator'}
                        </p>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
