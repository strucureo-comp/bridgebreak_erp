'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { TenantSetupStatus, ModuleKey, ModuleAccess } from '@/lib/module-gate';
import { checkModuleAccess, getNextSetupStep } from '@/lib/module-gate';

interface TenantContextValue {
    tenantStatus: TenantSetupStatus | null;
    loading: boolean;
    checkAccess: (module: ModuleKey) => ModuleAccess;
    setupProgress: ReturnType<typeof getNextSetupStep>;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenantStatus, setTenantStatus] = useState<TenantSetupStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTenant = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/tenant/status');
            if (res.ok) {
                const data = await res.json();
                setTenantStatus(data);
            } else {
                // No tenant exists yet - first time setup
                setTenantStatus(null);
            }
        } catch (err) {
            console.error('Failed to fetch tenant status:', err);
            // Fallback: treat as fully set up for development
            setTenantStatus({
                setup_stage: 'completed',
                company_setup_complete: true,
                finance_setup_complete: true,
                roles_setup_complete: true,
                module_finance: true,
                module_sales: true,
                module_operations: true,
                module_hr: true,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTenant();
    }, [fetchTenant]);

    const checkAccess = useCallback((module: ModuleKey): ModuleAccess => {
        return checkModuleAccess(module, tenantStatus);
    }, [tenantStatus]);

    const setupProgress = getNextSetupStep(tenantStatus);

    return (
        <TenantContext.Provider value={{ tenantStatus, loading, checkAccess, setupProgress, refreshTenant: fetchTenant }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const ctx = useContext(TenantContext);
    if (!ctx) {
        // Return a permissive fallback if not wrapped in TenantProvider
        return {
            tenantStatus: {
                setup_stage: 'completed' as const,
                company_setup_complete: true,
                finance_setup_complete: true,
                roles_setup_complete: true,
                module_finance: true,
                module_sales: true,
                module_operations: true,
                module_hr: true,
            },
            loading: false,
            checkAccess: () => ({ accessible: true } as ModuleAccess),
            setupProgress: getNextSetupStep(null),
            refreshTenant: async () => { },
        };
    }
    return ctx;
}
