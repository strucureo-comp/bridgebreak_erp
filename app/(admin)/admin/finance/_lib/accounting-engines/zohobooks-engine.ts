/**
 * Zoho Books Engine
 * Integration with Zoho Books cloud accounting system
 */

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
  EngineConfig
} from './engine-types';

export class ZohoBooksEngine implements IAccountingEngine {
  private config: EngineConfig;
  private baseUrl: string;
  private authToken?: string;
  private organizationId?: string;

  constructor(config: EngineConfig) {
    this.config = config;
    this.baseUrl = config.credentials?.baseUrl || 'https://www.zohoapis.com/books/v3';
    this.authToken = config.credentials?.apiKey;
    this.organizationId = config.credentials?.organizationId;
  }

  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    if (!this.authToken) {
      throw new Error('Zoho Books authentication token not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const urlWithOrg = this.organizationId 
      ? `${url}${url.includes('?') ? '&' : '?'}organization_id=${this.organizationId}`
      : url;

    const response = await fetch(urlWithOrg, {
      method,
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zoho Books API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  // Account Management (Chart of Accounts)
  async createAccount(account: AccountInput): Promise<Account> {
    const zohoAccount = {
      account_name: account.name,
      account_code: account.code,
      account_type: this.mapAccountType(account.type),
      parent_account_id: account.parent_id,
      opening_balance: account.opening_balance || 0,
      currency_code: account.currency || 'USD',
    };

    const result = await this.apiCall('/chartofaccounts', 'POST', zohoAccount);

    return {
      id: result.account.account_id,
      name: result.account.account_name,
      code: result.account.account_code,
      type: account.type,
      group: account.group,
      parent_id: result.account.parent_account_id,
      is_active: result.account.is_active,
      balance: result.account.balance || 0,
      currency: result.account.currency_code,
      engine_id: result.account.account_id,
      engine_type: 'zohobooks',
      created_at: result.account.created_time || new Date().toISOString(),
      updated_at: result.account.last_modified_time || new Date().toISOString(),
    };
  }

  async getAccount(id: string): Promise<Account | null> {
    try {
      const result = await this.apiCall(`/chartofaccounts/${id}`);
      return this.mapZohoAccountToAccount(result.account);
    } catch {
      return null;
    }
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const zohoUpdates: any = {};
    if (updates.name) zohoUpdates.account_name = updates.name;
    if (updates.code) zohoUpdates.account_code = updates.code;
    if (updates.is_active !== undefined) zohoUpdates.is_active = updates.is_active;

    const result = await this.apiCall(`/chartofaccounts/${id}`, 'PUT', zohoUpdates);
    return this.mapZohoAccountToAccount(result.account);
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      await this.apiCall(`/chartofaccounts/${id}`, 'DELETE');
      return true;
    } catch {
      return false;
    }
  }

  async listAccounts(filters?: AccountFilters): Promise<Account[]> {
    let query = '/chartofaccounts';
    const params: string[] = [];

    if (filters?.type) {
      params.push(`account_type=${this.mapAccountType(filters.type)}`);
    }
    if (filters?.is_active !== undefined) {
      params.push(`filter_by=${filters.is_active ? 'Status.Active' : 'Status.Inactive'}`);
    }
    if (filters?.search) {
      params.push(`search_text=${encodeURIComponent(filters.search)}`);
    }

    if (params.length > 0) {
      query += '?' + params.join('&');
    }

    const result = await this.apiCall(query);
    return result.chartofaccounts.map((acc: any) => this.mapZohoAccountToAccount(acc));
  }

  // Journal Entries (Ledger)
  async createLedgerEntry(entry: LedgerInput): Promise<Ledger> {
    const journalEntry = {
      journal_date: entry.date,
      reference_number: entry.reference_id || '',
      notes: entry.description,
      line_items: [
        {
          account_id: entry.account_id,
          debit_or_credit: entry.debit > 0 ? 'debit' : 'credit',
          amount: entry.debit > 0 ? entry.debit : entry.credit,
        },
      ],
    };

    const result = await this.apiCall('/journals', 'POST', journalEntry);

    return {
      id: result.journal.journal_id,
      account_id: entry.account_id,
      date: entry.date,
      description: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      balance: entry.debit - entry.credit,
      reference_id: entry.reference_id,
      reference_type: entry.reference_type,
      engine_id: result.journal.journal_id,
      created_at: result.journal.created_time || new Date().toISOString(),
    };
  }

  async getLedgerEntries(accountId: string, filters?: DateRange): Promise<Ledger[]> {
    let query = `/chartofaccounts/${accountId}/transactions`;
    
    if (filters) {
      const params: string[] = [];
      if (filters.from_date) {
        params.push(`date_start=${filters.from_date}`);
      }
      if (filters.to_date) {
        params.push(`date_end=${filters.to_date}`);
      }
      if (params.length > 0) {
        query += '?' + params.join('&');
      }
    }

    const result = await this.apiCall(query);
    return result.transactions?.map((txn: any) => this.mapZohoTransactionToLedger(txn, accountId)) || [];
  }

  // Financial Reports
  async getTrialBalance(date: string): Promise<TrialBalance[]> {
    const result = await this.apiCall(`/reports/trialbalance?date=${date}`);
    return result.trial_balance?.map((tb: any) => ({
      account_id: tb.account_id,
      account_name: tb.account_name,
      account_code: tb.account_code || '',
      account_type: this.mapZohoTypeToInternal(tb.account_type),
      debit: parseFloat(tb.debit_total || '0'),
      credit: parseFloat(tb.credit_total || '0'),
    })) || [];
  }

  async getBalanceSheet(date: string): Promise<BalanceSheet> {
    const result = await this.apiCall(`/reports/balancesheet?date=${date}`);
    const bs = result.balance_sheet;
    
    return {
      date,
      assets: {
        current_assets: bs?.current_assets || [],
        fixed_assets: bs?.fixed_assets || [],
        total: parseFloat(bs?.total_assets || '0'),
      },
      liabilities: {
        current_liabilities: bs?.current_liabilities || [],
        long_term_liabilities: bs?.long_term_liabilities || [],
        total: parseFloat(bs?.total_liabilities || '0'),
      },
      equity: {
        items: bs?.equity || [],
        total: parseFloat(bs?.total_equity || '0'),
      },
    };
  }

  async getIncomeStatement(fromDate: string, toDate: string): Promise<IncomeStatement> {
    const result = await this.apiCall(`/reports/profitandloss?from_date=${fromDate}&to_date=${toDate}`);
    const pl = result.profit_and_loss;
    
    return {
      period: { from_date: fromDate, to_date: toDate },
      revenue: pl?.income || [],
      total_revenue: parseFloat(pl?.total_income || '0'),
      cost_of_sales: pl?.cost_of_goods_sold || [],
      total_cost_of_sales: parseFloat(pl?.total_cost_of_goods_sold || '0'),
      gross_profit: parseFloat(pl?.gross_profit || '0'),
      operating_expenses: pl?.operating_expenses || [],
      total_operating_expenses: parseFloat(pl?.total_operating_expenses || '0'),
      operating_income: parseFloat(pl?.operating_income || '0'),
      other_income: pl?.other_income || [],
      other_expenses: pl?.other_expenses || [],
      net_income: parseFloat(pl?.net_profit || '0'),
    };
  }

  async getCashFlow(fromDate: string, toDate: string): Promise<CashFlow> {
    const result = await this.apiCall(`/reports/cashflow?from_date=${fromDate}&to_date=${toDate}`);
    const cf = result.cash_flow;
    
    return {
      period: { from_date: fromDate, to_date: toDate },
      opening_balance: parseFloat(cf?.opening_balance || '0'),
      operating_activities: cf?.operating_activities || [],
      investing_activities: cf?.investing_activities || [],
      financing_activities: cf?.financing_activities || [],
      net_change: parseFloat(cf?.net_change || '0'),
      closing_balance: parseFloat(cf?.closing_balance || '0'),
    };
  }

  async generateReport(type: ReportType, params: ReportParams): Promise<any> {
    const reportMap: Record<ReportType, string> = {
      trial_balance: 'trialbalance',
      balance_sheet: 'balancesheet',
      income_statement: 'profitandloss',
      cash_flow: 'cashflow',
      aged_receivables: 'receivablesummary',
      aged_payables: 'payablesummary',
      tax_report: 'taxreport',
      audit_trail: 'audittrail',
    };

    const endpoint = reportMap[type];
    if (!endpoint) {
      throw new Error(`Report type ${type} not supported by Zoho Books`);
    }

    const queryParams = new URLSearchParams();
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    if (params.date) queryParams.append('date', params.date);

    return await this.apiCall(`/reports/${endpoint}?${queryParams.toString()}`);
  }

  async syncToEngine(): Promise<SyncResult> {
    return {
      success: true,
      synced_at: new Date().toISOString(),
      records_synced: 0,
      errors: [],
      warnings: ['Sync to Zoho Books not yet fully implemented'],
    };
  }

  async syncFromEngine(): Promise<SyncResult> {
    return {
      success: true,
      synced_at: new Date().toISOString(),
      records_synced: 0,
      errors: [],
      warnings: ['Sync from Zoho Books not yet fully implemented'],
    };
  }

  // Helper Methods
  private mapAccountType(type: string): string {
    const typeMap: Record<string, string> = {
      asset: 'asset',
      liability: 'liability',
      equity: 'equity',
      income: 'income',
      expense: 'expense',
    };
    return typeMap[type] || 'other_asset';
  }

  private mapZohoTypeToInternal(zohoType: string): any {
    const typeMap: Record<string, string> = {
      'asset': 'asset',
      'liability': 'liability',
      'equity': 'equity',
      'income': 'income',
      'expense': 'expense',
    };
    return typeMap[zohoType.toLowerCase()] || 'asset';
  }

  private mapZohoAccountToAccount(zohoAccount: any): Account {
    return {
      id: zohoAccount.account_id,
      name: zohoAccount.account_name,
      code: zohoAccount.account_code || '',
      type: this.mapZohoTypeToInternal(zohoAccount.account_type),
      group: zohoAccount.parent_account_name || '',
      parent_id: zohoAccount.parent_account_id,
      is_active: zohoAccount.is_active !== false,
      balance: parseFloat(zohoAccount.balance || '0'),
      currency: zohoAccount.currency_code,
      engine_id: zohoAccount.account_id,
      engine_type: 'zohobooks',
      created_at: zohoAccount.created_time || new Date().toISOString(),
      updated_at: zohoAccount.last_modified_time || new Date().toISOString(),
    };
  }

  private mapZohoTransactionToLedger(zohoTxn: any, accountId: string): Ledger {
    return {
      id: zohoTxn.transaction_id,
      account_id: accountId,
      date: zohoTxn.date,
      description: zohoTxn.description || zohoTxn.reference_number || '',
      debit: parseFloat(zohoTxn.debit_amount || '0'),
      credit: parseFloat(zohoTxn.credit_amount || '0'),
      balance: parseFloat(zohoTxn.balance || '0'),
      reference_id: zohoTxn.reference_number,
      reference_type: zohoTxn.transaction_type,
      engine_id: zohoTxn.transaction_id,
      created_at: zohoTxn.created_time || new Date().toISOString(),
    };
  }
}
