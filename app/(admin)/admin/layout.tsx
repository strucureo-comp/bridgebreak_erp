'use client';

import { Sidebar } from '@/components/shared/layout/sidebar';
import { MobileNav } from '@/components/shared/layout/mobile-nav';
import { Header } from '@/components/shared/layout/header';
import { TitleUpdater } from '@/components/shared/title-updater';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col font-sans text-foreground selection:bg-primary/20">
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
