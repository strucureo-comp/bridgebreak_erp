'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useTenant } from '@/lib/tenant-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { DashboardNav } from './dashboard-nav';
import { ApprovalsInbox } from './approvals-inbox';
import {
  Menu,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Bell,
  Search,
  Command,
  Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Safely get tenant data with fallbacks
  let tenantStatus = null;
  let brandingConfig = null;
  let companyProfile = null;

  try {
    const tenant = useTenant();
    tenantStatus = tenant.tenantStatus;
    brandingConfig = tenant.brandingConfig;
    companyProfile = tenant.companyProfile;
  } catch (error) {
    console.warn('Tenant context not available in Header');
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className={cn(
      "h-16 border-b border-border bg-background sticky top-0 z-30 flex items-center justify-between px-6 transition-all duration-300",
      scrolled && "shadow-sm shadow-foreground/5"
    )}>
      <div className="flex items-center gap-4">
        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-r border-border bg-background">
            <div className="p-6 border-b border-border/50 bg-muted/50 flex items-center gap-3">
              {brandingConfig?.logo ? (
                <div className="h-8 w-8 rounded-md overflow-hidden flex items-center justify-center bg-background shrink-0">
                  <img src={brandingConfig.logo} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : null}
              <SheetTitle className="text-[14px] font-bold text-foreground">
                {companyProfile?.tradingName || 'Enterprise Workspace'}
              </SheetTitle>
            </div>
            <div className="overflow-y-auto h-full pb-20 no-scrollbar">
              <DashboardNav onNavClick={() => setIsOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-4">
        {/* Action Inbox */}
        <ApprovalsInbox />

        <div className="h-5 w-px bg-border mx-1" />

        {/* User Workspace Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-3 px-1.5 rounded-lg hover:bg-accent group">
              <Avatar className="h-8 w-8 rounded-lg border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                <AvatarFallback className="bg-primary text-primary-foreground text-[12px] font-bold">
                  {user ? getInitials(user.full_name) : 'SA'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-[13px] font-semibold text-foreground leading-none">{user?.full_name || 'System Admin'}</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">{tenantStatus?.business_type || 'Workspace'}</p>
              </div>
              <ChevronDown size={14} className="text-muted-foreground/50 group-hover:text-primary transition-colors ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl border-border shadow-xl" align="end" sideOffset={8}>
            <DropdownMenuLabel className="p-4 bg-muted/30">
              <div className="flex flex-col space-y-1">
                <p className="text-[13px] font-bold text-foreground">{user?.full_name}</p>
                <p className="text-[11px] font-medium text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-[13px] font-medium py-2.5 px-4 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1 my-0.5">
              <Link href="/admin/dashboard/profile" className="flex items-center">
                <User className="mr-3 h-4 w-4 opacity-70" /> Account Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-[13px] font-medium py-2.5 px-4 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1 my-0.5">
              <Link href="/admin/settings" className="flex items-center">
                <Settings className="mr-3 h-4 w-4 opacity-70" /> System Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-[13px] font-semibold py-2.5 px-4 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg mx-1 my-0.5"
            >
              <LogOut className="mr-3 h-4 w-4 opacity-70" /> Sign Out Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
