/**
 * Module Dependency Gate
 * 
 * Implements the dependency chain:
 * Subscription → Company Setup → Finance Setup → Role Creation → Module Access
 * 
 * ❌ No Finance = No Posting
 * ❌ No Approval = No Final Entry
 * ❌ No Subscription = Nothing works
 */

export type SetupStage = 'subscription' | 'company_profile' | 'finance_setup' | 'roles_setup' | 'completed';

export type ModuleKey = 'dashboard' | 'company' | 'users_roles' | 'finance' | 'sales' | 'operations' | 'hr' | 'reports' | 'settings';

export interface TenantSetupStatus {
    setup_stage: SetupStage;
    business_type?: 'service' | 'trading' | 'manufacturing' | 'hybrid';
    company_setup_complete: boolean;
    finance_setup_complete: boolean;
    roles_setup_complete: boolean;
    module_finance: boolean;
    module_sales: boolean;
    module_operations: boolean;
    module_hr: boolean;
}

export interface ModuleAccess {
    accessible: boolean;
    reason?: string;
    required_stage?: SetupStage;
    redirect_to?: string;
}

/**
 * Module dependency rules:
 * 
 * 1. Dashboard     → Always accessible (shows setup progress if incomplete)
 * 2. Company       → Needs active subscription
 * 3. Users & Roles → Needs company setup complete
 * 4. Finance       → Needs company setup complete (Finance is CORE, always enabled)
 * 5. Sales         → Needs finance setup + subscription includes sales
 * 6. Operations    → Needs finance setup + subscription includes operations
 * 7. HR            → Needs finance setup + subscription includes HR
 * 8. Reports       → Needs finance setup
 * 9. Settings      → Always accessible for admins
 */
export function checkModuleAccess(
    module: ModuleKey,
    tenantStatus: TenantSetupStatus | null,
    userRole?: string // erp_role or fallback
): ModuleAccess {

    // No tenant = no access to anything except dashboard and settings
    if (!tenantStatus) {
        if (module === 'dashboard' || module === 'settings') {
            return { accessible: true };
        }
        return {
            accessible: false,
            reason: 'No active subscription. Please set up your organization first.',
            required_stage: 'subscription',
            redirect_to: '/admin/dashboard',
        };
    }

    const { setup_stage, company_setup_complete, finance_setup_complete, roles_setup_complete } = tenantStatus;

    switch (module) {
        case 'dashboard':
        case 'settings':
            // Always accessible
            return { accessible: true };

        case 'company':
            // Needs at least subscription stage
            return { accessible: true }; // Company page IS the setup page

        case 'users_roles':
            if (!company_setup_complete) {
                return {
                    accessible: false,
                    reason: 'Complete Company Setup first to manage users and roles.',
                    required_stage: 'company_profile',
                    redirect_to: '/admin/settings',
                };
            }
            return { accessible: true };

        case 'finance':
            if (!company_setup_complete) {
                return {
                    accessible: false,
                    reason: 'Complete Company Setup first to access Finance.',
                    required_stage: 'company_profile',
                    redirect_to: '/admin/settings',
                };
            }
            return { accessible: true }; // Finance is always enabled (core module)

        case 'sales':
            if (!finance_setup_complete) {
                return {
                    accessible: false,
                    reason: 'Complete Finance Setup (Chart of Accounts, Tax, FY) to enable Sales.',
                    required_stage: 'finance_setup',
                    redirect_to: '/admin/finance',
                };
            }
            if (!tenantStatus.module_sales) {
                return {
                    accessible: false,
                    reason: 'Sales module is not included in your current subscription plan.',
                    redirect_to: '/admin/settings',
                };
            }
            return { accessible: true };

        case 'operations':
            if (!finance_setup_complete) {
                return {
                    accessible: false,
                    reason: 'Complete Finance Setup (Chart of Accounts, Tax, FY) to enable Operations.',
                    required_stage: 'finance_setup',
                    redirect_to: '/admin/finance',
                };
            }
            if (!tenantStatus.module_operations) {
                return {
                    accessible: false,
                    reason: 'Operations module is not included in your current subscription plan.',
                    redirect_to: '/admin/settings',
                };
            }
            return { accessible: true };

        case 'hr':
            if (!finance_setup_complete) {
                return {
                    accessible: false,
                    reason: 'Complete Finance Setup (Chart of Accounts, Tax, FY) to enable HR.',
                    required_stage: 'finance_setup',
                    redirect_to: '/admin/finance',
                };
            }
            if (!tenantStatus.module_hr) {
                return {
                    accessible: false,
                    reason: 'HR module is not included in your current subscription plan.',
                    redirect_to: '/admin/settings',
                };
            }
            return { accessible: true };

        case 'reports':
            if (!finance_setup_complete) {
                return {
                    accessible: false,
                    reason: 'Complete Finance Setup first to generate reports.',
                    required_stage: 'finance_setup',
                    redirect_to: '/admin/finance',
                };
            }
            return { accessible: true };

        default:
            return { accessible: false, reason: 'Unknown module.' };
    }
}

/**
 * Check ERP-level role permissions for a specific module + action
 * 
 * Roles: super_admin, finance, hr, sales, operations, viewer
 */
export function checkRolePermission(
    erpRole: string | null | undefined,
    module: ModuleKey,
    action: 'view' | 'create' | 'edit' | 'approve' | 'delete' = 'view'
): boolean {
    if (!erpRole) return false;

    // Super admin can do everything
    if (erpRole === 'super_admin') return true;

    // Viewer can only view
    if (erpRole === 'viewer') return action === 'view';

    // Module-specific role checks
    const roleModuleMap: Record<string, ModuleKey[]> = {
        finance: ['dashboard', 'company', 'finance', 'reports', 'settings'],
        hr: ['dashboard', 'hr', 'reports'],
        sales: ['dashboard', 'sales', 'reports'],
        operations: ['dashboard', 'operations', 'reports'],
    };

    const allowedModules = roleModuleMap[erpRole] || [];

    if (!allowedModules.includes(module)) return false;

    // For non-super_admin roles, restrict destructive actions to their own module
    if (action === 'delete' || action === 'approve') {
        // Only allow delete/approve in their primary module
        const primaryModule: Record<string, ModuleKey> = {
            finance: 'finance',
            hr: 'hr',
            sales: 'sales',
            operations: 'operations',
        };
        return primaryModule[erpRole] === module;
    }

    return true;
}

/**
 * Get the next required setup step for a tenant
 */
export function getNextSetupStep(status: TenantSetupStatus | null): {
    step: number;
    total: number;
    label: string;
    path: string;
    percentage: number;
} {
    if (!status) {
        return { step: 1, total: 4, label: 'Set Up Organization', path: '/admin/settings', percentage: 0 };
    }

    if (!status.company_setup_complete) {
        return { step: 1, total: 4, label: 'Complete Company Profile', path: '/admin/settings', percentage: 25 };
    }

    if (!status.finance_setup_complete) {
        return { step: 2, total: 4, label: 'Configure Finance (COA, Tax, FY)', path: '/admin/finance', percentage: 50 };
    }

    if (!status.roles_setup_complete) {
        return { step: 3, total: 4, label: 'Set Up User Roles', path: '/admin/settings', percentage: 75 };
    }

    return { step: 4, total: 4, label: 'Setup Complete', path: '/admin/dashboard', percentage: 100 };
}

/**
 * The setup dependency chain for display
 */
export const SETUP_CHAIN = [
    { key: 'subscription', label: 'Subscription', icon: 'CreditCard', description: 'Select a plan' },
    { key: 'company_profile', label: 'Company Profile', icon: 'Building2', description: 'Enter business details' },
    { key: 'finance_setup', label: 'Finance Setup', icon: 'DollarSign', description: 'COA, Tax, Financial Year' },
    { key: 'roles_setup', label: 'User Roles', icon: 'Shield', description: 'Create roles and permissions' },
    { key: 'completed', label: 'All Modules Active', icon: 'CheckCircle2', description: 'Full ERP ready' },
] as const;
