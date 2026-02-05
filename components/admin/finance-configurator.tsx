'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Globe, 
  Calendar, 
  DollarSign, 
  Building2, 
  FileText, 
  Shield,
  Check,
  Zap,
  Globe2,
  Lock,
  Wallet
} from 'lucide-react';
import type { 
  FinanceConfiguration, 
  TaxRegime, 
  AccountingStandard,
  DateFormat,
  CurrencyCode,
  TaxRate
} from '@/lib/finance-config';
import { 
  DEFAULT_CONFIG_INDIA, 
  DEFAULT_CONFIG_EU, 
  DEFAULT_CONFIG_US,
  TAX_RATE_MAP,
  CURRENCIES,
  getCurrencyRegions
} from '@/lib/finance-config';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FinanceConfiguratorProps {
  currentConfig?: Partial<FinanceConfiguration>;
  onSave: (config: Partial<FinanceConfiguration>) => void;
}

export function FinanceConfigurator({ currentConfig, onSave }: FinanceConfiguratorProps) {
  const [config, setConfig] = useState<Partial<FinanceConfiguration>>(
    currentConfig || {
      company_name: '',
      company_id: '',
      accounting_standard: 'IFRS',
      date_format: 'ISO',
      fiscal_year: {
        start_month: 1,
        start_day: 1,
        label: '2024',
      },
      tax_config: {
        regime: 'NONE',
        rates: [],
        enable_tax_tracking: false,
        tax_id: '',
      },
      currency_config: {
        base_currency: 'USD',
        enable_multi_currency: false,
        exchange_rates: [],
      },
      features: {
        enable_tax_tracking: false,
        enable_multi_currency: false,
        enable_multi_entity: false,
        enable_branch_accounting: false,
        enable_cost_centers: false,
        enable_budget_tracking: false,
        enable_multi_engine: false,
      },
    }
  );

  const applyRegionalTemplate = (region: 'INDIA' | 'EU' | 'US') => {
    let template: Partial<FinanceConfiguration>;
    switch (region) {
      case 'INDIA': template = DEFAULT_CONFIG_INDIA; break;
      case 'EU': template = DEFAULT_CONFIG_EU; break;
      case 'US': template = DEFAULT_CONFIG_US; break;
    }
    setConfig({ ...config, ...template });
    toast.success(`Setup for ${region} applied`);
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Finance Settings</h2>
          <p className="text-slate-500 font-medium">Configure how your business handles money and taxes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold" onClick={() => applyRegionalTemplate('INDIA')}>🇮🇳 India</Button>
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold" onClick={() => applyRegionalTemplate('EU')}>🇪🇺 Europe</Button>
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold" onClick={() => applyRegionalTemplate('US')}>🇺🇸 USA</Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="inline-flex p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
          <TabsTrigger value="general" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Business Info</TabsTrigger>
          <TabsTrigger value="tax" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Tax Setup</TabsTrigger>
          <TabsTrigger value="currency" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Currency</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="rounded-[2.5rem] border-none shadow-sm p-8">
            <CardHeader className="p-0 pb-8">
              <CardTitle className="text-2xl font-black">Company Details</CardTitle>
              <CardDescription className="text-base font-medium text-slate-400">Basic identification for your financial reports</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Company Name</Label>
                  <Input
                    className="h-12 rounded-xl border-slate-200 font-bold text-lg"
                    value={config.company_name}
                    onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                    placeholder="e.g. System Steel LLC"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Registration ID</Label>
                  <Input
                    className="h-12 rounded-xl border-slate-200 font-bold font-mono"
                    value={config.company_id}
                    onChange={(e) => setConfig({ ...config, company_id: e.target.value })}
                    placeholder="Company ID"
                  />
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Accounting Standard</Label>
                  <Select
                    value={config.accounting_standard}
                    onValueChange={(val: AccountingStandard) => setConfig({ ...config, accounting_standard: val })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="IFRS">IFRS (International)</SelectItem>
                      <SelectItem value="INDIA_AS">India AS</SelectItem>
                      <SelectItem value="US_GAAP">US GAAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Preferred Date Format</Label>
                  <Select
                    value={config.date_format}
                    onValueChange={(val: DateFormat) => setConfig({ ...config, date_format: val })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ISO">YYYY-MM-DD</SelectItem>
                      <SelectItem value="US">MM/DD/YYYY</SelectItem>
                      <SelectItem value="EU">DD/MM/YYYY</SelectItem>
                      <SelectItem value="INDIA">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="rounded-[2.5rem] border-none shadow-sm p-8">
            <CardHeader className="p-0 pb-8">
              <CardTitle className="text-2xl font-black">Tax & Compliance</CardTitle>
              <CardDescription className="text-base font-medium text-slate-400">Select your tax regime and enter your tax ID</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                <div className="space-y-1">
                  <p className="font-black text-slate-900">Enable Tax Tracking</p>
                  <p className="text-sm text-slate-500 font-medium">Automatic calculation of VAT/GST on transactions</p>
                </div>
                <Switch
                  checked={config.features?.enable_tax_tracking}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      features: { ...config.features!, enable_tax_tracking: checked },
                      tax_config: { ...config.tax_config!, enable_tax_tracking: checked },
                    })
                  }
                />
              </div>

              {config.features?.enable_tax_tracking && (
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Tax Regime</Label>
                    <Select
                      value={config.tax_config?.regime}
                      onValueChange={(val: TaxRegime) => {
                        const rates = TAX_RATE_MAP[val] || [];
                        setConfig({
                          ...config,
                          tax_config: { ...config.tax_config!, regime: val, rates },
                        });
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[300px]">
                        <SelectItem value="GST_INDIA">🇮🇳 India - GST</SelectItem>
                        <SelectItem value="VAT_UAE">🇦🇪 UAE - VAT</SelectItem>
                        <SelectItem value="VAT_EU">🇪🇺 Europe - VAT</SelectItem>
                        <SelectItem value="SALES_TAX_US">🇺🇸 USA - Sales Tax</SelectItem>
                        <SelectItem value="VAT_UK">🇬🇧 UK - VAT</SelectItem>
                        <SelectItem value="NONE">No Tax System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Tax ID / Registration Number</Label>
                    <Input
                      className="h-12 rounded-xl border-slate-200 font-bold font-mono"
                      value={config.tax_config?.tax_id}
                      onChange={(e) => setConfig({ ...config, tax_config: { ...config.tax_config!, tax_id: e.target.value } })}
                      placeholder="e.g. TRN / GSTIN"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="rounded-[2.5rem] border-none shadow-sm p-8">
            <CardHeader className="p-0 pb-8">
              <CardTitle className="text-2xl font-black">Currency Settings</CardTitle>
              <CardDescription className="text-base font-medium text-slate-400">Choose your base currency for reporting</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700 ml-1">Reporting Currency (Base)</Label>
                <Select
                  value={config.currency_config?.base_currency}
                  onValueChange={(val: CurrencyCode) =>
                    setConfig({ ...config, currency_config: { ...config.currency_config!, base_currency: val } })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 font-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {Object.values(CURRENCIES).map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.emoji} {c.code} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                <div className="space-y-1">
                  <p className="font-black text-slate-900">Multi-Currency Support</p>
                  <p className="text-sm text-slate-500 font-medium">Track transactions in different currencies</p>
                </div>
                <Switch
                  checked={config.features?.enable_multi_currency}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      features: { ...config.features!, enable_multi_currency: checked },
                      currency_config: { ...config.currency_config!, enable_multi_currency: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
        <Button variant="ghost" className="rounded-xl font-bold h-12 px-8">Discard</Button>
        <Button onClick={handleSave} className="rounded-xl bg-slate-900 h-12 px-12 font-black shadow-xl shadow-slate-200 tracking-widest uppercase text-xs">Update Configuration</Button>
      </div>
    </div>
  );
}