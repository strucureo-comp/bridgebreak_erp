/**
 * Tax Calculation API
 * Calculate taxes for any country with comprehensive support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  calculateTax,
  getTaxRatesForCountry,
  getCountryTaxConfig,
  getSupportedCountries,
  validateTaxId,
  TaxCalculationInput,
} from '@/lib/finance/tax-engine';

// POST /api/finance/tax/calculate - Calculate tax for given input
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount,
      countryCode,
      region,
      customerTaxId,
      isB2B,
      isTaxExempt,
      lineItems,
    } = body;

    if (!amount || !countryCode) {
      return NextResponse.json(
        { error: 'Amount and countryCode are required' },
        { status: 400 }
      );
    }

    // Validate tax ID if provided
    let taxIdValid = true;
    if (customerTaxId) {
      taxIdValid = validateTaxId(customerTaxId, countryCode);
    }

    const calculationInput: TaxCalculationInput = {
      amount: Number(amount),
      countryCode: countryCode.toUpperCase(),
      region,
      customerTaxId,
      isB2B: isB2B ?? false,
      isTaxExempt: isTaxExempt ?? false,
      lineItems: lineItems?.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: item.amount ? Number(item.amount) : undefined,
        goodsCategory: item.goodsCategory,
        serviceCategory: item.serviceCategory,
        taxRateCode: item.taxRateCode,
        isTaxExempt: item.isTaxExempt,
      })),
    };

    const result = calculateTax(calculationInput);

    return NextResponse.json({
      ...result,
      taxIdValid,
      formattedTaxId: customerTaxId?.toUpperCase(),
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate tax', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/finance/tax/countries - Get list of supported countries
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('countryCode');

    if (countryCode) {
      // Get tax rates for specific country
      const rates = getTaxRatesForCountry(countryCode.toUpperCase());
      const config = getCountryTaxConfig(countryCode.toUpperCase());

      return NextResponse.json({
        countryCode: countryCode.toUpperCase(),
        config,
        rates: rates.map(rate => ({
          id: rate.id,
          code: rate.code,
          name: rate.name,
          rate: rate.rate,
          type: rate.type,
          category: rate.category,
          description: rate.description,
          isCompound: rate.isCompound,
        })),
      });
    }

    // Return all supported countries
    const countries = getSupportedCountries();
    return NextResponse.json({ countries });
  } catch (error) {
    console.error('Tax countries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax data' },
      { status: 500 }
    );
  }
}
