/**
 * UAE Tax Engine
 * Specifically designed for UAE VAT compliance (Federal Tax Authority - FTA)
 */

import { TaxRate } from '../finance-config';

export type Emirate = 
  | 'Abu Dhabi' 
  | 'Dubai' 
  | 'Sharjah' 
  | 'Ajman' 
  | 'Umm Al Quwain' 
  | 'Ras Al Khaimah' 
  | 'Fujairah';

export const UAE_VAT_RATES: TaxRate[] = [
  { id: 'uae_vat_5', name: 'Standard VAT 5%', rate: 5, type: 'VAT', applicable_from: '2018-01-01' },
  { id: 'uae_vat_0', name: 'Zero Rated VAT 0%', rate: 0, type: 'VAT', applicable_from: '2018-01-01' },
  { id: 'uae_vat_exempt', name: 'Exempt VAT', rate: 0, type: 'VAT', applicable_from: '2018-01-01' },
];

export interface UAEVATReturn {
  period: {
    from: string;
    to: string;
  };
  trn: string;
  emirate_supplies: Record<Emirate, {
    amount: number;
    vat_amount: number;
    adjustments?: number;
  }>;
  total_standard_rated_supplies: number;
  total_standard_rated_vat: number;
  tax_on_expenses: {
    amount: number;
    vat_amount: number;
    recoverable_vat: number;
  };
  net_vat_due: number; // payable or (reclaimable)
}

/**
 * Calculates UAE VAT Return data based on invoices and bills
 */
export function calculateUAEVATReturn(
  trn: string,
  from_date: string,
  to_date: string,
  invoices: any[],
  bills: any[]
): UAEVATReturn {
  const emirates: Emirate[] = [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
  ];

  const emirate_supplies: any = {};
  emirates.forEach(e => {
    emirate_supplies[e] = { amount: 0, vat_amount: 0 };
  });

  let total_standard_rated_supplies = 0;
  let total_standard_rated_vat = 0;

  invoices.forEach(inv => {
    const emirate = (inv.emirate_of_supply as Emirate) || 'Dubai';
    const amount = Number(inv.amount) || 0;
    const vat = Number(inv.tax_amount) || 0;

    if (emirate_supplies[emirate]) {
      emirate_supplies[emirate].amount += amount;
      emirate_supplies[emirate].vat_amount += vat;
    }

    total_standard_rated_supplies += amount;
    total_standard_rated_vat += vat;
  });

  let total_expense_amount = 0;
  let total_expense_vat = 0;

  bills.forEach(bill => {
    total_expense_amount += Number(bill.amount) || 0;
    total_expense_vat += Number(bill.tax_amount) || 0;
  });

  return {
    period: { from: from_date, to: to_date },
    trn,
    emirate_supplies,
    total_standard_rated_supplies,
    total_standard_rated_vat,
    tax_on_expenses: {
      amount: total_expense_amount,
      vat_amount: total_expense_vat,
      recoverable_vat: total_expense_vat, // Usually 100% for engineering businesses
    },
    net_vat_due: total_standard_rated_vat - total_expense_vat
  };
}

/**
 * Validates UAE TRN (15 digits)
 */
export function validateUAETRN(trn: string): boolean {
  const trnRegex = /^100[0-9]{12}$/;
  return trnRegex.test(trn);
}
