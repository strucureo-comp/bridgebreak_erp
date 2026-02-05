'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Cloud, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { MultiEngineConfig, AccountingEngine } from '@/lib/accounting-engines/engine-types';

interface EngineConfiguratorProps {
  currentConfig?: MultiEngineConfig;
  onSave: (config: MultiEngineConfig) => Promise<void>;
}

export function EngineConfigurator({ currentConfig, onSave }: EngineConfiguratorProps) {
  const [config, setConfig] = useState<MultiEngineConfig>(currentConfig || {
    primary_engine: 'tally',
    engines: {
      tally: { engine: 'tally', enabled: true, sync_enabled: false },
      dynamics365: { engine: 'dynamics365', enabled: false, sync_enabled: false },
      zohobooks: { engine: 'zohobooks', enabled: false, sync_enabled: false },
    },
    auto_sync: false,
    sync_interval_minutes: 30,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
      toast.success('Engine configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleEngine = (engine: AccountingEngine, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      engines: {
        ...prev.engines,
        [engine]: {
          ...prev.engines[engine],
          enabled,
        },
      },
    }));
  };

  const updateEngineCredentials = (engine: AccountingEngine, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      engines: {
        ...prev.engines,
        [engine]: {
          ...prev.engines[engine]!,
          credentials: {
            ...prev.engines[engine]?.credentials,
            [field]: value,
          },
        },
      },
    }));
  };

  const getEngineStatus = (engine: AccountingEngine): 'active' | 'inactive' | 'syncing' => {
    const engineConfig = config.engines[engine];
    if (!engineConfig?.enabled) return 'inactive';
    if (engineConfig.sync_enabled) return 'syncing';
    return 'active';
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Multi-Engine Accounting System
          </CardTitle>
          <CardDescription>
            Configure and manage multiple accounting engines simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Tally */}
            <Card className={config.engines.tally?.enabled ? 'border-blue-500' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Tally</CardTitle>
                  <Badge variant={getEngineStatus('tally') === 'active' ? 'default' : 'secondary'}>
                    {getEngineStatus('tally')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.engines.tally?.enabled || false}
                    onCheckedChange={(checked) => toggleEngine('tally', checked)}
                  />
                  <Label>Enable Tally</Label>
                </div>
                {config.primary_engine === 'tally' && (
                  <Badge variant="outline" className="mt-2">Primary</Badge>
                )}
              </CardContent>
            </Card>

            {/* Microsoft Dynamics 365 */}
            <Card className={config.engines.dynamics365?.enabled ? 'border-green-500' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Dynamics 365</CardTitle>
                  <Badge variant={getEngineStatus('dynamics365') === 'active' ? 'default' : 'secondary'}>
                    {getEngineStatus('dynamics365')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.engines.dynamics365?.enabled || false}
                    onCheckedChange={(checked) => toggleEngine('dynamics365', checked)}
                  />
                  <Label>Enable D365</Label>
                </div>
                {config.primary_engine === 'dynamics365' && (
                  <Badge variant="outline" className="mt-2">Primary</Badge>
                )}
              </CardContent>
            </Card>

            {/* Zoho Books */}
            <Card className={config.engines.zohobooks?.enabled ? 'border-orange-500' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Zoho Books</CardTitle>
                  <Badge variant={getEngineStatus('zohobooks') === 'active' ? 'default' : 'secondary'}>
                    {getEngineStatus('zohobooks')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.engines.zohobooks?.enabled || false}
                    onCheckedChange={(checked) => toggleEngine('zohobooks', checked)}
                  />
                  <Label>Enable Zoho</Label>
                </div>
                {config.primary_engine === 'zohobooks' && (
                  <Badge variant="outline" className="mt-2">Primary</Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Primary Engine Selection */}
          <div className="space-y-2">
            <Label>Primary Accounting Engine</Label>
            <Select
              value={config.primary_engine}
              onValueChange={(value) => setConfig({ ...config, primary_engine: value as AccountingEngine })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tally" disabled={!config.engines.tally?.enabled}>
                  Tally (Local)
                </SelectItem>
                <SelectItem value="dynamics365" disabled={!config.engines.dynamics365?.enabled}>
                  Microsoft Dynamics 365
                </SelectItem>
                <SelectItem value="zohobooks" disabled={!config.engines.zohobooks?.enabled}>
                  Zoho Books
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Primary engine handles all transactions. Other engines sync from primary.
            </p>
          </div>

          {/* Auto Sync Settings */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Sync</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically sync data between enabled engines
                </p>
              </div>
              <Switch
                checked={config.auto_sync}
                onCheckedChange={(checked) => setConfig({ ...config, auto_sync: checked })}
              />
            </div>

            {config.auto_sync && (
              <div className="space-y-2">
                <Label>Sync Interval (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={config.sync_interval_minutes}
                  onChange={(e) => setConfig({ ...config, sync_interval_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Engine-Specific Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Engine Credentials</CardTitle>
          <CardDescription>Configure API credentials for cloud-based engines</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dynamics365">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dynamics365">Microsoft Dynamics 365</TabsTrigger>
              <TabsTrigger value="zohobooks">Zoho Books</TabsTrigger>
            </TabsList>

            <TabsContent value="dynamics365" className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input
                  type="text"
                  placeholder="your-tenant-id"
                  value={config.engines.dynamics365?.credentials?.tenantId || ''}
                  onChange={(e) => updateEngineCredentials('dynamics365', 'tenantId', e.target.value)}
                  disabled={!config.engines.dynamics365?.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Client ID (API Key)</Label>
                <Input
                  type="text"
                  placeholder="your-client-id"
                  value={config.engines.dynamics365?.credentials?.apiKey || ''}
                  onChange={(e) => updateEngineCredentials('dynamics365', 'apiKey', e.target.value)}
                  disabled={!config.engines.dynamics365?.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  placeholder="your-client-secret"
                  value={config.engines.dynamics365?.credentials?.apiSecret || ''}
                  onChange={(e) => updateEngineCredentials('dynamics365', 'apiSecret', e.target.value)}
                  disabled={!config.engines.dynamics365?.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  type="url"
                  placeholder="https://api.businesscentral.dynamics.com/v2.0"
                  value={config.engines.dynamics365?.credentials?.baseUrl || ''}
                  onChange={(e) => updateEngineCredentials('dynamics365', 'baseUrl', e.target.value)}
                  disabled={!config.engines.dynamics365?.enabled}
                />
              </div>
            </TabsContent>

            <TabsContent value="zohobooks" className="space-y-4">
              <div className="space-y-2">
                <Label>OAuth Token</Label>
                <Input
                  type="password"
                  placeholder="your-oauth-token"
                  value={config.engines.zohobooks?.credentials?.apiKey || ''}
                  onChange={(e) => updateEngineCredentials('zohobooks', 'apiKey', e.target.value)}
                  disabled={!config.engines.zohobooks?.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Organization ID</Label>
                <Input
                  type="text"
                  placeholder="your-organization-id"
                  value={config.engines.zohobooks?.credentials?.organizationId || ''}
                  onChange={(e) => updateEngineCredentials('zohobooks', 'organizationId', e.target.value)}
                  disabled={!config.engines.zohobooks?.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  type="url"
                  placeholder="https://www.zohoapis.com/books/v3"
                  value={config.engines.zohobooks?.credentials?.baseUrl || ''}
                  onChange={(e) => updateEngineCredentials('zohobooks', 'baseUrl', e.target.value)}
                  disabled={!config.engines.zohobooks?.enabled}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
