/**
 * Unified Accounting Engine Types
 * Supports multiple accounting systems: Tally, Microsoft Dynamics 365, Zoho Books
 */

export type AccountingEngine = 'tally' | 'dynamics365' | 'zohobooks';

export interface EngineConfig {
  engine: AccountingEngine;
  enabled: boolean;
  credentials?: {
    apiKey?: string;
    apiSecret?: string;
    tenantId?: string;
    organizationId?: string;
    baseUrl?: string;
  };
  sync_enabled?: boolean;
  last_sync?: string;
}

export interface MultiEngineConfig {
  primary_engine: AccountingEngine;
  engines: {
    tally?: EngineConfig;
    dynamics365?: EngineConfig;
    zohobooks?: EngineConfig;
  };
  auto_sync: boolean;
  sync_interval_minutes: number;
}

// Common interfaces that all engines must implement
export interface IAccountingEngine {
  // Account Management
  createAccount(account: AccountInput): Promise<Account>;
  getAccount(id: string): Promise<Account | null>;
  updateAccount(id: string, updates: Partial<Account>): Promise<Account>;
  deleteAccount(id: string): Promise<boolean>;
  listAccounts(filters?: AccountFilters): Promise<Account[]>;

  // Ledger Entries
  createLedgerEntry(entry: LedgerInput): Promise<Ledger>;
  getLedgerEntries(accountId: string, filters?: DateRange): Promise<Ledger[]>;

  // Financial Statements
  getTrialBalance(date: string): Promise<TrialBalance[]>;
  getBalanceSheet(date: string): Promise<BalanceSheet>;
  getIncomeStatement(fromDate: string, toDate: string): Promise<IncomeStatement>;
  getCashFlow(fromDate: string, toDate: string): Promise<CashFlow>;

  // Reporting
  generateReport(type: ReportType, params: ReportParams): Promise<any>;
  
  // Sync Operations
  syncToEngine(): Promise<SyncResult>;
  syncFromEngine(): Promise<SyncResult>;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  group: string;
  parent_id?: string;
  is_active: boolean;
  balance: number;
  currency?: string;
  engine_id?: string; // ID in external system
  engine_type?: AccountingEngine;
  created_at: string;
  updated_at: string;
}

export interface AccountInput {
  name: string;
  code: string;
  type: AccountType;
  group: string;
  parent_id?: string;
  opening_balance?: number;
  currency?: string;
}

export interface AccountFilters {
  type?: AccountType;
  group?: string;
  is_active?: boolean;
  search?: string;
}

export interface Ledger {
  id: string;
  account_id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference_id?: string;
  reference_type?: string;
  engine_id?: string;
  created_at: string;
}

export interface LedgerInput {
  account_id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  reference_id?: string;
  reference_type?: string;
}

export interface DateRange {
  from_date: string;
  to_date: string;
}

export interface TrialBalance {
  account_id: string;
  account_name: string;
  account_code: string;
  account_type: AccountType;
  debit: number;
  credit: number;
}

export interface BalanceSheet {
  date: string;
  assets: {
    current_assets: Array<{ name: string; amount: number }>;
    fixed_assets: Array<{ name: string; amount: number }>;
    total: number;
  };
  liabilities: {
    current_liabilities: Array<{ name: string; amount: number }>;
    long_term_liabilities: Array<{ name: string; amount: number }>;
    total: number;
  };
  equity: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
}

export interface IncomeStatement {
  period: DateRange;
  revenue: Array<{ name: string; amount: number }>;
  total_revenue: number;
  cost_of_sales: Array<{ name: string; amount: number }>;
  total_cost_of_sales: number;
  gross_profit: number;
  operating_expenses: Array<{ name: string; amount: number }>;
  total_operating_expenses: number;
  operating_income: number;
  other_income: Array<{ name: string; amount: number }>;
  other_expenses: Array<{ name: string; amount: number }>;
  net_income: number;
}

export interface CashFlow {
  period: DateRange;
  opening_balance: number;
  operating_activities: Array<{ name: string; amount: number }>;
  investing_activities: Array<{ name: string; amount: number }>;
  financing_activities: Array<{ name: string; amount: number }>;
  net_change: number;
  closing_balance: number;
}

export type ReportType = 
  | 'trial_balance'
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow'
  | 'aged_receivables'
  | 'aged_payables'
  | 'tax_report'
  | 'audit_trail';

export interface ReportParams {
  from_date?: string;
  to_date?: string;
  date?: string;
  format?: 'json' | 'pdf' | 'excel' | 'csv';
  filters?: any;
}

export interface SyncResult {
  success: boolean;
  synced_at: string;
  records_synced: number;
  errors: string[];
  warnings: string[];
}
