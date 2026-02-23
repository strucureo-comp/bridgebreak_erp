'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSystemSetting } from '@/lib/api';
import { formatCurrency, getCurrencySymbol, convertAmount, CURRENCY_NAMES } from '@/lib/currency';

interface UseCurrencyReturn {
    currencyCode: string;
    symbol: string;
    currencyName: string;
    format: (amount: number, options?: { compact?: boolean; showCode?: boolean }) => string;
    convert: (amount: number, fromCurrency: string) => number;
    loading: boolean;
}

let _cachedCurrency: string | null = null;
const _listeners: Array<(c: string) => void> = [];

// Global currency change broadcaster — so all components update together
export function broadcastCurrencyChange(code: string) {
    _cachedCurrency = code;
    _listeners.forEach(fn => fn(code));
}

export function useCurrency(): UseCurrencyReturn {
    const [currencyCode, setCurrencyCode] = useState<string>(_cachedCurrency ?? 'AED');
    const [loading, setLoading] = useState(!_cachedCurrency);

    useEffect(() => {
        // Subscribe to global currency changes
        const handler = (code: string) => setCurrencyCode(code);
        _listeners.push(handler);

        // Load from settings if not cached
        if (!_cachedCurrency) {
            getSystemSetting('org_config').then((cfg: any) => {
                const code = cfg?.baseCurrency ?? 'AED';
                _cachedCurrency = code;
                setCurrencyCode(code);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            setLoading(false);
        }

        return () => {
            const idx = _listeners.indexOf(handler);
            if (idx !== -1) _listeners.splice(idx, 1);
        };
    }, []);

    const format = useCallback(
        (amount: number, options?: { compact?: boolean; showCode?: boolean }) =>
            formatCurrency(amount, currencyCode, options),
        [currencyCode]
    );

    const convert = useCallback(
        (amount: number, fromCurrency: string) =>
            convertAmount(amount, fromCurrency, currencyCode),
        [currencyCode]
    );

    return {
        currencyCode,
        symbol: getCurrencySymbol(currencyCode),
        currencyName: CURRENCY_NAMES[currencyCode] ?? currencyCode,
        format,
        convert,
        loading,
    };
}
