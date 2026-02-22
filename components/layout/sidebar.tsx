'use client';

import { DashboardNav } from './dashboard-nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Cpu, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen md:block transition-all duration-300 ease-in-out bg-background border-r border-border",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-16 items-center px-6 border-b border-border/50",
          isCollapsed ? "justify-center px-2" : "justify-start"
        )}>
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
              <Cpu className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[14px] text-foreground leading-none">SSE-SaaS</span>
                <span className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-widest">Enterprise OS</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
          <DashboardNav isCollapsed={isCollapsed} />
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/20">

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-9 w-9 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-primary transition-all mx-auto"
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
