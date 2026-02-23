'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    DollarSign,
    ShoppingCart,
    Cog,
    Users,
    BarChart3,
    Settings,
    ChevronRight,
    Database,
    Factory,
    Warehouse,
    Briefcase,
    Package,
    ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTenant } from '@/lib/tenant-context';

interface NavItem {
    title: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    section?: string;
    moduleKey?: string;
    comingSoon?: boolean;
}

export const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, section: 'Core' },
    { title: 'Sales Hub', href: '/admin/sales', icon: ShoppingCart, section: 'Operations', moduleKey: 'sales' },
    { title: 'Client Projects', href: '/admin/projects', icon: Briefcase, section: 'Operations', moduleKey: 'projects' },
    { title: 'Inventory', href: '/admin/inventory', icon: Package, section: 'Operations', moduleKey: 'inventory' },
    { title: 'Procurement', href: '/admin/purchases', icon: Building2, section: 'Operations', moduleKey: 'purchases' },
    { title: 'Production', href: '/admin/manufacturing/production', icon: Factory, section: 'Operations', moduleKey: 'manufacturing', comingSoon: true },
    { title: 'HR & Teams', href: '/admin/hr', icon: Users, section: 'Operations', moduleKey: 'hr' },
    { title: 'Finance Hub', href: '/admin/finance', icon: DollarSign, section: 'Finance', moduleKey: 'finance' },
    { title: 'Legal Hub', icon: ShieldCheck, section: 'Finance', comingSoon: true },
    { title: 'Analytics', href: '/admin/reports', icon: BarChart3, section: 'System', moduleKey: 'reports' },
    { title: 'System Hub', href: '/admin/settings', icon: Settings, section: 'System' },
];

export function DashboardNav({ isCollapsed, onNavClick }: { isCollapsed?: boolean; onNavClick?: () => void }) {
    const pathname = usePathname();
    const { getModuleLabel, checkAccess } = useTenant();

    const renderItem = (item: NavItem) => {
        const Icon = item.icon;
        const label = item.moduleKey ? getModuleLabel(item.moduleKey) : item.title;
        const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

        if (isCollapsed) {
            return (
                <TooltipProvider key={item.title} delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={item.comingSoon ? '#' : (item.href || '#')}
                                onClick={onNavClick}
                                className={cn(
                                    'flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200 mb-1',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    item.comingSoon && "opacity-40 cursor-not-allowed grayscale"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-foreground border-none text-[12px] font-bold text-background px-3 py-1.5 flex items-center gap-2">
                            {label}
                            {item.comingSoon && <Badge className="bg-primary/20 text-primary border-none text-[8px] h-4">SOON</Badge>}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return (
            <Link
                key={item.title}
                href={item.comingSoon ? '#' : (item.href || '#')}
                onClick={onNavClick}
                className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group mb-0.5',
                    isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent',
                    item.comingSoon && "opacity-50 cursor-not-allowed grayscale hover:bg-transparent"
                )}
            >
                <div className={cn(
                    "flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                    item.comingSoon && "group-hover:scale-100 group-hover:text-muted-foreground"
                )}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="flex-1 truncate">{label}</span>
                {item.comingSoon ? (
                    <Badge variant="outline" className="text-[8px] font-black border-border text-muted-foreground uppercase tracking-widest px-1.5 h-4">SOON</Badge>
                ) : isActive && (
                    <div className="h-4 w-1 rounded-full bg-primary animate-in fade-in zoom-in duration-300" />
                )}
            </Link>
        );
    };

    let lastSection = '';

    return (
        <nav className="flex flex-col px-3">
            {adminNavItems.filter((item) => {
                if (!item.moduleKey) return true;
                return checkAccess(item.moduleKey as any).accessible;
            }).map((item) => {
                const showHeader = !isCollapsed && item.section && item.section !== lastSection;
                if (item.section) lastSection = item.section;

                return (
                    <div key={item.title}>
                        {showHeader && (
                            <h4 className="mt-6 mb-2 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                {item.section}
                            </h4>
                        )}
                        {renderItem(item)}
                    </div>
                );
            })}
        </nav>
    );
}
