// Settings helpers for PDF generation and live preview

export interface CompanySettings {
    companyName: string;
    businessType: string;
    companySize: string;
    country: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
    baseCurrency: string;
    fiscalYearStart: string;
    defaultTaxName: string;
    defaultTaxRate: number;
    // Additional fields for PDF
    trn?: string;
    poBox?: string;
    city?: string;
    state?: string;
    bankName?: string;
    bankAccount?: string;
    bankIban?: string;
    bankSwift?: string;
}

export interface BrandingSettings {
    logo: string | null;
    primaryColor: string;
    accentColor: string;
    footerText: string;
}

// Get company settings from localStorage
export function getCompanySettings(): CompanySettings {
    if (typeof window === 'undefined') {
        return getDefaultCompanySettings();
    }

    const saved = localStorage.getItem('company_settings');
    if (saved) {
        return JSON.parse(saved);
    }
    return getDefaultCompanySettings();
}

// Get branding settings from localStorage
export function getBrandingSettings(): BrandingSettings {
    if (typeof window === 'undefined') {
        return getDefaultBrandingSettings();
    }

    // Check both new and old keys
    let saved = localStorage.getItem('branding_settings');
    if (!saved) {
        saved = localStorage.getItem('branding_config');
    }

    if (saved) {
        return JSON.parse(saved);
    }
    return getDefaultBrandingSettings();
}

// Default company settings
function getDefaultCompanySettings(): CompanySettings {
    return {
        companyName: 'Your Company Name LLC',
        businessType: 'manufacturing',
        companySize: 'enterprise',
        country: 'UAE',
        address: 'P.O. Box, Street Address\nCity, State',
        phone: '+971 4 123 4567',
        email: 'info@company.com',
        website: 'www.company.com',
        taxId: '',
        baseCurrency: 'AED',
        fiscalYearStart: '1',
        defaultTaxName: 'VAT',
        defaultTaxRate: 5,
        trn: '',
        poBox: '',
        city: 'Dubai',
        state: 'Dubai',
        bankName: '',
        bankAccount: '',
        bankIban: '',
        bankSwift: '',
    };
}

// Default branding settings
function getDefaultBrandingSettings(): BrandingSettings {
    return {
        logo: null,
        primaryColor: '#0F172A',
        accentColor: '#10B981',
        footerText: 'Powered by BridgeBreak ERP',
    };
}

// Get primary color as RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Format currency with symbol
export function formatPdfCurrency(amount: number, currency: string = 'AED'): string {
    const formattedNumber = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const symbols: Record<string, string> = {
        'AED': 'AED ',
        'USD': '$',
        'EUR': 'EUR ',
        'GBP': 'GBP ',
        'INR': 'INR ',
    };

    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${formattedNumber}`;
}
