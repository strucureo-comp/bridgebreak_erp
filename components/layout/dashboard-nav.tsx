'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    Shield,
    DollarSign,
    ShoppingCart,
    Cog,
    Users,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
    Database,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';

interface NavItem {
    title: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    role?: 'client' | 'admin';
    section?: string;
    children?: NavItem[];
}

// ============================
// LOGICAL ERP NAVIGATION
// Grouped by: CORE, OPERATIONS, FINANCE, SYSTEM
// ============================
export const adminNavItems: NavItem[] = [
    // --- CORE ---
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        role: 'admin',
        section: 'Core',
    },
    {
        title: 'Master Data',
        href: '/admin/masters',
        icon: Database,
        role: 'admin',
        section: 'Core',
    },

    // --- OPERATIONS ---
    {
        title: 'Sales Hub',
        href: '/admin/sales',
        icon: ShoppingCart,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'Operations Hub',
        href: '/admin/operations',
        icon: Cog,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'Procurement',
        href: '/admin/purchases',
        icon: Building2,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'HR & Teams',
        href: '/admin/hr',
        icon: Users,
        role: 'admin',
        section: 'Operations',
    },

    // --- FINANCE ---
    {
        title: 'Finance Hub',
        href: '/admin/finance',
        icon: DollarSign,
        role: 'admin',
        section: 'Finance',
    },

    // --- SYSTEM ---
    {
        title: 'Reports',
        href: '/admin/reports',
        icon: BarChart3,
        role: 'admin',
        section: 'System',
    },
    {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        role: 'admin',
        section: 'System',
    },
];

interface DashboardNavProps {
    onNavClick?: () => void;
    isCollapsed?: boolean;
}

export function DashboardNav({ onNavClick, isCollapsed }: DashboardNavProps) {
    const pathname = usePathname();

    const navItems = adminNavItems;

    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <nav className="flex flex-col gap-1.5 p-2 items-center">
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href || '#'}
                                        onClick={onNavClick}
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent',
                                            isActive && 'bg-primary text-primary-foreground shadow-sm'
                                        )}
                                    >
                                        <Icon className="h-[18px] w-[18px]" />
                                        <span className="sr-only">{item.title}</span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="flex items-center gap-4 font-semibold">
                                    {item.title}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>
            </TooltipProvider>
        );
    }

    let lastSection = '';

    return (
        <nav className="flex flex-col gap-0.5 px-3 py-2">
            {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

                const showSectionHeader = item.section && item.section !== lastSection;
                if (item.section) lastSection = item.section;

                return (
                    <div key={item.title}>
                        {showSectionHeader && (
                            <h4 className={cn(
                                "mb-1.5 mt-5 px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]",
                                index === 0 && "mt-1"
                            )}>
                                {item.section}
                            </h4>
                        )}
                        <Link
                            href={item.href || '#'}
                            onClick={onNavClick}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                        >
                            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "")} />
                            {item.title}
                        </Link>
                    </div>
                );
            })}
        </nav>
    );
}
