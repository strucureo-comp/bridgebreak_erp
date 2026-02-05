'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    MessageSquare,
    Calendar,
    Users,
    DollarSign,
    UserCog,
    Settings,
    CreditCard,
    ScrollText,
    Inbox,
    Target,
    Map,
    Package,
    Receipt,
    Percent,
    BarChart3,
    Database,
    CheckSquare,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
    title: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    role?: 'client' | 'admin';
    section?: string;
}

export const clientNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        role: 'client',
    },
    {
        title: 'Projects',
        href: '/projects',
        icon: FolderKanban,
        role: 'client',
    },
    {
        title: 'Invoices',
        href: '/invoices',
        icon: FileText,
        role: 'client',
    },
    {
        title: 'Support',
        href: '/support',
        icon: MessageSquare,
        role: 'client',
    },
    {
        title: 'Meetings',
        href: '/meetings',
        icon: Calendar,
        role: 'client',
    },
];

export const adminNavItems: NavItem[] = [
    // Dashboard
    {
        title: 'Command Center',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        role: 'admin',
    },
    
    // Sales Section
    {
        title: 'Inbound Feed',
        href: '/admin/enquiries',
        icon: Inbox,
        role: 'admin',
        section: 'Sales',
    },
    {
        title: 'Deal Pipeline',
        href: '/admin/leads',
        icon: Target,
        role: 'admin',
        section: 'Sales',
    },
    {
        title: 'Cost Estimates',
        href: '/admin/quotations',
        icon: ScrollText,
        role: 'admin',
        section: 'Sales',
    },
    {
        title: 'Client Desk',
        href: '/admin/clients',
        icon: Users,
        role: 'admin',
        section: 'Sales',
    },
    {
        title: 'Bill Registry',
        href: '/admin/invoices',
        icon: FileText,
        role: 'admin',
        section: 'Sales',
    },

    // Operations Section
    {
        title: 'Site Deployments',
        href: '/admin/projects',
        icon: FolderKanban,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'Strategy Roadmap',
        href: '/admin/planning',
        icon: Map,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'Buying Center',
        href: '/admin/purchases',
        icon: Receipt,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'Stock Control',
        href: '/admin/inventory',
        icon: Package,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'Support Hub',
        href: '/admin/support',
        icon: MessageSquare,
        role: 'admin',
        section: 'Operations',
    },
    {
        title: 'Meeting Log',
        href: '/admin/meetings',
        icon: Calendar,
        role: 'admin',
        section: 'Operations',
    },
    
    // Finance Section
    {
        title: 'Cash Manager',
        href: '/admin/finance',
        icon: DollarSign,
        role: 'admin',
        section: 'Finance',
    },
    {
        title: 'Bank Accounts',
        href: '/admin/banking',
        icon: CreditCard,
        role: 'admin',
        section: 'Finance',
    },
    {
        title: 'Tax Center',
        href: '/admin/taxes',
        icon: Percent,
        role: 'admin',
        section: 'Finance',
    },

    // Reports Section
    {
        title: 'Business Intel',
        href: '/admin/reports',
        icon: BarChart3,
        role: 'admin',
        section: 'Reports',
    },

    // System Section
    {
        title: 'Staff Roster',
        href: '/admin/hr',
        icon: UserCog,
        role: 'admin',
        section: 'System',
    },
    {
        title: 'Data Registry',
        href: '/admin/masters',
        icon: Database,
        role: 'admin',
        section: 'System',
    },
    {
        title: 'Governance',
        href: '/admin/approvals',
        icon: CheckSquare,
        role: 'admin',
        section: 'System',
    },
    {
        title: 'Notebook',
        href: '/admin/plans',
        icon: CreditCard,
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
    const { user } = useAuth();

    const allowedFinanceEmails = [
        'viyasramachandran@gmail.com',
        'aathish@systemsteel.ae',
        'aathihacker2004@gmail.com',
        'admin@example.com',
    ];

    let navItems = user?.role === 'admin' ? adminNavItems : clientNavItems;

    // Filter out Finance tab if user is not authorized
    if (user?.role === 'admin') {
        navItems = navItems.filter(item => {
            if (item.title === 'Finance') {
                return user.email && allowedFinanceEmails.includes(user.email.toLowerCase());
            }
            return true;
        });
    }

    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <nav className="flex flex-col gap-2 p-2 items-center group">
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
                                            'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                                            isActive && 'bg-accent text-accent-foreground'
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="sr-only">{item.title}</span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="flex items-center gap-4">
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
        <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
                
                const showSectionHeader = item.section && item.section !== lastSection;
                if (item.section) lastSection = item.section;

                return (
                    <div key={item.title}>
                        {showSectionHeader && (
                            <h4 className={cn(
                                "mb-2 mt-4 px-2 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider",
                                index === 0 && "mt-0"
                            )}>
                                {item.section}
                            </h4>
                        )}
                        <Link
                            href={item.href || '#'}
                            onClick={onNavClick}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.title}
                        </Link>
                    </div>
                );
            })}
        </nav>
    );
}
