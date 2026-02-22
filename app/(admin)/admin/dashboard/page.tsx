'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useTenant } from '@/lib/tenant-context';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import {
    Search,
    Bell,
    Users,
    ShieldCheck,
    CheckCircle2,
    Loader2,
    Zap,
    Cpu,
    Archive,
    AlertCircle,
    Moon,
    ChevronDown,
    CreditCard,
    Plus,
    Activity,
    Settings2,
    Cloud,
    Server,
    BarChart3,
    ShoppingCart,
    Briefcase,
    Package,
    Factory,
    DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MotionWrapper, MotionList, MotionItem } from '@/components/ui/motion-wrapper';

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { getModuleLabel, checkAccess } = useTenant();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <DashboardShell requireAdmin>
            <div className="space-y-6 pb-12">

                {/* Screensaver Minimalist Interface */}
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-4 text-center">

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground/90">
                            {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </h1>
                        <p className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-widest mt-2 max-w-md mx-auto">
                            Welcome back, {user?.full_name || 'Administrator'}. All operational sensors are nominal.
                        </p>
                    </div>

                </div>

            </div>
        </DashboardShell>
    );
}
