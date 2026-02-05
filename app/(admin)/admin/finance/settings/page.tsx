'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FinanceConfigurator } from '@/components/admin/finance-configurator';
import { getSystemSetting, setSystemSetting } from '@/lib/api';
import type { FinanceConfiguration } from '@/lib/finance-config';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FinanceSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [config, setConfig] = useState<Partial<FinanceConfiguration> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      // Allow all admins to access finance settings
      loadConfig();
    }
  }, [user, router]);

  const loadConfig = async () => {
    try {
      const data = await getSystemSetting('finance_config');
      setConfig(data || null);
    } catch (error) {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newConfig: Partial<FinanceConfiguration>) => {
    try {
      const success = await setSystemSetting('finance_config', newConfig);
      if (success) {
        setConfig(newConfig);
        toast.success('Finance configuration saved successfully');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    }
  };

  if (loading) {
    return (
      <DashboardShell requireAdmin>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading configuration...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell requireAdmin>
      <div className="space-y-6">
        <div>
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Finance
            </Button>
          </Link>
        </div>
        <FinanceConfigurator currentConfig={config ?? undefined} onSave={handleSave} />
      </div>
    </DashboardShell>
  );
}
