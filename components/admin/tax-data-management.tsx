/**
 * Tax Data Management Admin Component
 * Display and manage APILayer tax data collection
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getTaxDatabaseStatus,
  triggerTaxDataCollection,
  getTaxJobHistory,
  getTaxDatabaseStats,
  getAllTaxCountries,
} from '@/lib/api';
import {
  RefreshCcw,
  Database,
  History,
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface JobResult {
  timestamp: string;
  status: 'success' | 'failed';
  countriesCollected: number;
  errors: number;
  message: string;
  executionTimeMs: number;
}

export function TaxDataManagement() {
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [jobHistory, setJobHistory] = useState<JobResult[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusData, statsData, historyData, countriesData] = await Promise.all([
        getTaxDatabaseStatus(),
        getTaxDatabaseStats(),
        getTaxJobHistory(),
        getAllTaxCountries(),
      ]);

      setStatus(statusData);
      setStats(statsData.stats);
      setJobHistory(historyData);
      setCountries(countriesData);
    } catch (error) {
      console.error('Failed to load tax data:', error);
      toast.error('Failed to load tax data');
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async () => {
    try {
      setCollecting(true);
      const result = await triggerTaxDataCollection();
      toast.success(`Tax collection completed: ${result.result.countriesCollected} countries`);
      await loadData();
    } catch (error) {
      console.error('Collection failed:', error);
      toast.error('Tax data collection failed');
    } finally {
      setCollecting(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tax Data Management</h2>
          <p className="text-sm text-muted-foreground">
            APILayer tax database collection and management
          </p>
        </div>
        <Button
          onClick={handleCollect}
          disabled={collecting}
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${collecting ? 'animate-spin' : ''}`} />
          {collecting ? 'Collecting...' : 'Collect Now'}
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Countries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Total Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCountries || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Database initialized and ready
            </p>
          </CardContent>
        </Card>

        {/* Collection Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Collection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={status?.collectionStatus === 'success' ? 'default' : 'secondary'}
              className="mb-2"
            >
              {status?.collectionStatus || 'Unknown'}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {status?.lastSync
                ? `Last sync: ${new Date(status.lastSync).toLocaleDateString()}`
                : 'No sync yet'}
            </p>
          </CardContent>
        </Card>

        {/* Average VAT Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average VAT Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageVATRate?.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.minVATRate?.toFixed(0)}% - {stats?.maxVATRate?.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="countries" className="w-full">
        <TabsList>
          <TabsTrigger value="countries">Countries ({countries.length})</TabsTrigger>
          <TabsTrigger value="history">Job History ({jobHistory.length})</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Rates by Country</CardTitle>
              <CardDescription>
                Complete list of supported countries with current VAT rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {countries.map((country) => (
                  <div
                    key={country.code}
                    className="flex items-center justify-between p-3 rounded border"
                  >
                    <div>
                      <p className="font-medium text-sm">{country.code}</p>
                      <p className="text-xs text-muted-foreground">{country.name}</p>
                    </div>
                    <Badge>{country.vatRate}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Job History</CardTitle>
              <CardDescription>Last 12 tax data collection executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No job history yet</p>
                ) : (
                  jobHistory.map((job, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {job.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <p className="font-medium text-sm">
                            {new Date(job.timestamp).toLocaleDateString()}
                            {' '}
                            {new Date(job.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{job.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">
                          {job.countriesCollected}/{job.countriesCollected + job.errors}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(job.executionTimeMs / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Tax Data System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Features</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Monthly automatic VAT/tax collection</li>
                  <li>✓ 54+ countries supported</li>
                  <li>✓ Real-time VAT rate lookups</li>
                  <li>✓ Price calculation with automatic tax</li>
                  <li>✓ VAT number validation</li>
                  <li>✓ Job execution history tracking</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Latest Sync</h3>
                <p className="text-sm">
                  {stats?.lastSync
                    ? `${new Date(stats.lastSync).toLocaleDateString()} at ${new Date(
                        stats.lastSync
                      ).toLocaleTimeString()}`
                    : 'No sync yet'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Data Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Tax data is stored in SystemSettings table as JSON, accessible to all
                  users. Job history is maintained for auditing and troubleshooting.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">API Usage</h3>
                <p className="text-sm text-muted-foreground">
                  Free tier: 100 requests/month (54 countries = ~1 request per country per
                  month). Sufficient for monthly collection without additional cost.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TaxDataManagement;
