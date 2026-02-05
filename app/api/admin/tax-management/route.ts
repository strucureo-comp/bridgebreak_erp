/**
 * Admin Tax Management API
 * Allows admins to trigger, monitor, and manage tax data collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { runTaxDataCollectionJob, getJobHistory } from '@/lib/services/tax-job';
import { taxDataService } from '@/lib/services/tax-data-service';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');

    // Get job history
    if (resource === 'job-history') {
      const history = await getJobHistory();
      return NextResponse.json({ jobHistory: history });
    }

    // Get tax database stats
    if (resource === 'database-stats') {
      const db = await taxDataService.getTaxDatabase();

      if (!db) {
        return NextResponse.json(
          { stats: null, message: 'Tax database not initialized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        stats: {
          totalCountries: db.data.length,
          collectionDate: db.collection_date,
          lastSync: db.last_sync,
          status: db.status,
          averageVATRate:
            db.data.reduce((sum, tax) => sum + tax.vat_rate, 0) / db.data.length,
          minVATRate: Math.min(...db.data.map((tax) => tax.vat_rate)),
          maxVATRate: Math.max(...db.data.map((tax) => tax.vat_rate)),
        },
      });
    }

    // Get countries with VAT rates
    if (resource === 'countries-list') {
      const countries = await taxDataService.getAllAvailableCountries();
      return NextResponse.json({ countries });
    }

    return NextResponse.json({
      message: 'Tax data collection system',
      endpoints: {
        GET: [
          '/api/admin/tax-management?resource=job-history',
          '/api/admin/tax-management?resource=database-stats',
          '/api/admin/tax-management?resource=countries-list',
        ],
        POST: [
          '/api/admin/tax-management?action=run-job',
          '/api/admin/tax-management?action=manual-sync',
        ],
      },
    });
  } catch (error) {
    console.error('Tax management GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Trigger manual tax data collection job
    if (action === 'run-job' || action === 'manual-sync') {
      const result = await runTaxDataCollectionJob();

      return NextResponse.json({
        message: 'Tax collection job triggered',
        result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Tax management POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
