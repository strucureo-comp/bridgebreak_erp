/**
 * Multi-Engine Accounting Manager
 * Orchestrates multiple accounting engines (Tally, Dynamics 365, Zoho Books)
 * Provides unified interface and data synchronization
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
  MultiEngineConfig,
  AccountingEngine,
} from './engine-types';

import { TallyAdapter } from './tally-adapter';
import { Dynamics365Engine } from './dynamics365-engine';
import { ZohoBooksEngine } from './zohobooks-engine';

export class MultiEngineManager implements IAccountingEngine {
  private config: MultiEngineConfig;
  private engines: Map<AccountingEngine, IAccountingEngine>;
  private primaryEngine: IAccountingEngine;

  constructor(config: MultiEngineConfig) {
    this.config = config;
    this.engines = new Map();

    // Initialize enabled engines
    if (config.engines.tally?.enabled) {
      this.engines.set('tally', new TallyAdapter(config.engines.tally));
    }
    if (config.engines.dynamics365?.enabled) {
      this.engines.set('dynamics365', new Dynamics365Engine(config.engines.dynamics365));
    }
    if (config.engines.zohobooks?.enabled) {
      this.engines.set('zohobooks', new ZohoBooksEngine(config.engines.zohobooks));
    }

    // Set primary engine
    const primaryEngineInstance = this.engines.get(config.primary_engine);
    if (!primaryEngineInstance) {
      throw new Error(`Primary engine ${config.primary_engine} is not enabled`);
    }
    this.primaryEngine = primaryEngineInstance;
  }

  // Get specific engine instance
  getEngine(type: AccountingEngine): IAccountingEngine | undefined {
    return this.engines.get(type);
  }

  // Get all enabled engines
  getEnabledEngines(): AccountingEngine[] {
    return Array.from(this.engines.keys());
  }

  // Check if engine is enabled
  isEngineEnabled(type: AccountingEngine): boolean {
    return this.engines.has(type);
  }

  // Account Management - delegates to primary engine
  async createAccount(account: AccountInput): Promise<Account> {
    const result = await this.primaryEngine.createAccount(account);

    // Sync to other engines if enabled
    if (this.config.auto_sync) {
      await this.syncAccountToOtherEngines(result);
    }

    return result;
  }

  async getAccount(id: string): Promise<Account | null> {
    return await this.primaryEngine.getAccount(id);
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const result = await this.primaryEngine.updateAccount(id, updates);

    if (this.config.auto_sync) {
      await this.syncAccountToOtherEngines(result);
    }

    return result;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await this.primaryEngine.deleteAccount(id);

    if (this.config.auto_sync && result) {
      await this.deleteAccountFromOtherEngines(id);
    }

    return result;
  }

  async listAccounts(filters?: AccountFilters): Promise<Account[]> {
    return await this.primaryEngine.listAccounts(filters);
  }

  // Ledger Entries
  async createLedgerEntry(entry: LedgerInput): Promise<Ledger> {
    const result = await this.primaryEngine.createLedgerEntry(entry);

    if (this.config.auto_sync) {
      await this.syncLedgerToOtherEngines(result);
    }

    return result;
  }

  async getLedgerEntries(accountId: string, filters?: DateRange): Promise<Ledger[]> {
    return await this.primaryEngine.getLedgerEntries(accountId, filters);
  }

  // Financial Statements
  async getTrialBalance(date: string): Promise<TrialBalance[]> {
    return await this.primaryEngine.getTrialBalance(date);
  }

  async getBalanceSheet(date: string): Promise<BalanceSheet> {
    return await this.primaryEngine.getBalanceSheet(date);
  }

  async getIncomeStatement(fromDate: string, toDate: string): Promise<IncomeStatement> {
    return await this.primaryEngine.getIncomeStatement(fromDate, toDate);
  }

  async getCashFlow(fromDate: string, toDate: string): Promise<CashFlow> {
    return await this.primaryEngine.getCashFlow(fromDate, toDate);
  }

  // Reporting
  async generateReport(type: ReportType, params: ReportParams): Promise<any> {
    return await this.primaryEngine.generateReport(type, params);
  }

  // Multi-Engine Sync Operations
  async syncToEngine(): Promise<SyncResult> {
    return await this.primaryEngine.syncToEngine();
  }

  async syncFromEngine(): Promise<SyncResult> {
    return await this.primaryEngine.syncFromEngine();
  }

  // Sync all engines
  async syncAllEngines(): Promise<Map<AccountingEngine, SyncResult>> {
    const results = new Map<AccountingEngine, SyncResult>();

    for (const [engineType, engine] of this.engines) {
      if (engineType !== this.config.primary_engine) {
        try {
          const result = await engine.syncFromEngine();
          results.set(engineType, result);
        } catch (error) {
          results.set(engineType, {
            success: false,
            synced_at: new Date().toISOString(),
            records_synced: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            warnings: [],
          });
        }
      }
    }

    return results;
  }

  // Compare data across engines
  async compareEngineData(date: string): Promise<{
    engine: AccountingEngine;
    trial_balance: TrialBalance[];
    balance_sheet: BalanceSheet;
  }[]> {
    const results: {
      engine: AccountingEngine;
      trial_balance: TrialBalance[];
      balance_sheet: BalanceSheet;
    }[] = [];

    for (const [engineType, engine] of this.engines) {
      try {
        const trialBalance = await engine.getTrialBalance(date);
        const balanceSheet = await engine.getBalanceSheet(date);
        
        results.push({
          engine: engineType,
          trial_balance: trialBalance,
          balance_sheet: balanceSheet,
        });
      } catch (error) {
        console.error(`Error comparing ${engineType}:`, error);
      }
    }

    return results;
  }

  // Get consolidated view from all engines
  async getConsolidatedBalanceSheet(date: string): Promise<BalanceSheet> {
    const sheets = await Promise.all(
      Array.from(this.engines.values()).map(engine => engine.getBalanceSheet(date))
    );

    // Consolidate by summing all amounts
    const consolidated: BalanceSheet = {
      date,
      assets: {
        current_assets: [],
        fixed_assets: [],
        total: 0,
      },
      liabilities: {
        current_liabilities: [],
        long_term_liabilities: [],
        total: 0,
      },
      equity: {
        items: [],
        total: 0,
      },
    };

    sheets.forEach(sheet => {
      consolidated.assets.total += sheet.assets.total;
      consolidated.liabilities.total += sheet.liabilities.total;
      consolidated.equity.total += sheet.equity.total;
    });

    return consolidated;
  }

  // Private helper methods
  private async syncAccountToOtherEngines(account: Account): Promise<void> {
    const syncPromises: Promise<any>[] = [];

    for (const [engineType, engine] of this.engines) {
      if (engineType !== this.config.primary_engine) {
        const accountInput: AccountInput = {
          name: account.name,
          code: account.code,
          type: account.type,
          group: account.group,
          parent_id: account.parent_id,
          opening_balance: account.balance,
          currency: account.currency,
        };

        syncPromises.push(
          engine.createAccount(accountInput).catch((err: unknown) => {
            console.error(`Error syncing account to ${engineType}:`, err);
          })
        );
      }
    }

    await Promise.allSettled(syncPromises);
  }

  private async deleteAccountFromOtherEngines(accountId: string): Promise<void> {
    const deletePromises: Promise<any>[] = [];

    for (const [engineType, engine] of this.engines) {
      if (engineType !== this.config.primary_engine) {
        deletePromises.push(
          engine.deleteAccount(accountId).catch((err: unknown) => {
            console.error(`Error deleting account from ${engineType}:`, err);
          })
        );
      }
    }

    await Promise.allSettled(deletePromises);
  }

  private async syncLedgerToOtherEngines(ledger: Ledger): Promise<void> {
    const syncPromises: Promise<any>[] = [];

    for (const [engineType, engine] of this.engines) {
      if (engineType !== this.config.primary_engine) {
        const ledgerInput: LedgerInput = {
          account_id: ledger.account_id,
          date: ledger.date,
          description: ledger.description,
          debit: ledger.debit,
          credit: ledger.credit,
          reference_id: ledger.reference_id,
          reference_type: ledger.reference_type,
        };

        syncPromises.push(
          engine.createLedgerEntry(ledgerInput).catch((err: unknown) => {
            console.error(`Error syncing ledger to ${engineType}:`, err);
          })
        );
      }
    }

    await Promise.allSettled(syncPromises);
  }

  // Get engine status
  getEngineStatus(): {
    primary: AccountingEngine;
    enabled_engines: AccountingEngine[];
    auto_sync: boolean;
    sync_interval_minutes: number;
  } {
    return {
      primary: this.config.primary_engine,
      enabled_engines: this.getEnabledEngines(),
      auto_sync: this.config.auto_sync,
      sync_interval_minutes: this.config.sync_interval_minutes,
    };
  }
}
