/**
 * Global Currency Utility
 * Reads baseCurrency from org_config settings and provides formatting helpers.
 * Conversion: symbol changes with currency selection, amounts are converted using FX rates.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
    AED: 'د.إ', USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹',
    CNY: '¥', CHF: 'CHF', CAD: 'CA$', AUD: 'A$', SGD: 'S$', HKD: 'HK$',
    NZD: 'NZ$', SEK: 'kr', NOK: 'kr', DKK: 'kr', ZAR: 'R', BRL: 'R$',
    MXN: 'MX$', KWD: 'KD', SAR: '﷼', QAR: 'QR', BHD: 'BD', OMR: 'OMR',
    JOD: 'JD', EGP: 'E£', PKR: '₨', BDT: '৳', LKR: '₨', MYR: 'RM',
    THB: '฿', IDR: 'Rp', PHP: '₱', KRW: '₩', TRY: '₺', RUB: '₽',
    PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв',
};

export const CURRENCY_NAMES: Record<string, string> = {
    AED: 'UAE Dirham', USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
    JPY: 'Japanese Yen', INR: 'Indian Rupee', CNY: 'Chinese Yuan',
    CHF: 'Swiss Franc', CAD: 'Canadian Dollar', AUD: 'Australian Dollar',
    SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar', SAR: 'Saudi Riyal',
    KWD: 'Kuwaiti Dinar', QAR: 'Qatari Riyal', BHD: 'Bahraini Dinar',
    OMR: 'Omani Rial', ZAR: 'South African Rand', BRL: 'Brazilian Real',
    MXN: 'Mexican Peso', MYR: 'Malaysian Ringgit', THB: 'Thai Baht',
    IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso', KRW: 'South Korean Won',
    TRY: 'Turkish Lira', RUB: 'Russian Ruble',
};

// Approximate FX rates relative to USD (for mock conversion only)
// In production, fetch from a real FX API
export const MOCK_FX_RATES: Record<string, number> = {
    USD: 1, AED: 3.6725, EUR: 0.92, GBP: 0.79, JPY: 149.5, INR: 83.1,
    CNY: 7.24, CHF: 0.89, CAD: 1.36, AUD: 1.53, SGD: 1.34, HKD: 7.82,
    SAR: 3.75, KWD: 0.307, QAR: 3.64, BHD: 0.376, OMR: 0.385, ZAR: 18.6,
    BRL: 4.97, MXN: 17.2, MYR: 4.72, THB: 35.1, IDR: 15600, PHP: 56.4,
    KRW: 1325, TRY: 32.1, RUB: 91.3, NZD: 1.63, SEK: 10.4, NOK: 10.5,
    DKK: 6.87, PLN: 3.98,
};

/**
 * Convert amount from a source currency to a target currency using mock FX rates.
 * @note This is for display purposes. Use a real FX API for financial accuracy.
 */
export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = MOCK_FX_RATES[fromCurrency] ?? 1;
    const toRate = MOCK_FX_RATES[toCurrency] ?? 1;
    return (amount / fromRate) * toRate;
}

/**
 * Format a number as a currency string using the given currency code.
 */
export function formatCurrency(
    amount: number,
    currencyCode: string = 'AED',
    options: { showCode?: boolean; compact?: boolean } = {}
): string {
    const symbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
    const { showCode = false, compact = false } = options;

    let formatted: string;
    if (compact && Math.abs(amount) >= 1_000_000) {
        formatted = `${(amount / 1_000_000).toFixed(1)}M`;
    } else if (compact && Math.abs(amount) >= 1_000) {
        formatted = `${(amount / 1_000).toFixed(1)}K`;
    } else {
        formatted = amount.toLocaleString('en', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    return showCode
        ? `${symbol} ${formatted} ${currencyCode}`
        : `${symbol} ${formatted}`;
}

/**
 * Get just the symbol for a currency code.
 */
export function getCurrencySymbol(currencyCode: string): string {
    return CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
}
