import { NextResponse } from 'next/server';

/**
 * GET /api/admin/tenant/status
 * 
 * Returns the current tenant's setup status.
 * Used by the frontend to determine module access via the dependency gate.
 * 
 * In production, this would read from the Tenant model via Prisma.
 * For now, returns a configurable response based on system settings.
 */

export async function GET() {
    try {
        // TODO: In production, fetch from Prisma:
        // const tenant = await prisma.tenant.findFirst({ where: { users: { some: { id: userId } } } });

        // For development: return fully-set-up status
        // This allows all modules to be accessible while building
        // Change these flags to test the module gate behavior:
        const tenantStatus = {
            setup_stage: 'completed',
            company_setup_complete: true,
            finance_setup_complete: true,
            roles_setup_complete: true,
            module_finance: true,
            module_sales: true,
            module_operations: true,
            module_hr: true,
        };

        return NextResponse.json(tenantStatus);
    } catch (error) {
        console.error('Tenant status error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tenant status' },
            { status: 500 }
        );
    }
}
