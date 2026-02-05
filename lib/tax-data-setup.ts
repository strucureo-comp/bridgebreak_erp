/**
 * APILayer Tax Data Setup Configuration
 * This file contains setup instructions and configuration for tax data collection
 */

// ============================================
// SETUP INSTRUCTIONS
// ============================================

/*
1. GET YOUR APILAYER API KEY:
   - Visit https://apilayer.com/
   - Sign up for free account
   - Navigate to "Tax Data API" product
   - Copy your API Key from dashboard

2. ADD TO .env.local:
   APILAYER_API_KEY=your_api_key_here

3. INITIALIZE DATABASE:
   - Run migrations to ensure SystemSettings table exists
   - npm run db:push or npx prisma db push

4. TRIGGER INITIAL COLLECTION:
   - Via API: POST /api/admin/tax-management?action=run-job
   - Or call: triggerTaxDataCollection() from lib/api.ts

5. VERIFY COLLECTION:
   - GET /api/settings/tax-data?action=database
   - Should return full tax database for all countries

6. SETUP MONTHLY CRON JOB (recommended):
   - Use external cron service (EasyCron, Cloudflare Workers, etc)
   - Configure to POST: /api/admin/tax-management?action=run-job monthly
   - Or use Node.js node-cron package in background

============================================
*/

// ============================================
// SUPPORTED COUNTRIES (54 total)
// ============================================

export const SUPPORTED_TAX_COUNTRIES = {
  americas: [
    'US', // United States
    'CA', // Canada
    'MX', // Mexico
    'BR', // Brazil
    'AR', // Argentina
    'CL', // Chile
    'CO', // Colombia
    'PE', // Peru
  ],
  europe: [
    'DE', // Germany
    'FR', // France
    'GB', // United Kingdom
    'IT', // Italy
    'ES', // Spain
    'NL', // Netherlands
    'BE', // Belgium
    'AT', // Austria
    'SE', // Sweden
    'NO', // Norway
    'CH', // Switzerland
    'IE', // Ireland
    'PL', // Poland
    'CZ', // Czech Republic
    'RO', // Romania
    'GR', // Greece
    'PT', // Portugal
    'HU', // Hungary
  ],
  middleeast_africa: [
    'RU', // Russia
    'UA', // Ukraine
    'TR', // Turkey
    'IL', // Israel
    'SA', // Saudi Arabia
    'AE', // United Arab Emirates
    'QA', // Qatar
    'KW', // Kuwait
    'BH', // Bahrain
    'OM', // Oman
    'EG', // Egypt
    'NG', // Nigeria
    'ZA', // South Africa
    'KE', // Kenya
  ],
  asia_pacific: [
    'IN', // India
    'CN', // China
    'JP', // Japan
    'KR', // South Korea
    'SG', // Singapore
    'MY', // Malaysia
    'TH', // Thailand
    'VN', // Vietnam
    'PH', // Philippines
    'ID', // Indonesia
    'BD', // Bangladesh
    'PK', // Pakistan
    'AU', // Australia
    'NZ', // New Zealand
  ],
};

// ============================================
// CONFIGURATION OPTIONS
// ============================================

export const TAX_COLLECTION_CONFIG = {
  // Collection interval (in days) - 10 days = 3 times per month
  COLLECTION_INTERVAL_DAYS: 10,

  // Rate limiting between country requests (in ms)
  REQUEST_DELAY_MS: 100,

  // Maximum number of retries for failed requests
  MAX_RETRIES: 3,

  // Timeout for single country request (in ms)
  REQUEST_TIMEOUT_MS: 10000,

  // Keep job history records
  JOB_HISTORY_LIMIT: 12,

  // Enable automatic collection on startup
  AUTO_COLLECT_ON_STARTUP: true,

  // Database storage key
  STORAGE_KEY: 'global_tax_database',

  // Job history storage key
  JOB_HISTORY_KEY: 'tax_collection_job_history',
};

// ============================================
// APILAYER TAX DATA API ENDPOINTS
// ============================================

export const APILAYER_ENDPOINTS = {
  // Check VAT/Tax rates for a country
  CHECK_TAX: 'https://api.apilayer.com/tax_data/tax_rates',

  // Validate VAT numbers
  VALIDATE_VAT: 'https://api.apilayer.com/tax_data/validate',

  // Get all countries
  GET_COUNTRIES: 'https://api.apilayer.com/tax_data/countries',

  // Get tax history for country
  GET_HISTORY: 'https://api.apilayer.com/tax_data/history',
};

// ============================================
// PRICING & LIMITS
// ============================================

/*
APILayer Tax Data API Pricing:
- Free Tier:
  * 100 requests/month
  * 54 countries supported
  * Check VAT rates
  * VAT number validation

- Paid Tiers:
  * Professional: 10,000 requests/month
  * Business: 100,000 requests/month
  * Enterprise: Unlimited

For bulk monthly collection (54 countries):
- Cost: ~1 request per country = 54 requests/month
- Free tier provides 100 requests/month (plenty for monthly collection + validation)
- Perfect for monthly tax sync without extra cost!
*/

// ============================================
// TROUBLESHOOTING
// ============================================

/*
1. "APILAYER_API_KEY not configured"
   - Check .env.local has APILAYER_API_KEY=your_key
   - Restart dev server after updating .env

2. "Failed to fetch tax data for XX"
   - Check API key validity at apilayer.com
   - Verify network connection
   - Check rate limiting (100ms delays between requests)

3. "Prisma not initialized"
   - Ensure database is properly configured
   - Run: npx prisma db push
   - Check DATABASE_URL in .env

4. "Tax database not initialized"
   - Trigger collection: POST /api/admin/tax-management?action=run-job
   - Check job history for errors
   - Verify APILayer API key is valid

5. "VAT validation returns false"
   - Check VAT number format matches country rules
   - Some countries may not support VAT validation
   - Verify country code is correct
*/

// ============================================
// EXAMPLE USAGE IN YOUR APP
// ============================================

/*
// 1. Get tax rate for a country
const taxData = await getTaxDataForCountry('DE'); // Germany
// Returns: { vat_rate: 19, country_name: 'Germany', ... }

// 2. Calculate price with VAT
const priceWithVAT = await calculatePriceWithVAT('DE', 100, 'USD');
// Returns: { 
//   base_amount: 100, 
//   vat_amount: 19, 
//   total_with_vat: 119,
//   vat_rate: 19
// }

// 3. Validate VAT number
const isValid = await validateVATNumber('DE123456789');
// Returns: { valid: true, country: 'DE' }

// 4. Get all available countries
const countries = await getAllTaxCountries();
// Returns: [
//   { code: 'DE', name: 'Germany', vatRate: 19 },
//   { code: 'FR', name: 'France', vatRate: 20 },
//   ...
// ]

// 5. Trigger collection (admin)
const result = await triggerTaxDataCollection();
// Returns: { message: '...', result: { status: 'success', ... } }

// 6. Get collection status
const status = await getTaxDatabaseStatus();
// Returns: { status: 'initialized', totalCountries: 54, lastSync: '...' }
*/

// ============================================
// MONTHLY CRON JOB SETUP OPTIONS
// ============================================

/*
Option 1: EasyCron (Free)
- Visit https://www.easycron.com/
- Create new cron job
- URL: https://your-app.com/api/admin/tax-management?action=run-job
- Frequency: Monthly (30 days)
- Method: POST

Option 2: Cloudflare Workers
- Create scheduled trigger
- Execute: fetch('/api/admin/tax-management?action=run-job')
- Cron: 0 0 1 * * (1st of every month)

Option 3: Node.js node-cron
- Install: npm install node-cron
- Add to your background job handler:

  import cron from 'node-cron';
  import { runTaxDataCollectionJob } from '@/lib/services/tax-job';

  // Run on 1st day of every month at 2 AM
  cron.schedule('0 2 1 * *', async () => {
    console.log('Running monthly tax collection...');
    const result = await runTaxDataCollectionJob();
    console.log('Collection result:', result);
  });

Option 4: GitHub Actions
- Create .github/workflows/tax-collection.yml
- Schedule: cron: '0 0 1 * *' (1st of month, 00:00 UTC)
- Workflow calls your API endpoint

Option 5: Vercel Cron (Pro plan)
- Add to api route:
  export const config = {
    regions: ['iad1'],
  };
  
  export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).send('Unauthorized');
    }
    // Call tax collection
  }
*/

// ============================================
// DATABASE SCHEMA
// ============================================

/*
Tax data is stored in SystemSettings table as JSON:

Key: "global_tax_database"
Value: {
  id?: string,
  collection_date: string (ISO timestamp),
  data: TaxData[] (array of tax records),
  all_countries: string[] (array of country codes),
  last_sync: string (ISO timestamp),
  status: 'success' | 'partial' | 'failed',
  error_message?: string,
  version: number,
  updated_at?: string
}

Job History is stored as:
Key: "tax_collection_job_history"
Value: JobResult[] (array of last 12 job results)
*/

// ============================================
// FEATURES PROVIDED
// ============================================

export const FEATURES = {
  'Automatic Tax Collection': 'Monthly collection for 54+ countries via APILayer',
  'VAT Validation': 'Validate VAT numbers against official databases',
  'Price Calculation': 'Calculate prices with automatic VAT application',
  'Global Tax Database': 'Centralized database accessible to all users',
  'Job History': 'Track collection job execution and errors',
  'Admin Dashboard': 'Monitor tax data status and statistics',
  'Multi-Currency Support': 'Convert prices across currencies and regions',
  'Real-Time Updates': 'Latest tax rates always available',
  'Error Handling': 'Graceful handling of API failures with history',
  'Configurable Intervals': 'Customize collection frequency as needed',
};

export default {
  SUPPORTED_TAX_COUNTRIES,
  TAX_COLLECTION_CONFIG,
  APILAYER_ENDPOINTS,
  FEATURES,
};
