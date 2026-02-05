'use client';

import { DashboardNav } from './dashboard-nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Hexagon } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] border-r bg-background md:block transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[80px]" : "w-64"
      )}
    >
      <div className="flex h-full flex-col gap-2">
        <div className={cn("flex h-14 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight px-2">
              <div className="bg-primary/10 p-1 rounded-md">
                <Hexagon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col leading-none">
                <span>System Steel Engineering</span>
                <span className="text-[10px] text-muted-foreground font-normal">System Steel Engineering Admin</span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Hexagon className="h-6 w-6 text-primary" />
          )}

        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <DashboardNav isCollapsed={isCollapsed} />
        </div>

        <div className="border-t p-2 flex justify-end">
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="w-full h-10">
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
