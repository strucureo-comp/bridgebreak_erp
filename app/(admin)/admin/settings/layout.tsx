'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Settings, Building2, Palette, DollarSign, Receipt,
    Users, Shield, Layers, ChevronRight,
    ArrowLeft, Workflow
} from 'lucide-react';

const settingsNav = [
    {
        title: 'General',
        items: [
            { title: 'Company', href: '/admin/settings/company', icon: Building2 },
            { title: 'Branding', href: '/admin/settings/branding', icon: Palette },
        ]
    },
    {
        title: 'Finance',
        items: [
            { title: 'Currency & Fiscal', href: '/admin/settings/currency', icon: DollarSign },
            { title: 'Taxes', href: '/admin/settings/taxes', icon: Receipt },
        ]
    },
    {
        title: 'Access',
        items: [
            { title: 'Users', href: '/admin/settings/users', icon: Users },
            { title: 'Roles & Permissions', href: '/admin/settings/roles', icon: Shield },
            { title: 'Approval Workflows', href: '/admin/settings/approvals', icon: Workflow },
        ]
    },
    {
        title: 'System',
        items: [
            { title: 'Modules', href: '/admin/settings/modules', icon: Layers },
        ]
    },
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-background">
            {/* Header with Back Button */}
            <div className="border-b bg-card sticky top-0 z-50">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to ERP
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-sm">Settings</span>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Left Sidebar */}
                <aside className="w-64 border-r bg-card min-h-screen sticky top-[57px]">
                    <nav className="p-4 space-y-6">
                        {settingsNav.map((group) => (
                            <div key={group.title}>
                                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                                    {group.title}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                                    isActive
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </div>
                                                <ChevronRight className="h-3 w-3 opacity-50" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
