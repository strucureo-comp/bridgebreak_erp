/**
 * Public Tax Data Collection Trigger
 * Allows manual triggering of tax data collection
 */

import { taxDataService } from '@/lib/services/tax-data-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get action from query params
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'collect-now') {
      // Trigger immediate collection (force bypass of schedule check)
      console.log('[TAX COLLECT API] Triggering immediate tax data collection...');
      
      try {
        const result = await taxDataService.collectAllCountriesTaxData();
        
        if (!result) {
          return NextResponse.json({
            error: 'Collection returned null or no data',
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        }

        return NextResponse.json({
          message: 'Tax data collection completed successfully',
          success: true,
          countriesCollected: result.data?.length || 0,
          status: result.status,
          collectionDate: result.collection_date,
          lastSync: result.last_sync,
          timestamp: new Date().toISOString(),
          sampleCountries: result.data?.slice(0, 2).map(d => d.country_name), // Show first 2 for verification
        }, { status: 200 });
      } catch (collectionError) {
        throw collectionError;
      }
    }

    return NextResponse.json({
      error: 'Invalid action. Use action=collect-now',
      availableActions: ['collect-now'],
    }, { status: 400 });

  } catch (error) {
    console.error('[TAX COLLECT API] Error:', error);
    return NextResponse.json({
      error: 'Failed to trigger collection',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
