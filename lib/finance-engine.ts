/**
 * Unified Finance Engine
 * Unified finance engine with a single combined feature set.
 * One powerful system with global-ready capabilities.
 */

import { TallyEngine } from './tally-engine';
import type { FinancialStatement, TrialBalance, Account, Ledger } from './tally-engine';

export interface UnifiedEngineFeatures {
  name: string;
  description: string;
  source: string;
}

export class UnifiedFinanceEngine {
  private engine: TallyEngine;
  private features: UnifiedEngineFeatures[];

  constructor() {
    this.engine = new TallyEngine();
    this.features = [
      {
        name: 'Double-Entry Bookkeeping',
        description: 'Accurate and balanced accounting',
        source: 'Core',
      },
      {
        name: 'Smart Automation',
        description: 'Automated workflows and tax-ready flows',
        source: 'Core',
      },
      {
        name: 'Multi-Currency Support',
        description: 'Global business ready',
        source: 'Unified',
      },
      {
        name: 'Audit & Compliance',
        description: 'Built-in audit trails',
        source: 'Unified',
      },
      {
        name: 'Real-Time Reports',
        description: 'Instant financial insights',
        source: 'Unified',
      },
    ];
  }

  getEngineName(): string {
    return 'Unified Finance Engine';
  }

  getFeatures(): UnifiedEngineFeatures[] {
    return this.features;
  }

  // Core Engine Methods
  getEngine(): TallyEngine {
    return this.engine;
  }

  getTrialBalance(date: string): TrialBalance[] {
    return this.engine.getTrialBalance(date);
  }

  getFinancialStatement(fromDate: string, toDate: string): FinancialStatement {
    return this.engine.getFinancialStatement(fromDate, toDate);
  }

  getAllAccounts(): Account[] {
    return this.engine.listAccounts();
  }

  getAccountLedger(accountId: string, fromDate: string, toDate: string): Ledger[] {
    return this.engine.getAccountLedger(accountId, fromDate, toDate);
  }

  calculateAccountBalance(accountId: string): number {
    return this.engine.calculateAccountBalance(accountId);
  }

  // Enhanced Features (combining best of all platforms)
  getEnhancedReport(type: 'balance_sheet' | 'income_statement' | 'cash_flow', fromDate: string, toDate: string) {
    const statement = this.getFinancialStatement(fromDate, toDate);
    
    return {
      report_type: type,
      period: { from: fromDate, to: toDate },
      generated_at: new Date().toISOString(),
      engine: 'Unified Finance Engine',
      powered_by: ['Unified'],
      data: type === 'balance_sheet' ? statement.balance_sheet : 
            type === 'income_statement' ? statement.income_statement :
            statement.cash_flow,
    };
  }
}
