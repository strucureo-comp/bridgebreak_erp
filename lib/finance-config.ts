/**
 * Finance Configuration System
 * Manages localization, compliance, and feature settings
 * Now includes multi-engine support for Tally, Microsoft Dynamics 365, and Zoho Books
 */

import type { MultiEngineConfig, AccountingEngine } from './accounting-engines/engine-types';

// Comprehensive global tax regimes
export type TaxRegime = 
  // Asia Pacific
  | 'GST_INDIA' | 'GST_SINGAPORE' | 'GST_AUSTRALIA' | 'GST_NEW_ZEALAND' | 'GST_MALAYSIA'
  | 'VAT_CHINA' | 'CT_JAPAN' | 'VAT_KOREA' | 'VAT_THAILAND' | 'VAT_INDONESIA' 
  | 'VAT_PHILIPPINES' | 'VAT_VIETNAM' | 'VAT_BANGLADESH' | 'ST_PAKISTAN'
  // Europe
  | 'VAT_EU' | 'VAT_UK' | 'VAT_SWITZERLAND' | 'VAT_NORWAY' | 'VAT_RUSSIA' | 'VAT_TURKEY'
  // Americas
  | 'SALES_TAX_US' | 'SALES_TAX_CANADA' | 'IVA_MEXICO' | 'IVA_BRAZIL' 
  | 'IVA_ARGENTINA' | 'IVA_CHILE' | 'IVA_COLOMBIA' | 'IVA_PERU'
  // Middle East & Africa
  | 'VAT_UAE' | 'VAT_SAUDI' | 'VAT_QATAR' | 'VAT_BAHRAIN' | 'VAT_OMAN' | 'VAT_KUWAIT'
  | 'VAT_ISRAEL' | 'VAT_SOUTH_AFRICA' | 'VAT_EGYPT' | 'VAT_NIGERIA' | 'VAT_KENYA'
  | 'NONE';
export type AccountingStandard = 'IFRS' | 'INDIA_AS' | 'US_GAAP';
export type DateFormat = 'ISO' | 'US' | 'EU' | 'INDIA' | 'UK' | 'ASIA';

// Comprehensive global currency support
export type CurrencyCode = 
  // Americas
  | 'USD' | 'CAD' | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'COP' | 'PEN'
  // Europe
  | 'EUR' | 'GBP' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'RUB' | 'TRY'
  // Asia Pacific
  | 'JPY' | 'CNY' | 'INR' | 'KRW' | 'SGD' | 'HKD' | 'TWD' | 'THB' | 'MYR' | 'IDR' | 'PHP' | 'VND' | 'PKR' | 'BDT'
  // Middle East & Africa
  | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'ILS' | 'ZAR' | 'EGP' | 'NGN' | 'KES'
  // Oceania
  | 'AUD' | 'NZD';

export interface FiscalYearConfig {
  start_month: number; // 1-12
  start_day: number; // 1-31
  label: string; // e.g., "FY 2024-25"
}

export interface TaxConfig {
  regime: TaxRegime;
  rates: TaxRate[];
  enable_tax_tracking: boolean;
  tax_id: string; // GST Number, VAT ID, Tax ID
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // percentage
  type: 'GST' | 'CGST' | 'SGST' | 'IGST' | 'VAT' | 'SALES_TAX';
  applicable_from: string;
  applicable_to?: string;
  min_amount?: number; // threshold amount for tax to apply
  max_amount?: number; // optional upper cap for tax application
  tax_application?: 'FULL' | 'EXCESS'; // FULL: apply to full amount once threshold met, EXCESS: apply only on amount above threshold
}

export interface CurrencyConfig {
  base_currency: CurrencyCode;
  enable_multi_currency: boolean;
  exchange_rates: ExchangeRate[];
}

export interface ExchangeRate {
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number;
  effective_date: string;
}

export interface EntityConfig {
  id: string;
  name: string;
  type: 'HEAD_OFFICE' | 'BRANCH' | 'SUBSIDIARY' | 'DIVISION';
  parent_id?: string;
  currency: CurrencyCode;
  tax_config: TaxConfig;
  is_active: boolean;
}

export interface FinanceConfiguration {
  // Company Info
  company_name: string;
  company_id: string;
  
  // Accounting Standard
  accounting_standard: AccountingStandard;
  
  // Fiscal Year
  fiscal_year: FiscalYearConfig;
  
  // Date Format
  date_format: DateFormat;
  
  // Tax Configuration
  tax_config: TaxConfig;
  
  // Currency Configuration
  currency_config: CurrencyConfig;
  
  // Multi-Entity Support
  enable_multi_entity: boolean;
  entities: EntityConfig[];
  default_entity_id?: string;
  
  // Compliance & Reports
  enable_statutory_reports: boolean;
  statutory_reports: string[]; // ['GSTR1', 'GSTR3B', 'VAT_RETURN', 'P&L', 'BALANCE_SHEET']
  
  // Multi-Engine Configuration
  multi_engine_config?: MultiEngineConfig;
  
  // Feature Flags
  features: {
    enable_tax_tracking: boolean;
    enable_multi_currency: boolean;
    enable_multi_entity: boolean;
    enable_branch_accounting: boolean;
    enable_cost_centers: boolean;
    enable_budget_tracking: boolean;
    enable_multi_engine: boolean; // Enable multiple accounting engines
  };
}

// Predefined Tax Rates
// ==================== ASIA PACIFIC TAX RATES ====================

export const GST_INDIA_RATES: TaxRate[] = [
  { id: 'gst_0', name: 'GST 0%', rate: 0, type: 'GST', applicable_from: '2017-07-01' },
  { id: 'gst_5', name: 'GST 5%', rate: 5, type: 'GST', applicable_from: '2017-07-01' },
  { id: 'gst_12', name: 'GST 12%', rate: 12, type: 'GST', applicable_from: '2017-07-01' },
  { id: 'gst_18', name: 'GST 18%', rate: 18, type: 'GST', applicable_from: '2017-07-01' },
  { id: 'gst_28', name: 'GST 28%', rate: 28, type: 'GST', applicable_from: '2017-07-01' },
];

export const GST_SINGAPORE_RATES: TaxRate[] = [
  { id: 'gst_0_sg', name: 'GST 0%', rate: 0, type: 'GST', applicable_from: '2023-01-01' },
  { id: 'gst_9_sg', name: 'GST 9%', rate: 9, type: 'GST', applicable_from: '2024-01-01' },
];

export const GST_AUSTRALIA_RATES: TaxRate[] = [
  { id: 'gst_0_au', name: 'GST 0% (GST-free)', rate: 0, type: 'GST', applicable_from: '2000-07-01' },
  { id: 'gst_10_au', name: 'GST 10%', rate: 10, type: 'GST', applicable_from: '2000-07-01' },
];

export const GST_NEW_ZEALAND_RATES: TaxRate[] = [
  { id: 'gst_0_nz', name: 'GST 0%', rate: 0, type: 'GST', applicable_from: '2010-10-01' },
  { id: 'gst_15_nz', name: 'GST 15%', rate: 15, type: 'GST', applicable_from: '2010-10-01' },
];

export const GST_MALAYSIA_RATES: TaxRate[] = [
  { id: 'gst_0_my', name: 'GST 0%', rate: 0, type: 'GST', applicable_from: '2018-06-01' },
  { id: 'sst_6_my', name: 'SST 6% (Sales Tax)', rate: 6, type: 'GST', applicable_from: '2018-09-01' },
  { id: 'sst_10_my', name: 'SST 10% (Service Tax)', rate: 10, type: 'GST', applicable_from: '2018-09-01' },
];

export const VAT_CHINA_RATES: TaxRate[] = [
  { id: 'vat_0_cn', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2019-04-01' },
  { id: 'vat_6_cn', name: 'VAT 6%', rate: 6, type: 'VAT', applicable_from: '2019-04-01' },
  { id: 'vat_9_cn', name: 'VAT 9%', rate: 9, type: 'VAT', applicable_from: '2019-04-01' },
  { id: 'vat_13_cn', name: 'VAT 13%', rate: 13, type: 'VAT', applicable_from: '2019-04-01' },
];

export const CT_JAPAN_RATES: TaxRate[] = [
  { id: 'ct_0_jp', name: 'Consumption Tax 0%', rate: 0, type: 'VAT', applicable_from: '2019-10-01' },
  { id: 'ct_8_jp', name: 'Consumption Tax 8% (Reduced)', rate: 8, type: 'VAT', applicable_from: '2019-10-01' },
  { id: 'ct_10_jp', name: 'Consumption Tax 10%', rate: 10, type: 'VAT', applicable_from: '2019-10-01' },
];

export const VAT_KOREA_RATES: TaxRate[] = [
  { id: 'vat_0_kr', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2010-01-01' },
  { id: 'vat_10_kr', name: 'VAT 10%', rate: 10, type: 'VAT', applicable_from: '2010-01-01' },
];

export const VAT_THAILAND_RATES: TaxRate[] = [
  { id: 'vat_0_th', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2012-10-01' },
  { id: 'vat_7_th', name: 'VAT 7%', rate: 7, type: 'VAT', applicable_from: '2023-10-01' },
];

export const VAT_INDONESIA_RATES: TaxRate[] = [
  { id: 'vat_0_id', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2022-04-01' },
  { id: 'vat_11_id', name: 'VAT 11%', rate: 11, type: 'VAT', applicable_from: '2022-04-01' },
];

export const VAT_PHILIPPINES_RATES: TaxRate[] = [
  { id: 'vat_0_ph', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2006-02-01' },
  { id: 'vat_12_ph', name: 'VAT 12%', rate: 12, type: 'VAT', applicable_from: '2006-02-01' },
];

export const VAT_VIETNAM_RATES: TaxRate[] = [
  { id: 'vat_0_vn', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2009-01-01' },
  { id: 'vat_5_vn', name: 'VAT 5%', rate: 5, type: 'VAT', applicable_from: '2009-01-01' },
  { id: 'vat_10_vn', name: 'VAT 10%', rate: 10, type: 'VAT', applicable_from: '2009-01-01' },
];

export const VAT_BANGLADESH_RATES: TaxRate[] = [
  { id: 'vat_0_bd', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2019-07-01' },
  { id: 'vat_15_bd', name: 'VAT 15%', rate: 15, type: 'VAT', applicable_from: '2019-07-01' },
];

export const ST_PAKISTAN_RATES: TaxRate[] = [
  { id: 'st_0_pk', name: 'Sales Tax 0%', rate: 0, type: 'SALES_TAX', applicable_from: '2020-01-01' },
  { id: 'st_17_pk', name: 'Sales Tax 17%', rate: 17, type: 'SALES_TAX', applicable_from: '2020-01-01' },
];

// ==================== EUROPE TAX RATES ====================

export const VAT_EU_RATES: TaxRate[] = [
  { id: 'vat_0', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2000-01-01' },
  { id: 'vat_standard', name: 'VAT Standard 20%', rate: 20, type: 'VAT', applicable_from: '2000-01-01' },
  { id: 'vat_reduced', name: 'VAT Reduced 5%', rate: 5, type: 'VAT', applicable_from: '2000-01-01' },
];

export const VAT_UK_RATES: TaxRate[] = [
  { id: 'vat_0_uk', name: 'VAT 0% (Zero-rated)', rate: 0, type: 'VAT', applicable_from: '2011-01-04' },
  { id: 'vat_5_uk', name: 'VAT 5% (Reduced)', rate: 5, type: 'VAT', applicable_from: '2021-10-01' },
  { id: 'vat_20_uk', name: 'VAT 20% (Standard)', rate: 20, type: 'VAT', applicable_from: '2011-01-04' },
];

export const VAT_SWITZERLAND_RATES: TaxRate[] = [
  { id: 'vat_0_ch', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2024-01-01' },
  { id: 'vat_2_6_ch', name: 'VAT 2.6% (Reduced)', rate: 2.6, type: 'VAT', applicable_from: '2024-01-01' },
  { id: 'vat_3_8_ch', name: 'VAT 3.8% (Special)', rate: 3.8, type: 'VAT', applicable_from: '2024-01-01' },
  { id: 'vat_8_1_ch', name: 'VAT 8.1% (Standard)', rate: 8.1, type: 'VAT', applicable_from: '2024-01-01' },
];

export const VAT_NORWAY_RATES: TaxRate[] = [
  { id: 'vat_0_no', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2013-01-01' },
  { id: 'vat_12_no', name: 'VAT 12% (Food)', rate: 12, type: 'VAT', applicable_from: '2023-01-01' },
  { id: 'vat_15_no', name: 'VAT 15% (Transport)', rate: 15, type: 'VAT', applicable_from: '2018-01-01' },
  { id: 'vat_25_no', name: 'VAT 25% (Standard)', rate: 25, type: 'VAT', applicable_from: '2013-01-01' },
];

export const VAT_RUSSIA_RATES: TaxRate[] = [
  { id: 'vat_0_ru', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2019-01-01' },
  { id: 'vat_10_ru', name: 'VAT 10% (Reduced)', rate: 10, type: 'VAT', applicable_from: '2019-01-01' },
  { id: 'vat_20_ru', name: 'VAT 20%', rate: 20, type: 'VAT', applicable_from: '2019-01-01' },
];

export const VAT_TURKEY_RATES: TaxRate[] = [
  { id: 'vat_0_tr', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2023-01-01' },
  { id: 'vat_10_tr', name: 'VAT 10% (Reduced)', rate: 10, type: 'VAT', applicable_from: '2023-01-01' },
  { id: 'vat_20_tr', name: 'VAT 20%', rate: 20, type: 'VAT', applicable_from: '2023-01-01' },
];

// ==================== AMERICAS TAX RATES ====================

export const US_SALES_TAX_RATES: TaxRate[] = [
  { id: 'sales_tax_0', name: 'No Sales Tax', rate: 0, type: 'SALES_TAX', applicable_from: '2000-01-01' },
  { id: 'sales_tax_state', name: 'State Sales Tax', rate: 6.5, type: 'SALES_TAX', applicable_from: '2000-01-01' },
];

export const SALES_TAX_CANADA_RATES: TaxRate[] = [
  { id: 'gst_0_ca', name: 'GST 0%', rate: 0, type: 'GST', applicable_from: '2008-01-01' },
  { id: 'gst_5_ca', name: 'GST 5%', rate: 5, type: 'GST', applicable_from: '2008-01-01' },
  { id: 'hst_13_ca', name: 'HST 13% (Ontario)', rate: 13, type: 'GST', applicable_from: '2010-07-01' },
  { id: 'hst_15_ca', name: 'HST 15% (Atlantic)', rate: 15, type: 'GST', applicable_from: '2016-07-01' },
];

export const IVA_MEXICO_RATES: TaxRate[] = [
  { id: 'iva_0_mx', name: 'IVA 0%', rate: 0, type: 'VAT', applicable_from: '2014-01-01' },
  { id: 'iva_16_mx', name: 'IVA 16%', rate: 16, type: 'VAT', applicable_from: '2014-01-01' },
];

export const IVA_BRAZIL_RATES: TaxRate[] = [
  { id: 'icms_0_br', name: 'ICMS 0%', rate: 0, type: 'SALES_TAX', applicable_from: '2020-01-01' },
  { id: 'icms_18_br', name: 'ICMS 18% (Standard)', rate: 18, type: 'SALES_TAX', applicable_from: '2020-01-01' },
];

export const IVA_ARGENTINA_RATES: TaxRate[] = [
  { id: 'iva_0_ar', name: 'IVA 0%', rate: 0, type: 'VAT', applicable_from: '2020-01-01' },
  { id: 'iva_10_5_ar', name: 'IVA 10.5% (Reduced)', rate: 10.5, type: 'VAT', applicable_from: '2020-01-01' },
  { id: 'iva_21_ar', name: 'IVA 21%', rate: 21, type: 'VAT', applicable_from: '2020-01-01' },
];

export const IVA_CHILE_RATES: TaxRate[] = [
  { id: 'iva_0_cl', name: 'IVA 0%', rate: 0, type: 'VAT', applicable_from: '2023-01-01' },
  { id: 'iva_19_cl', name: 'IVA 19%', rate: 19, type: 'VAT', applicable_from: '2023-01-01' },
];

export const IVA_COLOMBIA_RATES: TaxRate[] = [
  { id: 'iva_0_co', name: 'IVA 0%', rate: 0, type: 'VAT', applicable_from: '2023-01-01' },
  { id: 'iva_5_co', name: 'IVA 5%', rate: 5, type: 'VAT', applicable_from: '2023-01-01' },
  { id: 'iva_19_co', name: 'IVA 19%', rate: 19, type: 'VAT', applicable_from: '2023-01-01' },
];

export const IVA_PERU_RATES: TaxRate[] = [
  { id: 'igv_0_pe', name: 'IGV 0%', rate: 0, type: 'VAT', applicable_from: '2020-01-01' },
  { id: 'igv_18_pe', name: 'IGV 18%', rate: 18, type: 'VAT', applicable_from: '2020-01-01' },
];

// ==================== MIDDLE EAST & AFRICA TAX RATES ====================

export const VAT_UAE_RATES: TaxRate[] = [
  { id: 'vat_0_ae', name: 'VAT 0% (Zero-rated)', rate: 0, type: 'VAT', applicable_from: '2018-01-01' },
  { id: 'vat_5_ae', name: 'VAT 5%', rate: 5, type: 'VAT', applicable_from: '2018-01-01' },
];

export const VAT_SAUDI_RATES: TaxRate[] = [
  { id: 'vat_0_sa', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2020-07-01' },
  { id: 'vat_15_sa', name: 'VAT 15%', rate: 15, type: 'VAT', applicable_from: '2020-07-01' },
];

export const VAT_QATAR_RATES: TaxRate[] = [
  { id: 'vat_0_qa', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2024-01-01' },
];

export const VAT_BAHRAIN_RATES: TaxRate[] = [
  { id: 'vat_0_bh', name: 'VAT 0% (Zero-rated)', rate: 0, type: 'VAT', applicable_from: '2022-01-01' },
  { id: 'vat_10_bh', name: 'VAT 10%', rate: 10, type: 'VAT', applicable_from: '2022-01-01' },
];

export const VAT_OMAN_RATES: TaxRate[] = [
  { id: 'vat_0_om', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2021-04-01' },
  { id: 'vat_5_om', name: 'VAT 5%', rate: 5, type: 'VAT', applicable_from: '2021-04-01' },
];

export const VAT_KUWAIT_RATES: TaxRate[] = [
  { id: 'vat_0_kw', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2024-01-01' },
];

export const VAT_ISRAEL_RATES: TaxRate[] = [
  { id: 'vat_0_il', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2015-10-01' },
  { id: 'vat_17_il', name: 'VAT 17%', rate: 17, type: 'VAT', applicable_from: '2015-10-01' },
];

export const VAT_SOUTH_AFRICA_RATES: TaxRate[] = [
  { id: 'vat_0_za', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2018-04-01' },
  { id: 'vat_15_za', name: 'VAT 15%', rate: 15, type: 'VAT', applicable_from: '2018-04-01' },
];

export const VAT_EGYPT_RATES: TaxRate[] = [
  { id: 'vat_0_eg', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2016-09-08' },
  { id: 'vat_14_eg', name: 'VAT 14%', rate: 14, type: 'VAT', applicable_from: '2016-09-08' },
];

export const VAT_NIGERIA_RATES: TaxRate[] = [
  { id: 'vat_0_ng', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2020-02-01' },
  { id: 'vat_7_5_ng', name: 'VAT 7.5%', rate: 7.5, type: 'VAT', applicable_from: '2020-02-01' },
];

export const VAT_KENYA_RATES: TaxRate[] = [
  { id: 'vat_0_ke', name: 'VAT 0%', rate: 0, type: 'VAT', applicable_from: '2023-07-01' },
  { id: 'vat_16_ke', name: 'VAT 16%', rate: 16, type: 'VAT', applicable_from: '2023-07-01' },
];

// Tax rate mapping helper
export const TAX_RATE_MAP: Record<TaxRegime, TaxRate[]> = {
  // Asia Pacific
  GST_INDIA: GST_INDIA_RATES,
  GST_SINGAPORE: GST_SINGAPORE_RATES,
  GST_AUSTRALIA: GST_AUSTRALIA_RATES,
  GST_NEW_ZEALAND: GST_NEW_ZEALAND_RATES,
  GST_MALAYSIA: GST_MALAYSIA_RATES,
  VAT_CHINA: VAT_CHINA_RATES,
  CT_JAPAN: CT_JAPAN_RATES,
  VAT_KOREA: VAT_KOREA_RATES,
  VAT_THAILAND: VAT_THAILAND_RATES,
  VAT_INDONESIA: VAT_INDONESIA_RATES,
  VAT_PHILIPPINES: VAT_PHILIPPINES_RATES,
  VAT_VIETNAM: VAT_VIETNAM_RATES,
  VAT_BANGLADESH: VAT_BANGLADESH_RATES,
  ST_PAKISTAN: ST_PAKISTAN_RATES,
  // Europe
  VAT_EU: VAT_EU_RATES,
  VAT_UK: VAT_UK_RATES,
  VAT_SWITZERLAND: VAT_SWITZERLAND_RATES,
  VAT_NORWAY: VAT_NORWAY_RATES,
  VAT_RUSSIA: VAT_RUSSIA_RATES,
  VAT_TURKEY: VAT_TURKEY_RATES,
  // Americas
  SALES_TAX_US: US_SALES_TAX_RATES,
  SALES_TAX_CANADA: SALES_TAX_CANADA_RATES,
  IVA_MEXICO: IVA_MEXICO_RATES,
  IVA_BRAZIL: IVA_BRAZIL_RATES,
  IVA_ARGENTINA: IVA_ARGENTINA_RATES,
  IVA_CHILE: IVA_CHILE_RATES,
  IVA_COLOMBIA: IVA_COLOMBIA_RATES,
  IVA_PERU: IVA_PERU_RATES,
  // Middle East & Africa
  VAT_UAE: VAT_UAE_RATES,
  VAT_SAUDI: VAT_SAUDI_RATES,
  VAT_QATAR: VAT_QATAR_RATES,
  VAT_BAHRAIN: VAT_BAHRAIN_RATES,
  VAT_OMAN: VAT_OMAN_RATES,
  VAT_KUWAIT: VAT_KUWAIT_RATES,
  VAT_ISRAEL: VAT_ISRAEL_RATES,
  VAT_SOUTH_AFRICA: VAT_SOUTH_AFRICA_RATES,
  VAT_EGYPT: VAT_EGYPT_RATES,
  VAT_NIGERIA: VAT_NIGERIA_RATES,
  VAT_KENYA: VAT_KENYA_RATES,
  NONE: [],
};

// Default Configurations by Region
export const DEFAULT_CONFIG_INDIA: Partial<FinanceConfiguration> = {
  accounting_standard: 'INDIA_AS',
  fiscal_year: {
    start_month: 4, // April
    start_day: 1,
    label: 'FY 2024-25',
  },
  date_format: 'INDIA',
  tax_config: {
    regime: 'GST_INDIA',
    rates: GST_INDIA_RATES,
    enable_tax_tracking: true,
    tax_id: '',
  },
  currency_config: {
    base_currency: 'INR',
    enable_multi_currency: false,
    exchange_rates: [],
  },
  statutory_reports: ['GSTR1', 'GSTR3B', 'TDS_RETURN', 'P&L', 'BALANCE_SHEET'],
};

export const DEFAULT_CONFIG_EU: Partial<FinanceConfiguration> = {
  accounting_standard: 'IFRS',
  fiscal_year: {
    start_month: 1, // January
    start_day: 1,
    label: '2024',
  },
  date_format: 'EU',
  tax_config: {
    regime: 'VAT_EU',
    rates: VAT_EU_RATES,
    enable_tax_tracking: true,
    tax_id: '',
  },
  currency_config: {
    base_currency: 'EUR',
    enable_multi_currency: true,
    exchange_rates: [],
  },
  statutory_reports: ['VAT_RETURN', 'P&L', 'BALANCE_SHEET'],
};

export const DEFAULT_CONFIG_US: Partial<FinanceConfiguration> = {
  accounting_standard: 'US_GAAP',
  fiscal_year: {
    start_month: 1, // January
    start_day: 1,
    label: '2024',
  },
  date_format: 'US',
  tax_config: {
    regime: 'SALES_TAX_US',
    rates: US_SALES_TAX_RATES,
    enable_tax_tracking: true,
    tax_id: '',
  },
  currency_config: {
    base_currency: 'USD',
    enable_multi_currency: false,
    exchange_rates: [],
  },
  statutory_reports: ['1099', 'P&L', 'BALANCE_SHEET'],
};

/**
 * Format date based on configuration
 */
export function formatDate(date: Date | string, format: DateFormat): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'ISO':
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    case 'US':
      return d.toLocaleDateString('en-US'); // MM/DD/YYYY
    case 'EU':
      return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    case 'INDIA':
      return d.toLocaleDateString('en-IN'); // DD/MM/YYYY
    default:
      return d.toISOString().split('T')[0];
  }
}

/**
 * Get fiscal year for a given date
 */
export function getFiscalYear(date: Date | string, config: FiscalYearConfig): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  
  if (month >= config.start_month) {
    return `FY ${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `FY ${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: TaxRate): number {
  const minAmount = taxRate.min_amount ?? 0;
  const maxAmount = taxRate.max_amount;
  const application = taxRate.tax_application ?? 'FULL';

  if (amount < minAmount) return 0;

  if (application === 'EXCESS') {
    const upper = maxAmount !== undefined ? Math.min(amount, maxAmount) : amount;
    const taxableBase = Math.max(0, upper - minAmount);
    return (taxableBase * taxRate.rate) / 100;
  }

  const taxableBase = maxAmount !== undefined ? Math.min(amount, maxAmount) : amount;
  return (taxableBase * taxRate.rate) / 100;
}

/**
 * Calculate GST components (CGST + SGST for intra-state, IGST for inter-state)
 */
export function calculateGSTComponents(
  amount: number,
  gstRate: number,
  isInterState: boolean
): { cgst: number; sgst: number; igst: number; total: number } {
  const totalGST = (amount * gstRate) / 100;
  
  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalGST,
      total: totalGST,
    };
  } else {
    return {
      cgst: totalGST / 2,
      sgst: totalGST / 2,
      igst: 0,
      total: totalGST,
    };
  }
}

/**
 * Convert currency
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates: ExchangeRate[]
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = exchangeRates.find(
    r => r.from_currency === fromCurrency && r.to_currency === toCurrency
  );
  
  if (rate) {
    return amount * rate.rate;
  }
  
  // Try reverse conversion
  const reverseRate = exchangeRates.find(
    r => r.from_currency === toCurrency && r.to_currency === fromCurrency
  );
  
  if (reverseRate) {
    return amount / reverseRate.rate;
  }
  
  return amount; // Return original if no rate found
}

/**
 * Currency information with symbols, names, and regions
 */
export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  region: string;
  emoji: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  // Americas
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', region: 'Americas', emoji: '🇺🇸' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', region: 'Americas', emoji: '🇨🇦' },
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', region: 'Americas', emoji: '🇲🇽' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', region: 'Americas', emoji: '🇧🇷' },
  ARS: { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', region: 'Americas', emoji: '🇦🇷' },
  CLP: { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', region: 'Americas', emoji: '🇨🇱' },
  COP: { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', region: 'Americas', emoji: '🇨🇴' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', region: 'Americas', emoji: '🇵🇪' },
  
  // Europe
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', region: 'Europe', emoji: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', region: 'Europe', emoji: '🇬🇧' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', region: 'Europe', emoji: '🇨🇭' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', region: 'Europe', emoji: '🇸🇪' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', region: 'Europe', emoji: '🇳🇴' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', region: 'Europe', emoji: '🇩🇰' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', region: 'Europe', emoji: '🇵🇱' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', region: 'Europe', emoji: '🇨🇿' },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', region: 'Europe', emoji: '🇭🇺' },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu', region: 'Europe', emoji: '🇷🇴' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', region: 'Europe', emoji: '🇷🇺' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', region: 'Europe', emoji: '🇹🇷' },
  
  // Asia Pacific
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: 'Asia Pacific', emoji: '🇯🇵' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', region: 'Asia Pacific', emoji: '🇨🇳' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', region: 'Asia Pacific', emoji: '🇮🇳' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', region: 'Asia Pacific', emoji: '🇰🇷' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', region: 'Asia Pacific', emoji: '🇸🇬' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', region: 'Asia Pacific', emoji: '🇭🇰' },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', region: 'Asia Pacific', emoji: '🇹🇼' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', region: 'Asia Pacific', emoji: '🇹🇭' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', region: 'Asia Pacific', emoji: '🇲🇾' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', region: 'Asia Pacific', emoji: '🇮🇩' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', region: 'Asia Pacific', emoji: '🇵🇭' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', region: 'Asia Pacific', emoji: '🇻🇳' },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', region: 'Asia Pacific', emoji: '🇵🇰' },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', region: 'Asia Pacific', emoji: '🇧🇩' },
  
  // Middle East & Africa
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', region: 'Middle East', emoji: '🇦🇪' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', region: 'Middle East', emoji: '🇸🇦' },
  QAR: { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', region: 'Middle East', emoji: '🇶🇦' },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', region: 'Middle East', emoji: '🇰🇼' },
  BHD: { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', region: 'Middle East', emoji: '🇧🇭' },
  OMR: { code: 'OMR', symbol: '﷼', name: 'Omani Rial', region: 'Middle East', emoji: '🇴🇲' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', region: 'Middle East', emoji: '🇮🇱' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', region: 'Africa', emoji: '🇿🇦' },
  EGP: { code: 'EGP', symbol: '£', name: 'Egyptian Pound', region: 'Africa', emoji: '🇪🇬' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', region: 'Africa', emoji: '🇳🇬' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', region: 'Africa', emoji: '🇰🇪' },
  
  // Oceania
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', region: 'Oceania', emoji: '🇦🇺' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', region: 'Oceania', emoji: '🇳🇿' },
};

/**
 * Currency symbols (legacy support)
 */
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = Object.fromEntries(
  Object.entries(CURRENCIES).map(([code, info]) => [code, info.symbol])
) as Record<CurrencyCode, string>;

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const currencyInfo = CURRENCIES[currency];
  const symbol = currencyInfo?.symbol || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get currencies by region
 */
export function getCurrenciesByRegion(region: string): CurrencyInfo[] {
  return Object.values(CURRENCIES).filter(c => c.region === region);
}

/**
 * Get all unique regions
 */
export function getCurrencyRegions(): string[] {
  return Array.from(new Set(Object.values(CURRENCIES).map(c => c.region)));
}

// Default Multi-Engine Configurations
export const DEFAULT_TALLY_CONFIG: Partial<FinanceConfiguration> = {
  ...DEFAULT_CONFIG_INDIA,
  multi_engine_config: {
    primary_engine: 'tally',
    engines: {
      tally: {
        engine: 'tally',
        enabled: true,
        sync_enabled: false,
      },
    },
    auto_sync: false,
    sync_interval_minutes: 30,
  },
  features: {
    enable_tax_tracking: true,
    enable_multi_currency: false,
    enable_multi_entity: false,
    enable_branch_accounting: false,
    enable_cost_centers: false,
    enable_budget_tracking: false,
    enable_multi_engine: false,
  },
};

export const DEFAULT_DYNAMICS365_CONFIG: Partial<FinanceConfiguration> = {
  ...DEFAULT_CONFIG_US,
  multi_engine_config: {
    primary_engine: 'dynamics365',
    engines: {
      dynamics365: {
        engine: 'dynamics365',
        enabled: true,
        credentials: {
          tenantId: '',
          apiKey: '',
          apiSecret: '',
          baseUrl: 'https://api.businesscentral.dynamics.com/v2.0',
        },
        sync_enabled: true,
      },
    },
    auto_sync: true,
    sync_interval_minutes: 15,
  },
  features: {
    enable_tax_tracking: true,
    enable_multi_currency: true,
    enable_multi_entity: true,
    enable_branch_accounting: true,
    enable_cost_centers: true,
    enable_budget_tracking: true,
    enable_multi_engine: false,
  },
};

export const DEFAULT_ZOHOBOOKS_CONFIG: Partial<FinanceConfiguration> = {
  ...DEFAULT_CONFIG_INDIA,
  multi_engine_config: {
    primary_engine: 'zohobooks',
    engines: {
      zohobooks: {
        engine: 'zohobooks',
        enabled: true,
        credentials: {
          apiKey: '',
          organizationId: '',
          baseUrl: 'https://www.zohoapis.com/books/v3',
        },
        sync_enabled: true,
      },
    },
    auto_sync: true,
    sync_interval_minutes: 20,
  },
  features: {
    enable_tax_tracking: true,
    enable_multi_currency: true,
    enable_multi_entity: false,
    enable_branch_accounting: false,
    enable_cost_centers: true,
    enable_budget_tracking: true,
    enable_multi_engine: false,
  },
};

export const DEFAULT_MULTI_ENGINE_CONFIG: Partial<FinanceConfiguration> = {
  ...DEFAULT_CONFIG_INDIA,
  multi_engine_config: {
    primary_engine: 'tally',
    engines: {
      tally: {
        engine: 'tally',
        enabled: true,
        sync_enabled: false,
      },
      dynamics365: {
        engine: 'dynamics365',
        enabled: true,
        credentials: {
          tenantId: '',
          apiKey: '',
          apiSecret: '',
          baseUrl: 'https://api.businesscentral.dynamics.com/v2.0',
        },
        sync_enabled: true,
      },
      zohobooks: {
        engine: 'zohobooks',
        enabled: true,
        credentials: {
          apiKey: '',
          organizationId: '',
          baseUrl: 'https://www.zohoapis.com/books/v3',
        },
        sync_enabled: true,
      },
    },
    auto_sync: true,
    sync_interval_minutes: 30,
  },
  features: {
    enable_tax_tracking: true,
    enable_multi_currency: true,
    enable_multi_entity: true,
    enable_branch_accounting: true,
    enable_cost_centers: true,
    enable_budget_tracking: true,
    enable_multi_engine: true, // Multi-engine mode enabled
  },
};
