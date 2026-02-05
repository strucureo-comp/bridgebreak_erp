/**
 * Tax Collection Initialization Route
 * Called on first request after server startup
 * Initializes the tax data collection system
 */

import { NextResponse } from 'next/server';
import { initializeTaxDataCollection, getTaxCollectionStatus } from '@/lib/services/tax-collection-init';

let initialized = false;

export async function GET() {
  try {
    // Initialize only once per server instance
    if (!initialized) {
      await initializeTaxDataCollection();
      initialized = true;
    }

    // Get current status
    const status = await getTaxCollectionStatus();

    return NextResponse.json({
      message: 'Tax collection system initialized',
      status,
      initialized: true,
    });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize tax collection',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
