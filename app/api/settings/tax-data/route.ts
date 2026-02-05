/**
 * Tax Data Management API Route
 * Handles collection, retrieval, and sync of tax data from APILayer
 */

import { NextRequest, NextResponse } from 'next/server';
import { taxDataService } from '@/lib/services/tax-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const countryCode = searchParams.get('country');

    // Get specific country tax data
    if (action === 'country' && countryCode) {
      const taxData = await taxDataService.getCountryTaxData(countryCode);

      if (!taxData) {
        return NextResponse.json(
          { error: 'Tax data not found for country' },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: taxData });
    }

    // Get all available countries
    if (action === 'countries') {
      const countries = await taxDataService.getAllAvailableCountries();
      return NextResponse.json({ countries });
    }

    // Get last sync time
    if (action === 'last-sync') {
      const lastSync = await taxDataService.getLastSyncTime();
      return NextResponse.json({ lastSync });
    }

    // Get full tax database
    if (action === 'database') {
      const db = await taxDataService.getTaxDatabase();
      return NextResponse.json({ database: db });
    }

    // Check if collection is needed
    if (action === 'check-needed') {
      const shouldCollect = await taxDataService.shouldCollectTaxData();
      return NextResponse.json({ shouldCollect });
    }

    // Default: return database summary
    const db = await taxDataService.getTaxDatabase();
    return NextResponse.json({
      status: db ? 'initialized' : 'empty',
      lastSync: db?.last_sync,
      totalCountries: db?.data.length || 0,
      collectionStatus: db?.status,
    });
  } catch (error) {
    console.error('Tax data GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json().catch(() => ({}));

    // Collect all countries tax data
    if (action === 'collect' || action === 'sync') {
      const result = await taxDataService.collectAllCountriesTaxData();

      if (!result) {
        return NextResponse.json(
          { error: 'Failed to collect tax data' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Tax data collection completed',
        status: result.status,
        totalCountries: result.data.length,
        collectionDate: result.collection_date,
        errors: result.error_message,
      });
    }

    // Calculate price with VAT
    if (action === 'calculate-vat') {
      const { countryCode, amount, currency } = body;

      if (!countryCode || amount === undefined) {
        return NextResponse.json(
          { error: 'Missing countryCode or amount' },
          { status: 400 }
        );
      }

      const result = await taxDataService.calculatePriceWithVAT(
        countryCode,
        parseFloat(amount),
        currency || 'USD'
      );

      if (!result) {
        return NextResponse.json(
          { error: 'Could not calculate VAT for country' },
          { status: 404 }
        );
      }

      return NextResponse.json({ calculation: result });
    }

    // Validate VAT number
    if (action === 'validate-vat') {
      const { vatNumber } = body;

      if (!vatNumber) {
        return NextResponse.json(
          { error: 'Missing VAT number' },
          { status: 400 }
        );
      }

      const result = await taxDataService.validateVATNumber(vatNumber);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Tax data POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
