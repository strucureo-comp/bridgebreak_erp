/**
 * Global Tax Engine
 * Comprehensive tax calculations for 150+ countries
 * Supports VAT, GST, Sales Tax, and regional tax variations
 */

import { Decimal } from '../../prisma/generated/client/runtime/client';

// Tax Types
export type TaxType =
  | 'VAT' // Value Added Tax (EU, Middle East, Africa, Asia)
  | 'GST' // Goods and Services Tax (India, Singapore, Australia, etc.)
  | 'CGST' // Central GST (India)
  | 'SGST' // State GST (India)
  | 'IGST' // Integrated GST (India)
  | 'SALES_TAX' // Sales Tax (US, some other countries)
  | 'HST' // Harmonized Sales Tax (Canada)
  | 'PST' // Provincial Sales Tax (Canada)
  | 'QST' // Quebec Sales Tax (Canada)
  | 'IVA' // Impuesto al Valor Agregado (Latin America)
  | 'ICMS' // Brazil State VAT / Imposto sobre Circulação de Mercadorias
  | 'ISS' // Brazil Service Tax / Imposto Sobre Serviços
  | 'PIS' // Brazil Federal Contribution / Programa de Integração Social
  | 'COFINS' // Brazil Federal Contribution / Contribuição para o Financiamento da Seguridade Social
  | 'IPI' // Brazil Industrial Products Tax
  | 'CONSUMPTION_TAX' // Japan, some other countries
  | 'TVA' // Taxe sur la Valeur Ajoutée (French-speaking countries)
  | 'MWST' // Mehrwertsteuer (German-speaking countries)
  | 'BTW' // Belasting over de toegevoegde waarde (Netherlands)
  | 'EXCISE' // Excise duty
  | 'WITHHOLDING' // Withholding tax
  | 'CUSTOMS' // Customs/import duty
  | 'LUXURY' // Luxury goods tax
  | 'SIN' // Sin tax (alcohol, tobacco)
  | 'ECO' // Environmental/eco tax
  | 'DIGITAL' // Digital services tax
  | 'TOURISM' // Tourism tax
  | 'STAMP' // Stamp duty;

// Country Tax Configuration
export interface CountryTaxConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  primaryTaxType: TaxType;
  taxTypes: TaxType[];
  isFederalSystem: boolean; // Like US, Canada, Brazil with state/provincial taxes
  hasReverseCharge: boolean;
  registrationThreshold?: number;
  digitalServicesThreshold?: number;
}

// Tax Rate Definition
export interface TaxRateDefinition {
  id: string;
  code: string;
  name: string;
  rate: number;
  type: TaxType;
  countryCode: string;
  region?: string; // State/Province code
  category: 'standard' | 'reduced' | 'super_reduced' | 'zero' | 'exempt' | 'special';
  description?: string;
  applicableGoods?: string[]; // Categories of goods/services
  applicableServices?: string[];
  minAmount?: number;
  maxAmount?: number;
  isCompound: boolean;
  validFrom: string;
  validUntil?: string;
}

// Tax Calculation Input
export interface TaxCalculationInput {
  amount: number;
  countryCode: string;
  region?: string; // State/Province
  customerTaxId?: string;
  isB2B: boolean;
  isTaxExempt: boolean;
  goodsCategory?: string;
  serviceCategory?: string;
  lineItems?: LineItemInput[];
}

export interface LineItemInput {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  goodsCategory?: string;
  serviceCategory?: string;
  taxRateCode?: string;
  isTaxExempt?: boolean;
}

// Tax Calculation Result
export interface TaxCalculationResult {
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  currency?: string;
  countryCode: string;
  isReverseCharge: boolean;
  breakdown: TaxBreakdownItem[];
  lineItems: LineItemResult[];
}

export interface TaxBreakdownItem {
  taxType: TaxType;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  name: string;
  code: string;
  region?: string;
}

export interface LineItemResult {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  taxBreakdown: TaxBreakdownItem[];
}

// ============================================
// COMPREHENSIVE COUNTRY TAX CONFIGURATIONS
// ============================================

export const COUNTRY_TAX_CONFIGS: Record<string, CountryTaxConfig> = {
  // ASIA PACIFIC
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    primaryTaxType: 'GST',
    taxTypes: ['CGST', 'SGST', 'IGST'],
    isFederalSystem: true,
    hasReverseCharge: true,
    registrationThreshold: 2000000, // 20 lakhs
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    currency: 'SGD',
    primaryTaxType: 'GST',
    taxTypes: ['GST'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 1000000, // SGD 1 million
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    currency: 'AUD',
    primaryTaxType: 'GST',
    taxTypes: ['GST'],
    isFederalSystem: false,
    hasReverseCharge: false,
    registrationThreshold: 75000,
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    currency: 'NZD',
    primaryTaxType: 'GST',
    taxTypes: ['GST'],
    isFederalSystem: false,
    hasReverseCharge: false,
    registrationThreshold: 60000,
  },
  MY: {
    countryCode: 'MY',
    countryName: 'Malaysia',
    currency: 'MYR',
    primaryTaxType: 'GST', // Now SST but historically GST
    taxTypes: ['SALES_TAX', 'GST'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 500000,
  },
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    currency: 'CNY',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0, // Various thresholds based on business type
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    currency: 'JPY',
    primaryTaxType: 'CONSUMPTION_TAX',
    taxTypes: ['CONSUMPTION_TAX'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 10000000, // JPY 10 million
  },
  KR: {
    countryCode: 'KR',
    countryName: 'South Korea',
    currency: 'KRW',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 80000000, // KRW 80 million
  },
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    currency: 'THB',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 1800000, // THB 1.8 million
  },
  ID: {
    countryCode: 'ID',
    countryName: 'Indonesia',
    currency: 'IDR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 4800000000, // IDR 4.8 billion
  },
  PH: {
    countryCode: 'PH',
    countryName: 'Philippines',
    currency: 'PHP',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 3000000, // PHP 3 million
  },
  VN: {
    countryCode: 'VN',
    countryName: 'Vietnam',
    currency: 'VND',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 100000000000, // VND 100 billion/year
  },
  BD: {
    countryCode: 'BD',
    countryName: 'Bangladesh',
    currency: 'BDT',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 8000000, // BDT 80 lakhs
  },
  PK: {
    countryCode: 'PK',
    countryName: 'Pakistan',
    currency: 'PKR',
    primaryTaxType: 'SALES_TAX',
    taxTypes: ['SALES_TAX'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  TW: {
    countryCode: 'TW',
    countryName: 'Taiwan',
    currency: 'TWD',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  HK: {
    countryCode: 'HK',
    countryName: 'Hong Kong',
    currency: 'HKD',
    primaryTaxType: 'GST', // No GST/VAT currently
    taxTypes: [],
    isFederalSystem: false,
    hasReverseCharge: false,
    registrationThreshold: 0,
  },

  // EUROPE
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 85000,
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 22000, // EUR 22,000 (used to be 17,500 GBP)
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 65000,
  },
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  NL: {
    countryCode: 'NL',
    countryName: 'Netherlands',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  BE: {
    countryCode: 'BE',
    countryName: 'Belgium',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 25000,
  },
  AT: {
    countryCode: 'AT',
    countryName: 'Austria',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 35000,
  },
  PT: {
    countryCode: 'PT',
    countryName: 'Portugal',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  GR: {
    countryCode: 'GR',
    countryName: 'Greece',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 10000,
  },
  IE: {
    countryCode: 'IE',
    countryName: 'Ireland',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 37500, // Services: 37500, Goods: 75000
  },
  DK: {
    countryCode: 'DK',
    countryName: 'Denmark',
    currency: 'DKK',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 50000,
  },
  SE: {
    countryCode: 'SE',
    countryName: 'Sweden',
    currency: 'SEK',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 80000,
  },
  NO: {
    countryCode: 'NO',
    countryName: 'Norway',
    currency: 'NOK',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 50000,
  },
  FI: {
    countryCode: 'FI',
    countryName: 'Finland',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 15000,
  },
  PL: {
    countryCode: 'PL',
    countryName: 'Poland',
    currency: 'PLN',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  CZ: {
    countryCode: 'CZ',
    countryName: 'Czech Republic',
    currency: 'CZK',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  HU: {
    countryCode: 'HU',
    countryName: 'Hungary',
    currency: 'HUF',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  RO: {
    countryCode: 'RO',
    countryName: 'Romania',
    currency: 'RON',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  BG: {
    countryCode: 'BG',
    countryName: 'Bulgaria',
    currency: 'BGN',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 50000,
  },
  HR: {
    countryCode: 'HR',
    countryName: 'Croatia',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  SI: {
    countryCode: 'SI',
    countryName: 'Slovenia',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 50000,
  },
  SK: {
    countryCode: 'SK',
    countryName: 'Slovakia',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  LT: {
    countryCode: 'LT',
    countryName: 'Lithuania',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 45000,
  },
  LV: {
    countryCode: 'LV',
    countryName: 'Latvia',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 40000,
  },
  EE: {
    countryCode: 'EE',
    countryName: 'Estonia',
    currency: 'EUR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 40000,
  },
  CH: {
    countryCode: 'CH',
    countryName: 'Switzerland',
    currency: 'CHF',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 100000,
  },
  IS: {
    countryCode: 'IS',
    countryName: 'Iceland',
    currency: 'ISK',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  LI: {
    countryCode: 'LI',
    countryName: 'Liechtenstein',
    currency: 'CHF',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 100000,
  },
  RU: {
    countryCode: 'RU',
    countryName: 'Russia',
    currency: 'RUB',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  UA: {
    countryCode: 'UA',
    countryName: 'Ukraine',
    currency: 'UAH',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 1000000, // UAH 1 million
  },
  TR: {
    countryCode: 'TR',
    countryName: 'Turkey',
    currency: 'TRY',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },

  // AMERICAS
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    primaryTaxType: 'SALES_TAX',
    taxTypes: ['SALES_TAX'],
    isFederalSystem: true,
    hasReverseCharge: false,
    registrationThreshold: 0, // Varies by state
    digitalServicesThreshold: 100000,
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    currency: 'CAD',
    primaryTaxType: 'GST',
    taxTypes: ['GST', 'HST', 'PST', 'QST'],
    isFederalSystem: true,
    hasReverseCharge: true,
    registrationThreshold: 30000,
  },
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    currency: 'MXN',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    currency: 'BRL',
    primaryTaxType: 'ICMS',
    taxTypes: ['ICMS', 'ISS', 'PIS', 'COFINS', 'IPI'],
    isFederalSystem: true,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  AR: {
    countryCode: 'AR',
    countryName: 'Argentina',
    currency: 'ARS',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  CL: {
    countryCode: 'CL',
    countryName: 'Chile',
    currency: 'CLP',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    currency: 'COP',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  PE: {
    countryCode: 'PE',
    countryName: 'Peru',
    currency: 'PEN',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  UY: {
    countryCode: 'UY',
    countryName: 'Uruguay',
    currency: 'UYU',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  PY: {
    countryCode: 'PY',
    countryName: 'Paraguay',
    currency: 'PYG',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  BO: {
    countryCode: 'BO',
    countryName: 'Bolivia',
    currency: 'BOB',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  EC: {
    countryCode: 'EC',
    countryName: 'Ecuador',
    currency: 'USD',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  VE: {
    countryCode: 'VE',
    countryName: 'Venezuela',
    currency: 'VES',
    primaryTaxType: 'IVA',
    taxTypes: ['IVA'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },

  // MIDDLE EAST
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    currency: 'AED',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 187500,
  },
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    currency: 'SAR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 375000,
  },
  QA: {
    countryCode: 'QA',
    countryName: 'Qatar',
    currency: 'QAR',
    primaryTaxType: 'GST', // No VAT yet
    taxTypes: [],
    isFederalSystem: false,
    hasReverseCharge: false,
    registrationThreshold: 0,
  },
  BH: {
    countryCode: 'BH',
    countryName: 'Bahrain',
    currency: 'BHD',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 37500,
  },
  OM: {
    countryCode: 'OM',
    countryName: 'Oman',
    currency: 'OMR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 38500,
  },
  KW: {
    countryCode: 'KW',
    countryName: 'Kuwait',
    currency: 'KWD',
    primaryTaxType: 'GST', // No VAT yet
    taxTypes: [],
    isFederalSystem: false,
    hasReverseCharge: false,
    registrationThreshold: 0,
  },
  IL: {
    countryCode: 'IL',
    countryName: 'Israel',
    currency: 'ILS',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 102282, // ILS
  },
  JO: {
    countryCode: 'JO',
    countryName: 'Jordan',
    currency: 'JOD',
    primaryTaxType: 'GST', // Sales tax
    taxTypes: ['SALES_TAX'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  LB: {
    countryCode: 'LB',
    countryName: 'Lebanon',
    currency: 'LBP',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  EG: {
    countryCode: 'EG',
    countryName: 'Egypt',
    currency: 'EGP',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 500000,
  },

  // AFRICA
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    currency: 'ZAR',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 1000000,
  },
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    currency: 'NGN',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 25000000,
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    currency: 'KES',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 5000000,
  },
  GH: {
    countryCode: 'GH',
    countryName: 'Ghana',
    currency: 'GHS',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 200000,
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    currency: 'TZS',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 100000000,
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    currency: 'UGX',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 150000000,
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    currency: 'RWF',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  ET: {
    countryCode: 'ET',
    countryName: 'Ethiopia',
    currency: 'ETB',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 500000,
  },
  MA: {
    countryCode: 'MA',
    countryName: 'Morocco',
    currency: 'MAD',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 500000,
  },
  TN: {
    countryCode: 'TN',
    countryName: 'Tunisia',
    currency: 'TND',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  DZ: {
    countryCode: 'DZ',
    countryName: 'Algeria',
    currency: 'DZD',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },

  // OCEANIA
  FJ: {
    countryCode: 'FJ',
    countryName: 'Fiji',
    currency: 'FJD',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 60000,
  },
  PG: {
    countryCode: 'PG',
    countryName: 'Papua New Guinea',
    currency: 'PGK',
    primaryTaxType: 'GST',
    taxTypes: ['GST'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 250000,
  },
  SB: {
    countryCode: 'SB',
    countryName: 'Solomon Islands',
    currency: 'SBD',
    primaryTaxType: 'GST',
    taxTypes: ['GST'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
  VU: {
    countryCode: 'VU',
    countryName: 'Vanuatu',
    currency: 'VUV',
    primaryTaxType: 'VAT',
    taxTypes: ['VAT'],
    isFederalSystem: false,
    hasReverseCharge: true,
    registrationThreshold: 0,
  },
};

// ============================================
// COMPREHENSIVE TAX RATES DATABASE
// ============================================

export const GLOBAL_TAX_RATES: TaxRateDefinition[] = [
  // INDIA GST Rates
  { id: 'in_gst_0', code: 'IN_GST_0', name: 'GST 0%', rate: 0, type: 'GST', countryCode: 'IN', category: 'zero', description: 'Exempt goods/services', isCompound: false, validFrom: '2017-07-01' },
  { id: 'in_gst_5', code: 'IN_GST_5', name: 'GST 5%', rate: 5, type: 'GST', countryCode: 'IN', category: 'reduced', description: 'Essential goods', isCompound: false, validFrom: '2017-07-01' },
  { id: 'in_gst_12', code: 'IN_GST_12', name: 'GST 12%', rate: 12, type: 'GST', countryCode: 'IN', category: 'reduced', description: 'Standard goods', isCompound: false, validFrom: '2017-07-01' },
  { id: 'in_gst_18', code: 'IN_GST_18', name: 'GST 18%', rate: 18, type: 'GST', countryCode: 'IN', category: 'standard', description: 'Most goods/services', isCompound: false, validFrom: '2017-07-01' },
  { id: 'in_gst_28', code: 'IN_GST_28', name: 'GST 28%', rate: 28, type: 'GST', countryCode: 'IN', category: 'special', description: 'Luxury/sin goods', isCompound: false, validFrom: '2017-07-01' },
  { id: 'in_cgst_9', code: 'IN_CGST_9', name: 'CGST 9%', rate: 9, type: 'CGST', countryCode: 'IN', category: 'standard', description: 'Central GST component', isCompound: false, validFrom: '2017-07-01' },
  { id: 'in_sgst_9', code: 'IN_SGST_9', name: 'SGST 9%', rate: 9, type: 'SGST', countryCode: 'IN', category: 'standard', description: 'State GST component', isCompound: false, validFrom: '2017-07-01' },
  { id: 'in_igst_18', code: 'IN_IGST_18', name: 'IGST 18%', rate: 18, type: 'IGST', countryCode: 'IN', category: 'standard', description: 'Inter-state GST', isCompound: false, validFrom: '2017-07-01' },

  // SINGAPORE GST
  { id: 'sg_gst_0', code: 'SG_GST_0', name: 'GST 0%', rate: 0, type: 'GST', countryCode: 'SG', category: 'zero', description: 'Exempt supplies', isCompound: false, validFrom: '2023-01-01' },
  { id: 'sg_gst_9', code: 'SG_GST_9', name: 'GST 9%', rate: 9, type: 'GST', countryCode: 'SG', category: 'standard', description: 'Standard rate', isCompound: false, validFrom: '2024-01-01' },

  // AUSTRALIA GST
  { id: 'au_gst_0', code: 'AU_GST_0', name: 'GST Free', rate: 0, type: 'GST', countryCode: 'AU', category: 'zero', description: 'GST-free supplies', isCompound: false, validFrom: '2000-07-01' },
  { id: 'au_gst_10', code: 'AU_GST_10', name: 'GST 10%', rate: 10, type: 'GST', countryCode: 'AU', category: 'standard', description: 'Standard rate', isCompound: false, validFrom: '2000-07-01' },

  // NEW ZEALAND GST
  { id: 'nz_gst_0', code: 'NZ_GST_0', name: 'GST 0%', rate: 0, type: 'GST', countryCode: 'NZ', category: 'zero', isCompound: false, validFrom: '2010-10-01' },
  { id: 'nz_gst_15', code: 'NZ_GST_15', name: 'GST 15%', rate: 15, type: 'GST', countryCode: 'NZ', category: 'standard', isCompound: false, validFrom: '2010-10-01' },

  // MALAYSIA SST
  { id: 'my_sst_0', code: 'MY_SST_0', name: 'SST 0%', rate: 0, type: 'SALES_TAX', countryCode: 'MY', category: 'zero', isCompound: false, validFrom: '2018-09-01' },
  { id: 'my_sst_5', code: 'MY_SST_5', name: 'Sales Tax 5%', rate: 5, type: 'SALES_TAX', countryCode: 'MY', category: 'reduced', isCompound: false, validFrom: '2018-09-01' },
  { id: 'my_sst_10', code: 'MY_SST_10', name: 'Sales Tax 10%', rate: 10, type: 'SALES_TAX', countryCode: 'MY', category: 'standard', isCompound: false, validFrom: '2018-09-01' },
  { id: 'my_service_6', code: 'MY_SERVICE_6', name: 'Service Tax 6%', rate: 6, type: 'SALES_TAX', countryCode: 'MY', category: 'reduced', isCompound: false, validFrom: '2018-09-01' },
  { id: 'my_service_8', code: 'MY_SERVICE_8', name: 'Service Tax 8%', rate: 8, type: 'SALES_TAX', countryCode: 'MY', category: 'standard', isCompound: false, validFrom: '2024-03-01' },

  // CHINA VAT
  { id: 'cn_vat_0', code: 'CN_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'CN', category: 'zero', isCompound: false, validFrom: '2019-04-01' },
  { id: 'cn_vat_6', code: 'CN_VAT_6', name: 'VAT 6%', rate: 6, type: 'VAT', countryCode: 'CN', category: 'reduced', description: 'Services, intangible assets', isCompound: false, validFrom: '2019-04-01' },
  { id: 'cn_vat_9', code: 'CN_VAT_9', name: 'VAT 9%', rate: 9, type: 'VAT', countryCode: 'CN', category: 'reduced', description: 'Transport, postal, basic goods', isCompound: false, validFrom: '2019-04-01' },
  { id: 'cn_vat_13', code: 'CN_VAT_13', name: 'VAT 13%', rate: 13, type: 'VAT', countryCode: 'CN', category: 'standard', description: 'Most goods', isCompound: false, validFrom: '2019-04-01' },

  // JAPAN CONSUMPTION TAX
  { id: 'jp_ct_0', code: 'JP_CT_0', name: 'Consumption Tax 0%', rate: 0, type: 'CONSUMPTION_TAX', countryCode: 'JP', category: 'zero', isCompound: false, validFrom: '2019-10-01' },
  { id: 'jp_ct_8', code: 'JP_CT_8', name: 'Consumption Tax 8% (Reduced)', rate: 8, type: 'CONSUMPTION_TAX', countryCode: 'JP', category: 'reduced', description: 'Food, beverages (excluding alcohol)', isCompound: false, validFrom: '2019-10-01' },
  { id: 'jp_ct_10', code: 'JP_CT_10', name: 'Consumption Tax 10%', rate: 10, type: 'CONSUMPTION_TAX', countryCode: 'JP', category: 'standard', isCompound: false, validFrom: '2019-10-01' },

  // SOUTH KOREA VAT
  { id: 'kr_vat_0', code: 'KR_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'KR', category: 'zero', isCompound: false, validFrom: '1977-07-01' },
  { id: 'kr_vat_10', code: 'KR_VAT_10', name: 'VAT 10%', rate: 10, type: 'VAT', countryCode: 'KR', category: 'standard', isCompound: false, validFrom: '1977-07-01' },

  // THAILAND VAT
  { id: 'th_vat_0', code: 'TH_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'TH', category: 'zero', isCompound: false, validFrom: '1992-01-01' },
  { id: 'th_vat_7', code: 'TH_VAT_7', name: 'VAT 7%', rate: 7, type: 'VAT', countryCode: 'TH', category: 'standard', isCompound: false, validFrom: '1992-01-01' },

  // INDONESIA VAT
  { id: 'id_vat_0', code: 'ID_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'ID', category: 'zero', isCompound: false, validFrom: '2022-04-01' },
  { id: 'id_vat_11', code: 'ID_VAT_11', name: 'VAT 11%', rate: 11, type: 'VAT', countryCode: 'ID', category: 'standard', isCompound: false, validFrom: '2022-04-01' },
  { id: 'id_vat_12', code: 'ID_VAT_12', name: 'VAT 12%', rate: 12, type: 'VAT', countryCode: 'ID', category: 'standard', isCompound: false, validFrom: '2025-01-01' },

  // PHILIPPINES VAT
  { id: 'ph_vat_0', code: 'PH_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'PH', category: 'zero', isCompound: false, validFrom: '2006-02-01' },
  { id: 'ph_vat_12', code: 'PH_VAT_12', name: 'VAT 12%', rate: 12, type: 'VAT', countryCode: 'PH', category: 'standard', isCompound: false, validFrom: '2006-02-01' },

  // VIETNAM VAT
  { id: 'vn_vat_0', code: 'VN_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'VN', category: 'zero', isCompound: false, validFrom: '2009-01-01' },
  { id: 'vn_vat_5', code: 'VN_VAT_5', name: 'VAT 5%', rate: 5, type: 'VAT', countryCode: 'VN', category: 'reduced', isCompound: false, validFrom: '2009-01-01' },
  { id: 'vn_vat_10', code: 'VN_VAT_10', name: 'VAT 10%', rate: 10, type: 'VAT', countryCode: 'VN', category: 'standard', isCompound: false, validFrom: '2009-01-01' },

  // UK VAT
  { id: 'gb_vat_0', code: 'GB_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'GB', category: 'zero', isCompound: false, validFrom: '1973-04-01' },
  { id: 'gb_vat_5', code: 'GB_VAT_5', name: 'VAT 5% (Reduced)', rate: 5, type: 'VAT', countryCode: 'GB', category: 'reduced', description: 'Energy saving materials, sanitary products', isCompound: false, validFrom: '1997-09-01' },
  { id: 'gb_vat_20', code: 'GB_VAT_20', name: 'VAT 20% (Standard)', rate: 20, type: 'VAT', countryCode: 'GB', category: 'standard', isCompound: false, validFrom: '2011-01-04' },

  // GERMANY VAT
  { id: 'de_vat_0', code: 'DE_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'DE', category: 'zero', isCompound: false, validFrom: '1968-01-01' },
  { id: 'de_vat_7', code: 'DE_VAT_7', name: 'VAT 7% (Reduced)', rate: 7, type: 'VAT', countryCode: 'DE', category: 'reduced', description: 'Food, books, cultural', isCompound: false, validFrom: '1983-07-01' },
  { id: 'de_vat_19', code: 'DE_VAT_19', name: 'VAT 19% (Standard)', rate: 19, type: 'VAT', countryCode: 'DE', category: 'standard', isCompound: false, validFrom: '2007-01-01' },

  // FRANCE TVA
  { id: 'fr_vat_0', code: 'FR_VAT_0', name: 'TVA 0%', rate: 0, type: 'VAT', countryCode: 'FR', category: 'zero', isCompound: false, validFrom: '1968-01-01' },
  { id: 'fr_vat_2_1', code: 'FR_VAT_2_1', name: 'TVA 2.1% (Super Reduced)', rate: 2.1, type: 'VAT', countryCode: 'FR', category: 'super_reduced', description: 'Medicines, press', isCompound: false, validFrom: '2012-01-01' },
  { id: 'fr_vat_5_5', code: 'FR_VAT_5_5', name: 'TVA 5.5% (Reduced)', rate: 5.5, type: 'VAT', countryCode: 'FR', category: 'reduced', description: 'Food, books, transport', isCompound: false, validFrom: '1982-07-01' },
  { id: 'fr_vat_10', code: 'FR_VAT_10', name: 'TVA 10% (Intermediate)', rate: 10, type: 'VAT', countryCode: 'FR', category: 'reduced', description: 'Restaurants, housing work', isCompound: false, validFrom: '2014-01-01' },
  { id: 'fr_vat_20', code: 'FR_VAT_20', name: 'TVA 20% (Standard)', rate: 20, type: 'VAT', countryCode: 'FR', category: 'standard', isCompound: false, validFrom: '2014-01-01' },

  // ITALY IVA
  { id: 'it_vat_0', code: 'IT_VAT_0', name: 'IVA 0%', rate: 0, type: 'VAT', countryCode: 'IT', category: 'zero', isCompound: false, validFrom: '1973-01-01' },
  { id: 'it_vat_4', code: 'IT_VAT_4', name: 'IVA 4% (Super Reduced)', rate: 4, type: 'VAT', countryCode: 'IT', category: 'super_reduced', description: 'Essential food', isCompound: false, validFrom: '1973-01-01' },
  { id: 'it_vat_5', code: 'IT_VAT_5', name: 'IVA 5% (Reduced)', rate: 5, type: 'VAT', countryCode: 'IT', category: 'reduced', description: 'Certain services', isCompound: false, validFrom: '2016-01-01' },
  { id: 'it_vat_10', code: 'IT_VAT_10', name: 'IVA 10% (Reduced)', rate: 10, type: 'VAT', countryCode: 'IT', category: 'reduced', description: 'Food, construction', isCompound: false, validFrom: '1973-01-01' },
  { id: 'it_vat_22', code: 'IT_VAT_22', name: 'IVA 22% (Standard)', rate: 22, type: 'VAT', countryCode: 'IT', category: 'standard', isCompound: false, validFrom: '2013-10-01' },

  // SPAIN IVA
  { id: 'es_vat_0', code: 'ES_VAT_0', name: 'IVA 0%', rate: 0, type: 'VAT', countryCode: 'ES', category: 'zero', isCompound: false, validFrom: '1986-01-01' },
  { id: 'es_vat_4', code: 'ES_VAT_4', name: 'IVA 4% (Super Reduced)', rate: 4, type: 'VAT', countryCode: 'ES', category: 'super_reduced', description: 'Essential goods', isCompound: false, validFrom: '1993-01-01' },
  { id: 'es_vat_10', code: 'ES_VAT_10', name: 'IVA 10% (Reduced)', rate: 10, type: 'VAT', countryCode: 'ES', category: 'reduced', description: 'Food, housing', isCompound: false, validFrom: '1993-01-01' },
  { id: 'es_vat_21', code: 'ES_VAT_21', name: 'IVA 21% (Standard)', rate: 21, type: 'VAT', countryCode: 'ES', category: 'standard', isCompound: false, validFrom: '2012-09-01' },

  // NETHERLANDS BTW
  { id: 'nl_vat_0', code: 'NL_VAT_0', name: 'BTW 0%', rate: 0, type: 'VAT', countryCode: 'NL', category: 'zero', isCompound: false, validFrom: '1969-01-01' },
  { id: 'nl_vat_9', code: 'NL_VAT_9', name: 'BTW 9% (Reduced)', rate: 9, type: 'VAT', countryCode: 'NL', category: 'reduced', description: 'Food, books, medicine', isCompound: false, validFrom: '2019-01-01' },
  { id: 'nl_vat_21', code: 'NL_VAT_21', name: 'BTW 21% (Standard)', rate: 21, type: 'VAT', countryCode: 'NL', category: 'standard', isCompound: false, validFrom: '2012-10-01' },

  // SWITZERLAND VAT
  { id: 'ch_vat_0', code: 'CH_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'CH', category: 'zero', isCompound: false, validFrom: '2018-01-01' },
  { id: 'ch_vat_2_6', code: 'CH_VAT_2_6', name: 'VAT 2.6% (Reduced)', rate: 2.6, type: 'VAT', countryCode: 'CH', category: 'reduced', description: 'Daily necessities', isCompound: false, validFrom: '2024-01-01' },
  { id: 'ch_vat_3_8', code: 'CH_VAT_3_8', name: 'VAT 3.8% (Special)', rate: 3.8, type: 'VAT', countryCode: 'CH', category: 'special', description: 'Accommodation', isCompound: false, validFrom: '2024-01-01' },
  { id: 'ch_vat_8_1', code: 'CH_VAT_8_1', name: 'VAT 8.1% (Standard)', rate: 8.1, type: 'VAT', countryCode: 'CH', category: 'standard', isCompound: false, validFrom: '2024-01-01' },

  // NORWAY VAT
  { id: 'no_vat_0', code: 'NO_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'NO', category: 'zero', isCompound: false, validFrom: '1970-01-01' },
  { id: 'no_vat_12', code: 'NO_VAT_12', name: 'VAT 12% (Food)', rate: 12, type: 'VAT', countryCode: 'NO', category: 'reduced', description: 'Foodstuffs', isCompound: false, validFrom: '2001-01-01' },
  { id: 'no_vat_15', code: 'NO_VAT_15', name: 'VAT 15% (Reduced)', rate: 15, type: 'VAT', countryCode: 'NO', category: 'reduced', description: 'Services, transport', isCompound: false, validFrom: '2023-01-01' },
  { id: 'no_vat_25', code: 'NO_VAT_25', name: 'VAT 25% (Standard)', rate: 25, type: 'VAT', countryCode: 'NO', category: 'standard', isCompound: false, validFrom: '1970-01-01' },

  // SWEDEN VAT
  { id: 'se_vat_0', code: 'SE_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'SE', category: 'zero', isCompound: false, validFrom: '1969-01-01' },
  { id: 'se_vat_6', code: 'SE_VAT_6', name: 'VAT 6% (Reduced)', rate: 6, type: 'VAT', countryCode: 'SE', category: 'reduced', description: 'Books, cultural', isCompound: false, validFrom: '1996-01-01' },
  { id: 'se_vat_12', code: 'SE_VAT_12', name: 'VAT 12% (Reduced)', rate: 12, type: 'VAT', countryCode: 'SE', category: 'reduced', description: 'Food, hotels', isCompound: false, validFrom: '1993-01-01' },
  { id: 'se_vat_25', code: 'SE_VAT_25', name: 'VAT 25% (Standard)', rate: 25, type: 'VAT', countryCode: 'SE', category: 'standard', isCompound: false, validFrom: '1990-07-01' },

  // DENMARK VAT
  { id: 'dk_vat_0', code: 'DK_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'DK', category: 'zero', isCompound: false, validFrom: '1967-01-01' },
  { id: 'dk_vat_25', code: 'DK_VAT_25', name: 'VAT 25% (Standard)', rate: 25, type: 'VAT', countryCode: 'DK', category: 'standard', isCompound: false, validFrom: '1992-01-01' },

  // POLAND VAT
  { id: 'pl_vat_0', code: 'PL_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'PL', category: 'zero', isCompound: false, validFrom: '1993-01-01' },
  { id: 'pl_vat_5', code: 'PL_VAT_5', name: 'VAT 5% (Reduced)', rate: 5, type: 'VAT', countryCode: 'PL', category: 'reduced', description: 'Basic food', isCompound: false, validFrom: '2011-01-01' },
  { id: 'pl_vat_8', code: 'PL_VAT_8', name: 'VAT 8% (Reduced)', rate: 8, type: 'VAT', countryCode: 'PL', category: 'reduced', description: 'Food, transport', isCompound: false, validFrom: '2011-01-01' },
  { id: 'pl_vat_23', code: 'PL_VAT_23', name: 'VAT 23% (Standard)', rate: 23, type: 'VAT', countryCode: 'PL', category: 'standard', isCompound: false, validFrom: '2011-01-01' },

  // Add more countries as needed...

  // US Sales Tax (Federal - n/a, states vary)
  { id: 'us_sales_tax_0', code: 'US_ST_0', name: 'No Sales Tax', rate: 0, type: 'SALES_TAX', countryCode: 'US', category: 'zero', description: 'States without sales tax', isCompound: false, validFrom: '1900-01-01' },
  { id: 'us_ca_sales_tax', code: 'US_CA_ST', name: 'CA Sales Tax 7.25%', rate: 7.25, type: 'SALES_TAX', countryCode: 'US', region: 'CA', category: 'standard', description: 'California base rate', isCompound: false, validFrom: '1900-01-01' },
  { id: 'us_ny_sales_tax', code: 'US_NY_ST', name: 'NY Sales Tax 8%', rate: 8, type: 'SALES_TAX', countryCode: 'US', region: 'NY', category: 'standard', description: 'New York base rate', isCompound: false, validFrom: '1900-01-01' },
  { id: 'us_tx_sales_tax', code: 'US_TX_ST', name: 'TX Sales Tax 6.25%', rate: 6.25, type: 'SALES_TAX', countryCode: 'US', region: 'TX', category: 'standard', description: 'Texas base rate', isCompound: false, validFrom: '1900-01-01' },
  { id: 'us_fl_sales_tax', code: 'US_FL_ST', name: 'FL Sales Tax 6%', rate: 6, type: 'SALES_TAX', countryCode: 'US', region: 'FL', category: 'standard', description: 'Florida base rate', isCompound: false, validFrom: '1900-01-01' },
  { id: 'us_il_sales_tax', code: 'US_IL_ST', name: 'IL Sales Tax 6.25%', rate: 6.25, type: 'SALES_TAX', countryCode: 'US', region: 'IL', category: 'standard', description: 'Illinois base rate', isCompound: false, validFrom: '1900-01-01' },

  // CANADA GST/HST/PST
  { id: 'ca_gst_0', code: 'CA_GST_0', name: 'GST 0%', rate: 0, type: 'GST', countryCode: 'CA', category: 'zero', isCompound: false, validFrom: '1991-01-01' },
  { id: 'ca_gst_5', code: 'CA_GST_5', name: 'GST 5%', rate: 5, type: 'GST', countryCode: 'CA', category: 'standard', description: 'Federal GST (Alberta, BC, MB, NT, NU, QC, SK, YT)', isCompound: false, validFrom: '2008-01-01' },
  { id: 'ca_hst_13', code: 'CA_HST_13', name: 'HST 13%', rate: 13, type: 'HST', countryCode: 'CA', region: 'ON', category: 'standard', description: 'Ontario HST', isCompound: true, validFrom: '2010-07-01' },
  { id: 'ca_hst_15', code: 'CA_HST_15', name: 'HST 15%', rate: 15, type: 'HST', countryCode: 'CA', region: 'NS', category: 'standard', description: 'Atlantic HST (NS, NB, NL, PE)', isCompound: true, validFrom: '2016-07-01' },
  { id: 'ca_bc_pst_7', code: 'CA_BC_PST_7', name: 'BC PST 7%', rate: 7, type: 'PST', countryCode: 'CA', region: 'BC', category: 'standard', description: 'British Columbia PST', isCompound: false, validFrom: '2013-04-01' },
  { id: 'ca_mb_pst_7', code: 'CA_MB_PST_7', name: 'MB PST 7%', rate: 7, type: 'PST', countryCode: 'CA', region: 'MB', category: 'standard', description: 'Manitoba RST', isCompound: false, validFrom: '2008-01-01' },
  { id: 'ca_sk_pst_6', code: 'CA_SK_PST_6', name: 'SK PST 6%', rate: 6, type: 'PST', countryCode: 'CA', region: 'SK', category: 'standard', description: 'Saskatchewan PST', isCompound: false, validFrom: '2017-03-23' },
  { id: 'ca_qc_qst_9975', code: 'CA_QC_QST_9975', name: 'QST 9.975%', rate: 9.975, type: 'QST', countryCode: 'CA', region: 'QC', category: 'standard', description: 'Quebec QST', isCompound: false, validFrom: '2011-01-01' },

  // MEXICO IVA
  { id: 'mx_iva_0', code: 'MX_IVA_0', name: 'IVA 0%', rate: 0, type: 'IVA', countryCode: 'MX', category: 'zero', isCompound: false, validFrom: '1980-01-01' },
  { id: 'mx_iva_16', code: 'MX_IVA_16', name: 'IVA 16%', rate: 16, type: 'IVA', countryCode: 'MX', category: 'standard', isCompound: false, validFrom: '2014-01-01' },
  { id: 'mx_iva_8', code: 'MX_IVA_8', name: 'IVA 8% (Border)', rate: 8, type: 'IVA', countryCode: 'MX', category: 'reduced', description: 'Border zone rate', isCompound: false, validFrom: '2019-01-01' },

  // BRAZIL ICMS (Simplified - varies by state)
  { id: 'br_icms_0', code: 'BR_ICMS_0', name: 'ICMS 0%', rate: 0, type: 'ICMS', countryCode: 'BR', category: 'zero', isCompound: false, validFrom: '1967-01-01' },
  { id: 'br_icms_7', code: 'BR_ICMS_7', name: 'ICMS 7% (North)', rate: 7, type: 'ICMS', countryCode: 'BR', category: 'reduced', description: 'Northern states', isCompound: false, validFrom: '1967-01-01' },
  { id: 'br_icms_12', code: 'BR_ICMS_12', name: 'ICMS 12% (Basic)', rate: 12, type: 'ICMS', countryCode: 'BR', category: 'reduced', description: 'Basic necessities', isCompound: false, validFrom: '1967-01-01' },
  { id: 'br_icms_18', code: 'BR_ICMS_18', name: 'ICMS 18% (Standard)', rate: 18, type: 'ICMS', countryCode: 'BR', category: 'standard', description: 'Most states standard', isCompound: false, validFrom: '1967-01-01' },
  { id: 'br_iss_5', code: 'BR_ISS_5', name: 'ISS 5%', rate: 5, type: 'ISS', countryCode: 'BR', category: 'standard', description: 'Services tax', isCompound: false, validFrom: '2007-01-01' },
  { id: 'br_pis_165', code: 'BR_PIS_1_65', name: 'PIS 1.65%', rate: 1.65, type: 'PIS', countryCode: 'BR', category: 'standard', description: 'PIS contribution', isCompound: false, validFrom: '2007-01-01' },
  { id: 'br_cofins_76', code: 'BR_COFINS_7_6', name: 'COFINS 7.6%', rate: 7.6, type: 'COFINS', countryCode: 'BR', category: 'standard', description: 'COFINS contribution', isCompound: false, validFrom: '2007-01-01' },

  // UAE VAT
  { id: 'ae_vat_0', code: 'AE_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'AE', category: 'zero', description: 'Zero-rated supplies', isCompound: false, validFrom: '2018-01-01' },
  { id: 'ae_vat_5', code: 'AE_VAT_5', name: 'VAT 5%', rate: 5, type: 'VAT', countryCode: 'AE', category: 'standard', isCompound: false, validFrom: '2018-01-01' },

  // SAUDI ARABIA VAT
  { id: 'sa_vat_0', code: 'SA_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'SA', category: 'zero', isCompound: false, validFrom: '2018-01-01' },
  { id: 'sa_vat_15', code: 'SA_VAT_15', name: 'VAT 15%', rate: 15, type: 'VAT', countryCode: 'SA', category: 'standard', isCompound: false, validFrom: '2020-07-01' },

  // BAHRAIN VAT
  { id: 'bh_vat_0', code: 'BH_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'BH', category: 'zero', isCompound: false, validFrom: '2022-01-01' },
  { id: 'bh_vat_10', code: 'BH_VAT_10', name: 'VAT 10%', rate: 10, type: 'VAT', countryCode: 'BH', category: 'standard', isCompound: false, validFrom: '2022-01-01' },

  // OMAN VAT
  { id: 'om_vat_0', code: 'OM_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'OM', category: 'zero', isCompound: false, validFrom: '2021-04-01' },
  { id: 'om_vat_5', code: 'OM_VAT_5', name: 'VAT 5%', rate: 5, type: 'VAT', countryCode: 'OM', category: 'standard', isCompound: false, validFrom: '2021-04-01' },

  // SOUTH AFRICA VAT
  { id: 'za_vat_0', code: 'ZA_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'ZA', category: 'zero', isCompound: false, validFrom: '1991-09-30' },
  { id: 'za_vat_15', code: 'ZA_VAT_15', name: 'VAT 15%', rate: 15, type: 'VAT', countryCode: 'ZA', category: 'standard', isCompound: false, validFrom: '2018-04-01' },

  // EGYPT VAT
  { id: 'eg_vat_0', code: 'EG_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'EG', category: 'zero', isCompound: false, validFrom: '2016-09-08' },
  { id: 'eg_vat_14', code: 'EG_VAT_14', name: 'VAT 14%', rate: 14, type: 'VAT', countryCode: 'EG', category: 'standard', isCompound: false, validFrom: '2016-09-08' },

  // NIGERIA VAT
  { id: 'ng_vat_0', code: 'NG_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'NG', category: 'zero', isCompound: false, validFrom: '1996-12-01' },
  { id: 'ng_vat_75', code: 'NG_VAT_7_5', name: 'VAT 7.5%', rate: 7.5, type: 'VAT', countryCode: 'NG', category: 'standard', isCompound: false, validFrom: '2020-02-01' },

  // KENYA VAT
  { id: 'ke_vat_0', code: 'KE_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'KE', category: 'zero', isCompound: false, validFrom: '1990-01-01' },
  { id: 'ke_vat_16', code: 'KE_VAT_16', name: 'VAT 16%', rate: 16, type: 'VAT', countryCode: 'KE', category: 'standard', isCompound: false, validFrom: '2020-07-01' },

  // GHANA VAT
  { id: 'gh_vat_0', code: 'GH_VAT_0', name: 'VAT 0%', rate: 0, type: 'VAT', countryCode: 'GH', category: 'zero', isCompound: false, validFrom: '1998-03-01' },
  { id: 'gh_vat_15', code: 'GH_VAT_15', name: 'VAT 15%', rate: 15, type: 'VAT', countryCode: 'GH', category: 'standard', isCompound: false, validFrom: '2023-01-01' },
  { id: 'gh_nhil_25', code: 'GH_NHIL_2_5', name: 'NHIL 2.5%', rate: 2.5, type: 'VAT', countryCode: 'GH', category: 'special', description: 'National Health Insurance Levy', isCompound: true, validFrom: '2018-08-01' },
  { id: 'gh_getfl_25', code: 'GH_GETFL_2_5', name: 'GETFund 2.5%', rate: 2.5, type: 'VAT', countryCode: 'GH', category: 'special', description: 'Ghana Education Trust Fund', isCompound: true, validFrom: '2018-08-01' },

  // AUSTRALIA GST
  { id: 'au_gst_0', code: 'AU_GST_0', name: 'GST Free', rate: 0, type: 'GST', countryCode: 'AU', category: 'zero', isCompound: false, validFrom: '2000-07-01' },
  { id: 'au_gst_10', code: 'AU_GST_10', name: 'GST 10%', rate: 10, type: 'GST', countryCode: 'AU', category: 'standard', isCompound: false, validFrom: '2000-07-01' },
];

// ============================================
// TAX CALCULATION FUNCTIONS
// ============================================

/**
 * Get tax rates for a specific country
 */
export function getTaxRatesForCountry(countryCode: string, region?: string): TaxRateDefinition[] {
  let rates = GLOBAL_TAX_RATES.filter(rate => rate.countryCode === countryCode);

  // If region is specified, filter or prioritize regional rates
  if (region) {
    const regionalRates = rates.filter(rate => rate.region === region);
    if (regionalRates.length > 0) {
      return regionalRates;
    }
  }

  // Return country-wide rates (no specific region)
  return rates.filter(rate => !rate.region);
}

/**
 * Get the default/standard tax rate for a country
 */
export function getDefaultTaxRate(countryCode: string): TaxRateDefinition | null {
  const rates = getTaxRatesForCountry(countryCode);
  return rates.find(rate => rate.category === 'standard') || rates[0] || null;
}

/**
 * Get country tax configuration
 */
export function getCountryTaxConfig(countryCode: string): CountryTaxConfig | null {
  return COUNTRY_TAX_CONFIGS[countryCode] || null;
}

/**
 * Calculate tax for a single amount with specific rate
 */
export function calculateTaxAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 10000; // Round to 2 decimal places
}

/**
 * Main tax calculation function
 */
export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  const { amount, countryCode, region, isB2B, isTaxExempt, lineItems } = input;
  const countryConfig = getCountryTaxConfig(countryCode);

  // Handle B2B reverse charge for EU/international transactions
  const isReverseCharge = countryConfig?.hasReverseCharge && isB2B && !!input.customerTaxId;

  // If tax exempt or reverse charge, return zero tax
  if (isTaxExempt || isReverseCharge) {
    return {
      subtotal: amount,
      totalTax: 0,
      totalAmount: amount,
      currency: countryConfig?.currency,
      countryCode,
      isReverseCharge: isReverseCharge || false,
      breakdown: [],
      lineItems: lineItems?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount || item.quantity * item.unitPrice,
        taxAmount: 0,
        totalAmount: item.amount || item.quantity * item.unitPrice,
        taxBreakdown: [],
      })) || [],
    };
  }

  // Calculate for line items if provided
  if (lineItems && lineItems.length > 0) {
    return calculateTaxWithLineItems(input, countryConfig);
  }

  // Simple calculation for total amount
  const rates = getTaxRatesForCountry(countryCode, region);
  const standardRate = rates.find(r => r.category === 'standard') || rates[0];

  if (!standardRate) {
    return {
      subtotal: amount,
      totalTax: 0,
      totalAmount: amount,
      currency: countryConfig?.currency,
      countryCode,
      isReverseCharge: false,
      breakdown: [],
      lineItems: [],
    };
  }

  // Handle India GST split (CGST/SGST for intra-state, IGST for inter-state)
  if (countryCode === 'IN') {
    return calculateIndiaGST(amount, region, rates, isB2B);
  }

  // Handle Canada combined taxes
  if (countryCode === 'CA' && region) {
    return calculateCanadaTax(amount, region, rates);
  }

  // Handle Brazil complex taxes
  if (countryCode === 'BR') {
    return calculateBrazilTaxes(amount, rates);
  }

  // Standard VAT/GST calculation
  const taxAmount = calculateTaxAmount(amount, standardRate.rate);

  return {
    subtotal: amount,
    totalTax: taxAmount,
    totalAmount: amount + taxAmount,
    currency: countryConfig?.currency,
    countryCode,
    isReverseCharge: false,
    breakdown: [{
      taxType: standardRate.type,
      rate: standardRate.rate,
      taxableAmount: amount,
      taxAmount,
      name: standardRate.name,
      code: standardRate.code,
      region,
    }],
    lineItems: [],
  };
}

/**
 * Calculate tax with line items
 */
function calculateTaxWithLineItems(
  input: TaxCalculationInput,
  countryConfig: CountryTaxConfig | null
): TaxCalculationResult {
  const { countryCode, region, lineItems = [] } = input;

  let totalSubtotal = 0;
  let totalTax = 0;
  const lineItemResults: LineItemResult[] = [];
  const taxBreakdownMap = new Map<string, TaxBreakdownItem>();

  for (const item of lineItems) {
    const itemAmount = item.amount || item.quantity * item.unitPrice;
    totalSubtotal += itemAmount;

    let itemTax = 0;
    const itemTaxBreakdown: TaxBreakdownItem[] = [];

    // Get applicable tax rate
    let applicableRate: TaxRateDefinition | undefined;

    if (item.taxRateCode) {
      applicableRate = GLOBAL_TAX_RATES.find(r => r.code === item.taxRateCode);
    } else {
      const rates = getTaxRatesForCountry(countryCode, region);
      applicableRate = rates.find(r => r.category === 'standard') || rates[0];
    }

    if (applicableRate && !item.isTaxExempt) {
      itemTax = calculateTaxAmount(itemAmount, applicableRate.rate);

      const breakdownItem: TaxBreakdownItem = {
        taxType: applicableRate.type,
        rate: applicableRate.rate,
        taxableAmount: itemAmount,
        taxAmount: itemTax,
        name: applicableRate.name,
        code: applicableRate.code,
        region: applicableRate.region || region,
      };

      itemTaxBreakdown.push(breakdownItem);

      // Aggregate for total breakdown
      const key = `${applicableRate.type}_${applicableRate.code}`;
      const existing = taxBreakdownMap.get(key);
      if (existing) {
        existing.taxableAmount += itemAmount;
        existing.taxAmount += itemTax;
      } else {
        taxBreakdownMap.set(key, { ...breakdownItem });
      }
    }

    totalTax += itemTax;

    lineItemResults.push({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: itemAmount,
      taxAmount: itemTax,
      totalAmount: itemAmount + itemTax,
      taxBreakdown: itemTaxBreakdown,
    });
  }

  return {
    subtotal: totalSubtotal,
    totalTax,
    totalAmount: totalSubtotal + totalTax,
    currency: countryConfig?.currency,
    countryCode,
    isReverseCharge: false,
    breakdown: Array.from(taxBreakdownMap.values()),
    lineItems: lineItemResults,
  };
}

/**
 * Calculate India GST with CGST/SGST/IGST split
 */
function calculateIndiaGST(
  amount: number,
  region: string | undefined,
  rates: TaxRateDefinition[],
  isInterState: boolean
): TaxCalculationResult {
  const standardRate = rates.find(r => r.category === 'standard');
  const rate = standardRate?.rate || 18;

  if (isInterState) {
    // IGST for inter-state
    const igstRate = rates.find(r => r.type === 'IGST');
    const igstAmount = calculateTaxAmount(amount, igstRate?.rate || rate);

    return {
      subtotal: amount,
      totalTax: igstAmount,
      totalAmount: amount + igstAmount,
      currency: 'INR',
      countryCode: 'IN',
      isReverseCharge: false,
      breakdown: [{
        taxType: 'IGST',
        rate: igstRate?.rate || rate,
        taxableAmount: amount,
        taxAmount: igstAmount,
        name: 'IGST',
        code: igstRate?.code || 'IN_IGST',
        region,
      }],
      lineItems: [],
    };
  } else {
    // CGST + SGST for intra-state
    const halfRate = rate / 2;
    const cgstAmount = calculateTaxAmount(amount, halfRate);
    const sgstAmount = calculateTaxAmount(amount, halfRate);

    return {
      subtotal: amount,
      totalTax: cgstAmount + sgstAmount,
      totalAmount: amount + cgstAmount + sgstAmount,
      currency: 'INR',
      countryCode: 'IN',
      isReverseCharge: false,
      breakdown: [
        {
          taxType: 'CGST',
          rate: halfRate,
          taxableAmount: amount,
          taxAmount: cgstAmount,
          name: 'CGST',
          code: 'IN_CGST',
          region,
        },
        {
          taxType: 'SGST',
          rate: halfRate,
          taxableAmount: amount,
          taxAmount: sgstAmount,
          name: 'SGST',
          code: 'IN_SGST',
          region,
        },
      ],
      lineItems: [],
    };
  }
}

/**
 * Calculate Canada combined GST/HST/PST
 */
function calculateCanadaTax(
  amount: number,
  region: string,
  rates: TaxRateDefinition[]
): TaxCalculationResult {
  const breakdown: TaxBreakdownItem[] = [];
  let totalTax = 0;

  // Federal GST (5%) unless HST applies
  const hstRate = rates.find(r => r.type === 'HST' && r.region === region);

  if (hstRate) {
    // HST combines federal and provincial
    const taxAmount = calculateTaxAmount(amount, hstRate.rate);
    totalTax += taxAmount;
    breakdown.push({
      taxType: 'HST',
      rate: hstRate.rate,
      taxableAmount: amount,
      taxAmount,
      name: hstRate.name,
      code: hstRate.code,
      region,
    });
  } else {
    // Federal GST 5%
    const gstRate = rates.find(r => r.type === 'GST');
    if (gstRate) {
      const gstAmount = calculateTaxAmount(amount, gstRate.rate);
      totalTax += gstAmount;
      breakdown.push({
        taxType: 'GST',
        rate: gstRate.rate,
        taxableAmount: amount,
        taxAmount: gstAmount,
        name: gstRate.name,
        code: gstRate.code,
        region,
      });
    }

    // Provincial tax (PST/QST)
    const pstRate = rates.find(r => (r.type === 'PST' || r.type === 'QST') && r.region === region);
    if (pstRate) {
      const pstAmount = calculateTaxAmount(amount, pstRate.rate);
      totalTax += pstAmount;
      breakdown.push({
        taxType: pstRate.type,
        rate: pstRate.rate,
        taxableAmount: amount,
        taxAmount: pstAmount,
        name: pstRate.name,
        code: pstRate.code,
        region,
      });
    }
  }

  return {
    subtotal: amount,
    totalTax,
    totalAmount: amount + totalTax,
    currency: 'CAD',
    countryCode: 'CA',
    isReverseCharge: false,
    breakdown,
    lineItems: [],
  };
}

/**
 * Calculate Brazil complex tax structure
 */
function calculateBrazilTaxes(
  amount: number,
  rates: TaxRateDefinition[]
): TaxCalculationResult {
  const breakdown: TaxBreakdownItem[] = [];
  let totalTax = 0;

  // ICMS (state tax on goods)
  const icmsRate = rates.find(r => r.type === 'ICMS');
  if (icmsRate) {
    const taxAmount = calculateTaxAmount(amount, icmsRate.rate);
    totalTax += taxAmount;
    breakdown.push({
      taxType: 'ICMS',
      rate: icmsRate.rate,
      taxableAmount: amount,
      taxAmount,
      name: icmsRate.name,
      code: icmsRate.code,
    });
  }

  // ISS (municipal tax on services)
  const issRate = rates.find(r => r.type === 'ISS');
  if (issRate) {
    const taxAmount = calculateTaxAmount(amount, issRate.rate);
    totalTax += taxAmount;
    breakdown.push({
      taxType: 'ISS',
      rate: issRate.rate,
      taxableAmount: amount,
      taxAmount,
      name: issRate.name,
      code: issRate.code,
    });
  }

  // PIS/COFINS (federal contributions)
  const pisRate = rates.find(r => r.type === 'PIS');
  const cofinsRate = rates.find(r => r.type === 'COFINS');

  if (pisRate) {
    const taxAmount = calculateTaxAmount(amount, pisRate.rate);
    totalTax += taxAmount;
    breakdown.push({
      taxType: 'PIS',
      rate: pisRate.rate,
      taxableAmount: amount,
      taxAmount,
      name: pisRate.name,
      code: pisRate.code,
    });
  }

  if (cofinsRate) {
    const taxAmount = calculateTaxAmount(amount, cofinsRate.rate);
    totalTax += taxAmount;
    breakdown.push({
      taxType: 'COFINS',
      rate: cofinsRate.rate,
      taxableAmount: amount,
      taxAmount,
      name: cofinsRate.name,
      code: cofinsRate.code,
    });
  }

  return {
    subtotal: amount,
    totalTax,
    totalAmount: amount + totalTax,
    currency: 'BRL',
    countryCode: 'BR',
    isReverseCharge: false,
    breakdown,
    lineItems: [],
  };
}

/**
 * Get all available countries with tax support
 */
export function getSupportedCountries(): { code: string; name: string; currency: string }[] {
  return Object.values(COUNTRY_TAX_CONFIGS).map(config => ({
    code: config.countryCode,
    name: config.countryName,
    currency: config.currency,
  }));
}

/**
 * Validate a tax ID format for a specific country
 */
export function validateTaxId(taxId: string, countryCode: string): boolean {
  const patterns: Record<string, RegExp> = {
    // India GSTIN: 15 characters, state code + PAN + entity + checksum
    IN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    // UK VAT: 9 or 12 digits, may start with GB
    GB: /^(GB)?([0-9]{9}|[0-9]{12})$/,
    // EU VAT: Country code + 8-12 digits
    EU: /^[A-Z]{2}[0-9A-Z]{8,12}$/,
    // Australia ABN: 11 digits
    AU: /^[0-9]{11}$/,
    // Singapore GST: 10 digits (UEN format)
    SG: /^[0-9]{8}[A-Z]$/,
    // Canada BN: 9 digits
    CA: /^[0-9]{9}$/,
    // UAE TRN: 15 digits
    AE: /^[0-9]{15}$/,
    // Saudi Arabia VAT: 15 digits
    SA: /^3[0-9]{14}$/,
    // US EIN: 9 digits (XX-XXXXXXX)
    US: /^[0-9]{2}-?[0-9]{7}$/,
  };

  const pattern = patterns[countryCode];
  if (!pattern) return true; // No validation available

  return pattern.test(taxId.replace(/\s/g, '').toUpperCase());
}

/**
 * Format tax ID for display
 */
export function formatTaxId(taxId: string, countryCode: string): string {
  const cleanId = taxId.replace(/\s/g, '').toUpperCase();

  switch (countryCode) {
    case 'IN': // GSTIN: 29ABCDE1234F1Z5 -> 29ABCDE1234F1Z5
      return cleanId;
    case 'GB': // VAT: GB123456789 -> GB 123 4567 89
      if (cleanId.startsWith('GB')) {
        const num = cleanId.slice(2);
        return `GB ${num.slice(0, 3)} ${num.slice(3, 7)} ${num.slice(7)}`;
      }
      return cleanId;
    case 'US': // EIN: 123456789 -> 12-3456789
      if (cleanId.length === 9) {
        return `${cleanId.slice(0, 2)}-${cleanId.slice(2)}`;
      }
      return cleanId;
    default:
      return cleanId;
  }
}

/**
 * Seed initial tax rates to database format
 */
export function getTaxRatesForSeeding() {
  return GLOBAL_TAX_RATES.map(rate => ({
    id: rate.id,
    code: rate.code,
    name: rate.name,
    rate: rate.rate,
    type: rate.type,
    country_code: rate.countryCode,
    region: rate.region || null,
    category: rate.category,
    description: rate.description || null,
    is_compound: rate.isCompound,
    is_active: true,
    valid_from: new Date(rate.validFrom),
    valid_until: rate.validUntil ? new Date(rate.validUntil) : null,
  }));
}
