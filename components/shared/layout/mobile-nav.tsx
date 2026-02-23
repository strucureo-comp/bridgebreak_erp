'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    DollarSign,
    ShoppingCart,
    Users,
    Settings,
} from 'lucide-react';

const mobileItems = [
    { title: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Finance', href: '/admin/finance', icon: DollarSign },
    { title: 'Sales', href: '/admin/sales', icon: ShoppingCart },
    { title: 'HR', href: '/admin/hr', icon: Users },
    { title: 'System', href: '/admin/settings', icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card dark:bg-black border-t border-border dark:border-zinc-800 md:hidden px-4">
            <div className="grid h-full grid-cols-5 items-center justify-items-center">
                {mobileItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                isActive 
                                    ? "text-primary font-bold" 
                                    : "text-muted-foreground dark:text-zinc-400"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                            <span className="text-[10px] uppercase tracking-tighter font-black">{item.title}</span>
                            {isActive && <div className="absolute bottom-0 h-1 w-8 bg-primary rounded-t-full" />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
