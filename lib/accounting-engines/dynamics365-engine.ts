/**
 * Microsoft Dynamics 365 Finance Engine
 * Integration with Microsoft Dynamics 365 Finance & Operations
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

export class Dynamics365Engine implements IAccountingEngine {
  private config: EngineConfig;
  private baseUrl: string;
  private accessToken?: string;

  constructor(config: EngineConfig) {
    this.config = config;
    this.baseUrl = config.credentials?.baseUrl || 'https://api.businesscentral.dynamics.com/v2.0';
  }

  // Authentication
  private async authenticate(): Promise<string> {
    // OAuth 2.0 authentication with Azure AD
    const tenantId = this.config.credentials?.tenantId;
    const clientId = this.config.credentials?.apiKey;
    const clientSecret = this.config.credentials?.apiSecret;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Dynamics 365 credentials not configured');
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://api.businesscentral.dynamics.com/.default',
          grant_type: 'client_credentials',
        }),
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      return data.access_token as string;
    } catch (error) {
      throw new Error(`Dynamics 365 authentication failed: ${error}`);
    }
  }

  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Dynamics 365 API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Account Management
  async createAccount(account: AccountInput): Promise<Account> {
    const d365Account = {
      number: account.code,
      displayName: account.name,
      category: this.mapAccountType(account.type),
      subCategory: account.group,
      blocked: false,
    };

    const result = await this.apiCall('/accounts', 'POST', d365Account);

    return {
      id: result.id,
      name: result.displayName,
      code: result.number,
      type: account.type,
      group: account.group,
      parent_id: account.parent_id,
      is_active: !result.blocked,
      balance: account.opening_balance || 0,
      currency: account.currency,
      engine_id: result.id,
      engine_type: 'dynamics365',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async getAccount(id: string): Promise<Account | null> {
    try {
      const result = await this.apiCall(`/accounts/${id}`);
      return this.mapD365AccountToAccount(result);
    } catch {
      return null;
    }
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const d365Updates: any = {};
    if (updates.name) d365Updates.displayName = updates.name;
    if (updates.code) d365Updates.number = updates.code;
    if (updates.is_active !== undefined) d365Updates.blocked = !updates.is_active;

    const result = await this.apiCall(`/accounts/${id}`, 'PATCH', d365Updates);
    return this.mapD365AccountToAccount(result);
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      await this.apiCall(`/accounts/${id}`, 'DELETE');
      return true;
    } catch {
      return false;
    }
  }

  async listAccounts(filters?: AccountFilters): Promise<Account[]> {
    let query = '/accounts';
    const params: string[] = [];

    if (filters?.type) {
      params.push(`$filter=category eq '${this.mapAccountType(filters.type)}'`);
    }
    if (filters?.is_active !== undefined) {
      params.push(`blocked eq ${!filters.is_active}`);
    }
    if (filters?.search) {
      params.push(`contains(displayName,'${filters.search}')`);
    }

    if (params.length > 0) {
      query += '?' + params.join('&');
    }

    const result = await this.apiCall(query);
    return result.value.map((acc: any) => this.mapD365AccountToAccount(acc));
  }

  // Ledger Entries
  async createLedgerEntry(entry: LedgerInput): Promise<Ledger> {
    const journalEntry = {
      postingDate: entry.date,
      documentNumber: entry.reference_id || '',
      description: entry.description,
      lines: [
        {
          accountId: entry.account_id,
          debitAmount: entry.debit,
          creditAmount: entry.credit,
        },
      ],
    };

    const result = await this.apiCall('/generalLedgerEntries', 'POST', journalEntry);

    return {
      id: result.id,
      account_id: entry.account_id,
      date: entry.date,
      description: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      balance: entry.debit - entry.credit,
      reference_id: entry.reference_id,
      reference_type: entry.reference_type,
      engine_id: result.id,
      created_at: new Date().toISOString(),
    };
  }

  async getLedgerEntries(accountId: string, filters?: DateRange): Promise<Ledger[]> {
    let query = `/accounts/${accountId}/generalLedgerEntries`;
    
    if (filters) {
      const params: string[] = [];
      if (filters.from_date) {
        params.push(`postingDate ge ${filters.from_date}`);
      }
      if (filters.to_date) {
        params.push(`postingDate le ${filters.to_date}`);
      }
      if (params.length > 0) {
        query += '?$filter=' + params.join(' and ');
      }
    }

    const result = await this.apiCall(query);
    return result.value.map((entry: any) => this.mapD365EntryToLedger(entry, accountId));
  }

  // Financial Statements
  async getTrialBalance(date: string): Promise<TrialBalance[]> {
    const result = await this.apiCall(`/trialBalance?date=${date}`);
    return result.value.map((tb: any) => ({
      account_id: tb.accountId,
      account_name: tb.accountName,
      account_code: tb.accountNumber,
      account_type: this.mapD365CategoryToType(tb.category),
      debit: tb.totalDebit,
      credit: tb.totalCredit,
    }));
  }

  async getBalanceSheet(date: string): Promise<BalanceSheet> {
    const result = await this.apiCall(`/balanceSheet?date=${date}`);
    
    return {
      date,
      assets: {
        current_assets: result.currentAssets || [],
        fixed_assets: result.fixedAssets || [],
        total: result.totalAssets || 0,
      },
      liabilities: {
        current_liabilities: result.currentLiabilities || [],
        long_term_liabilities: result.longTermLiabilities || [],
        total: result.totalLiabilities || 0,
      },
      equity: {
        items: result.equity || [],
        total: result.totalEquity || 0,
      },
    };
  }

  async getIncomeStatement(fromDate: string, toDate: string): Promise<IncomeStatement> {
    const result = await this.apiCall(`/incomeStatement?startDate=${fromDate}&endDate=${toDate}`);
    
    return {
      period: { from_date: fromDate, to_date: toDate },
      revenue: result.revenue || [],
      total_revenue: result.totalRevenue || 0,
      cost_of_sales: result.costOfSales || [],
      total_cost_of_sales: result.totalCostOfSales || 0,
      gross_profit: result.grossProfit || 0,
      operating_expenses: result.operatingExpenses || [],
      total_operating_expenses: result.totalOperatingExpenses || 0,
      operating_income: result.operatingIncome || 0,
      other_income: result.otherIncome || [],
      other_expenses: result.otherExpenses || [],
      net_income: result.netIncome || 0,
    };
  }

  async getCashFlow(fromDate: string, toDate: string): Promise<CashFlow> {
    const result = await this.apiCall(`/cashFlowStatement?startDate=${fromDate}&endDate=${toDate}`);
    
    return {
      period: { from_date: fromDate, to_date: toDate },
      opening_balance: result.openingBalance || 0,
      operating_activities: result.operatingActivities || [],
      investing_activities: result.investingActivities || [],
      financing_activities: result.financingActivities || [],
      net_change: result.netChange || 0,
      closing_balance: result.closingBalance || 0,
    };
  }

  async generateReport(type: ReportType, params: ReportParams): Promise<any> {
    const reportMap: Record<ReportType, string> = {
      trial_balance: 'trialBalance',
      balance_sheet: 'balanceSheet',
      income_statement: 'incomeStatement',
      cash_flow: 'cashFlowStatement',
      aged_receivables: 'agedAccountsReceivable',
      aged_payables: 'agedAccountsPayable',
      tax_report: 'taxReport',
      audit_trail: 'auditTrail',
    };

    const endpoint = reportMap[type];
    if (!endpoint) {
      throw new Error(`Report type ${type} not supported by Dynamics 365`);
    }

    const queryParams = new URLSearchParams();
    if (params.from_date) queryParams.append('startDate', params.from_date);
    if (params.to_date) queryParams.append('endDate', params.to_date);
    if (params.date) queryParams.append('date', params.date);

    return await this.apiCall(`/${endpoint}?${queryParams.toString()}`);
  }

  async syncToEngine(): Promise<SyncResult> {
    return {
      success: true,
      synced_at: new Date().toISOString(),
      records_synced: 0,
      errors: [],
      warnings: ['Sync to Dynamics 365 not yet implemented'],
    };
  }

  async syncFromEngine(): Promise<SyncResult> {
    return {
      success: true,
      synced_at: new Date().toISOString(),
      records_synced: 0,
      errors: [],
      warnings: ['Sync from Dynamics 365 not yet implemented'],
    };
  }

  // Helper Methods
  private mapAccountType(type: string): string {
    const typeMap: Record<string, string> = {
      asset: 'Assets',
      liability: 'Liabilities',
      equity: 'Equity',
      income: 'Income',
      expense: 'Expense',
    };
    return typeMap[type] || type;
  }

  private mapD365CategoryToType(category: string): any {
    const categoryMap: Record<string, string> = {
      'Assets': 'asset',
      'Liabilities': 'liability',
      'Equity': 'equity',
      'Income': 'income',
      'Expense': 'expense',
    };
    return categoryMap[category] || 'asset';
  }

  private mapD365AccountToAccount(d365Account: any): Account {
    return {
      id: d365Account.id,
      name: d365Account.displayName,
      code: d365Account.number,
      type: this.mapD365CategoryToType(d365Account.category),
      group: d365Account.subCategory || '',
      is_active: !d365Account.blocked,
      balance: d365Account.balance || 0,
      engine_id: d365Account.id,
      engine_type: 'dynamics365',
      created_at: d365Account.lastModifiedDateTime || new Date().toISOString(),
      updated_at: d365Account.lastModifiedDateTime || new Date().toISOString(),
    };
  }

  private mapD365EntryToLedger(d365Entry: any, accountId: string): Ledger {
    return {
      id: d365Entry.id,
      account_id: accountId,
      date: d365Entry.postingDate,
      description: d365Entry.description,
      debit: d365Entry.debitAmount || 0,
      credit: d365Entry.creditAmount || 0,
      balance: (d365Entry.debitAmount || 0) - (d365Entry.creditAmount || 0),
      reference_id: d365Entry.documentNumber,
      engine_id: d365Entry.id,
      created_at: d365Entry.lastModifiedDateTime || new Date().toISOString(),
    };
  }
}
