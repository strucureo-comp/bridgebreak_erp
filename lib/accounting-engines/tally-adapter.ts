/**
 * Tally Engine Adapter
 * Adapts existing TallyEngine to IAccountingEngine interface
 */

import { TallyEngine } from '../tally-engine';
import type {
  IAccountingEngine,
  Account,
  AccountInput,
  AccountFilters,
  Ledger,
  LedgerInput,
  DateRange,
  TrialBalance,
  BalanceSheet,
  IncomeStatement,
  CashFlow,
  ReportType,
  ReportParams,
  SyncResult,
  EngineConfig,
  AccountType
} from './engine-types';

export class TallyAdapter implements IAccountingEngine {
  private engine: TallyEngine;
  private config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
    this.engine = new TallyEngine();
  }

  async createAccount(account: AccountInput): Promise<Account> {
    const tallyAccount = this.engine.createAccount(
      account.name,
      account.code,
      account.type as any,
      account.group as any,
      account.parent_id,
      account.opening_balance
    );

    return {
      ...tallyAccount,
      balance: tallyAccount.opening_balance,
      currency: account.currency,
      engine_type: 'tally',
      updated_at: tallyAccount.created_at,
    };
  }

  async getAccount(id: string): Promise<Account | null> {
    const account = this.engine.getAccount(id);
    if (!account) return null;

    return {
      ...account,
      balance: this.engine.calculateAccountBalance(id),
      engine_type: 'tally',
      updated_at: account.created_at,
    };
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error(`Account ${id} not found`);
    }

    // Update account properties
    const updatedAccount = { ...account, ...updates };
    // In a real implementation, we would update the internal TallyEngine state
    
    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      this.engine.deleteAccount(id);
      return true;
    } catch {
      return false;
    }
  }

  async listAccounts(filters?: AccountFilters): Promise<Account[]> {
    let accounts = this.engine.listAccounts();

    if (filters?.type) {
      accounts = accounts.filter(acc => acc.type === filters.type);
    }
    if (filters?.group) {
      accounts = accounts.filter(acc => acc.group === filters.group);
    }
    if (filters?.is_active !== undefined) {
      accounts = accounts.filter(acc => acc.is_active === filters.is_active);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      accounts = accounts.filter(acc => 
        acc.name.toLowerCase().includes(search) || 
        acc.code.toLowerCase().includes(search)
      );
    }

    return accounts.map(acc => ({
      ...acc,
      balance: this.engine.calculateAccountBalance(acc.id),
      engine_type: 'tally' as const,
      updated_at: acc.created_at,
    }));
  }

  async createLedgerEntry(entry: LedgerInput): Promise<Ledger> {
    const ledgerEntry = this.engine.addLedgerEntry(
      entry.account_id,
      entry.date,
      entry.description,
      entry.debit,
      entry.credit,
      entry.reference_id || '',
      entry.reference_type as any || 'manual'
    );

    return {
      id: `${ledgerEntry.account_id}-${ledgerEntry.date}-${ledgerEntry.created_at}`,
      ...ledgerEntry,
      balance: ledgerEntry.running_balance,
    };
  }

  async getLedgerEntries(accountId: string, filters?: DateRange): Promise<Ledger[]> {
    let entries = this.engine.getAccountLedger(
      accountId,
      filters?.from_date || '2000-01-01',
      filters?.to_date || '2099-12-31'
    );

    return entries.map(entry => ({
      id: `${entry.account_id}-${entry.date}-${entry.created_at}`,
      account_id: entry.account_id,
      date: entry.date,
      description: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      balance: entry.running_balance,
      reference_id: entry.reference_id,
      reference_type: entry.reference_type,
      created_at: entry.created_at,
    }));
  }

  async getTrialBalance(date: string): Promise<TrialBalance[]> {
    return this.engine.getTrialBalance(date);
  }

  async getBalanceSheet(date: string): Promise<BalanceSheet> {
    const statement = this.engine.getFinancialStatement('2000-01-01', date);
    
    return {
      date,
      assets: {
        current_assets: statement.balance_sheet.assets
          .filter(a => a.name.toLowerCase().includes('current') || 
                      a.name.toLowerCase().includes('cash') ||
                      a.name.toLowerCase().includes('receivable'))
          .map(a => ({ name: a.name, amount: a.amount })),
        fixed_assets: statement.balance_sheet.assets
          .filter(a => a.name.toLowerCase().includes('fixed') || 
                      a.name.toLowerCase().includes('property') ||
                      a.name.toLowerCase().includes('equipment'))
          .map(a => ({ name: a.name, amount: a.amount })),
        total: statement.balance_sheet.total_assets,
      },
      liabilities: {
        current_liabilities: statement.balance_sheet.liabilities
          .filter(l => l.name.toLowerCase().includes('current') || 
                      l.name.toLowerCase().includes('payable'))
          .map(l => ({ name: l.name, amount: l.amount })),
        long_term_liabilities: statement.balance_sheet.liabilities
          .filter(l => l.name.toLowerCase().includes('long') || 
                      l.name.toLowerCase().includes('loan'))
          .map(l => ({ name: l.name, amount: l.amount })),
        total: statement.balance_sheet.total_liabilities,
      },
      equity: {
        items: statement.balance_sheet.equity.map(e => ({ name: e.name, amount: e.amount })),
        total: statement.balance_sheet.total_equity,
      },
    };
  }

  async getIncomeStatement(fromDate: string, toDate: string): Promise<IncomeStatement> {
    const statement = this.engine.getFinancialStatement(fromDate, toDate);
    
    return {
      period: { from_date: fromDate, to_date: toDate },
      revenue: statement.income_statement.revenue,
      total_revenue: statement.income_statement.total_revenue,
      cost_of_sales: [],
      total_cost_of_sales: 0,
      gross_profit: statement.income_statement.total_revenue,
      operating_expenses: statement.income_statement.expenses,
      total_operating_expenses: statement.income_statement.total_expenses,
      operating_income: statement.income_statement.net_income,
      other_income: [],
      other_expenses: [],
      net_income: statement.income_statement.net_income,
    };
  }

  async getCashFlow(fromDate: string, toDate: string): Promise<CashFlow> {
    const statement = this.engine.getFinancialStatement(fromDate, toDate);
    
    return {
      period: { from_date: fromDate, to_date: toDate },
      opening_balance: statement.cash_flow.opening_balance,
      operating_activities: statement.cash_flow.inflows,
      investing_activities: [],
      financing_activities: statement.cash_flow.outflows.map(o => ({ ...o, amount: -o.amount })),
      net_change: statement.cash_flow.closing_balance - statement.cash_flow.opening_balance,
      closing_balance: statement.cash_flow.closing_balance,
    };
  }

  async generateReport(type: ReportType, params: ReportParams): Promise<any> {
    const date = params.date || new Date().toISOString().split('T')[0];
    const fromDate = params.from_date || '2000-01-01';
    const toDate = params.to_date || date;

    switch (type) {
      case 'trial_balance':
        return await this.getTrialBalance(date);
      case 'balance_sheet':
        return await this.getBalanceSheet(date);
      case 'income_statement':
        return await this.getIncomeStatement(fromDate, toDate);
      case 'cash_flow':
        return await this.getCashFlow(fromDate, toDate);
      default:
        throw new Error(`Report type ${type} not supported by Tally adapter`);
    }
  }

  async syncToEngine(): Promise<SyncResult> {
    return {
      success: true,
      synced_at: new Date().toISOString(),
      records_synced: 0,
      errors: [],
      warnings: ['Tally is the local engine - no external sync needed'],
    };
  }

  async syncFromEngine(): Promise<SyncResult> {
    return {
      success: true,
      synced_at: new Date().toISOString(),
      records_synced: 0,
      errors: [],
      warnings: ['Tally is the local engine - no external sync needed'],
    };
  }

  // Get the underlying Tally engine for legacy compatibility
  getTallyEngine(): TallyEngine {
    return this.engine;
  }
}
