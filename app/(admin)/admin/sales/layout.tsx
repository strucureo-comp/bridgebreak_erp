'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutGrid, Users, Briefcase, Zap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { href: '/admin/sales', label: 'Overview', icon: LayoutGrid },
        { href: '/admin/sales/leads', label: 'Leads', icon: Zap },
        { href: '/admin/sales/opportunities', label: 'Pipeline', icon: Briefcase },
        { href: '/admin/sales/customers', label: 'Customers', icon: Users },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Contextual Header within Sales Hub */}
            <div className="border-b border-slate-100 bg-white/50 backdrop-blur-xl sticky top-0 z-30">
                <div className="flex items-center justify-between px-8 py-4">
                    <div className="flex items-center gap-8">
                        {tabs.map(tab => {
                            const isActive = pathname === tab.href;
                            const Icon = tab.icon;
                            return (
                                <Link key={tab.href} href={tab.href}>
                                    <div className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                                        isActive ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}>
                                        <Icon size={18} strokeWidth={2.5} />
                                        <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8">
                {children}
            </div>
        </div>
    );
}
