'use client';

import { Sidebar } from '@/components/shared/layout/sidebar';
import { MobileNav } from '@/components/shared/layout/mobile-nav';
import { Header } from '@/components/shared/layout/header';
import { TitleUpdater } from '@/components/shared/title-updater';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { user, loading } = useAuth();
    const router = useRouter();

    const isAdminUser = (role?: string | null) => {
        const normalized = String(role || '').trim().toLowerCase();
        return normalized === 'admin' || normalized === 'superadmin' || normalized === 'administrator';
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (!loading && user && !isAdminUser(user.role)) {
            router.push('/admin/dashboard');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!user || !isAdminUser(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="settings-ui-standard min-h-screen bg-muted/20 flex flex-col font-sans text-foreground selection:bg-primary/20">
            <TitleUpdater />

            {/* Global Header */}
            <Header />

            {/* Main Content Area with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Desktop Only with Hover Autohide */}
                <Sidebar
                    isCollapsed={isCollapsed}
                    toggleCollapse={() => setIsCollapsed((v) => !v)}
                />

                {/* Main Container */}
                <main className={cn(
                    "flex-1 flex flex-col overflow-auto transition-all duration-300 ease-in-out",
                    isCollapsed ? "md:pl-[72px]" : "md:pl-[250px]"
                )}>
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                        <div className="mx-auto max-w-7xl w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
        </div>
    );
}
