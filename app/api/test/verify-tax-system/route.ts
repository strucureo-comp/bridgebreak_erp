/**
 * Tax Data System Verification API Route
 * GET /api/test/verify-tax-system
 */

import { NextResponse } from 'next/server';
import { verifyTaxDataSystem } from '@/lib/test-tax-system';

export async function GET() {
  try {
    const result = await verifyTaxDataSystem();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification failed:', error);
    return NextResponse.json(
      {
        error: 'Verification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
