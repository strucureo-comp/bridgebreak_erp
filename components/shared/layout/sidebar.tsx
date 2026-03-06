'use client';

import { DashboardNav } from './dashboard-nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Cpu } from 'lucide-react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  // Safely get tenant data with fallbacks
  let brandingConfig = null;
  let companyProfile = null;

  try {
    const tenant = useTenant();
    brandingConfig = tenant.brandingConfig;
    companyProfile = tenant.companyProfile;
  } catch (error) {
    console.warn('Tenant context not available in Sidebar');
  }

  const logo = brandingConfig?.logo;
  const companyName = companyProfile?.tradingName || 'BridgeBreak';

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen md:block transition-all duration-300 ease-in-out bg-background border-r border-border",
        isCollapsed ? "w-[72px]" : "w-[250px]"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-14 items-center border-b border-border/50 shrink-0",
          isCollapsed ? "justify-center px-3" : "px-4"
        )}>
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group min-w-0">
            {logo ? (
              <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-muted shrink-0">
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
                <Cpu className="h-4 w-4" />
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="font-bold text-[12px] text-foreground leading-tight truncate">{companyName}</span>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Enterprise OS</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
          <DashboardNav isCollapsed={isCollapsed} />
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/50 bg-muted/20 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
            className="h-8 w-8 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-primary transition-all mx-auto block"
          >
            {isCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
