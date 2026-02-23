/**
 * Tax Data Integration Verification Script
 * Run this to test the tax data system is working correctly
 * 
 * Usage:
 * - Via API: GET /api/test/verify-tax-system
 * - Or: node lib/test-tax-system.ts (requires ts-node)
 */

import { taxDataService } from '@/lib/services/tax-data-service';
import { prisma } from '@/lib/prisma';

interface VerificationResult {
  timestamp: string;
  tests: {
    name: string;
    status: 'pass' | 'fail';
    message: string;
    duration: number;
  }[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    overallStatus: 'success' | 'partial' | 'failed';
  };
}

export async function verifyTaxDataSystem(): Promise<VerificationResult> {
  console.log('🧪 Starting Tax Data System Verification...\n');

  const tests: VerificationResult['tests'] = [];
  const startTime = Date.now();

  // Test 1: Check database connection
  {
    const testStart = Date.now();
    try {
      await prisma.systemSettings.findUnique({
        where: { key: 'test-connection' },
      });
      tests.push({
        name: 'Database Connection',
        status: 'pass',
        message: 'Successfully connected to database',
        duration: Date.now() - testStart,
      });
      console.log('✅ Test 1: Database Connection - PASS');
    } catch (error) {
      tests.push({
        name: 'Database Connection',
        status: 'fail',
        message: `Database connection failed: ${error}`,
        duration: Date.now() - testStart,
      });
      console.log('❌ Test 1: Database Connection - FAIL');
    }
  }

  // Test 2: Check API configuration
  {
    const testStart = Date.now();
    const apiKey = process.env.APILAYER_API_KEY;
    if (apiKey && apiKey !== 'your_api_key_here' && apiKey.length > 10) {
      tests.push({
        name: 'APILayer API Key Configuration',
        status: 'pass',
        message: `API key configured (${apiKey.substring(0, 8)}...)`,
        duration: Date.now() - testStart,
      });
      console.log('✅ Test 2: APILayer API Key - PASS');
    } else {
      tests.push({
        name: 'APILayer API Key Configuration',
        status: 'fail',
        message: 'API key not configured or invalid',
        duration: Date.now() - testStart,
      });
      console.log('❌ Test 2: APILayer API Key - FAIL');
    }
  }

  // Test 3: Check tax database exists
  {
    const testStart = Date.now();
    try {
      const db = await taxDataService.getTaxDatabase();
      if (db && db.data.length > 0) {
        tests.push({
          name: 'Tax Database Initialization',
          status: 'pass',
          message: `Tax database initialized with ${db.data.length} countries`,
          duration: Date.now() - testStart,
        });
        console.log(`✅ Test 3: Tax Database - PASS (${db.data.length} countries)`);
      } else {
        tests.push({
          name: 'Tax Database Initialization',
          status: 'fail',
          message: 'Tax database is empty or not initialized',
          duration: Date.now() - testStart,
        });
        console.log('❌ Test 3: Tax Database - FAIL (not initialized)');
      }
    } catch (error) {
      tests.push({
        name: 'Tax Database Initialization',
        status: 'fail',
        message: `Failed to retrieve tax database: ${error}`,
        duration: Date.now() - testStart,
      });
      console.log('❌ Test 3: Tax Database - FAIL');
    }
  }

  // Test 4: Verify service methods work
  {
    const testStart = Date.now();
    try {
      const countries = await taxDataService.getAllAvailableCountries();
      if (countries.length > 0) {
        tests.push({
          name: 'Service Methods',
          status: 'pass',
          message: `All service methods working (${countries.length} countries available)`,
          duration: Date.now() - testStart,
        });
        console.log(`✅ Test 4: Service Methods - PASS`);
      } else {
        tests.push({
          name: 'Service Methods',
          status: 'fail',
          message: 'Service methods returned no countries',
          duration: Date.now() - testStart,
        });
        console.log('❌ Test 4: Service Methods - FAIL');
      }
    } catch (error) {
      tests.push({
        name: 'Service Methods',
        status: 'fail',
        message: `Service methods failed: ${error}`,
        duration: Date.now() - testStart,
      });
      console.log('❌ Test 4: Service Methods - FAIL');
    }
  }

  // Test 5: Test price calculation
  {
    const testStart = Date.now();
    try {
      const result = await taxDataService.calculatePriceWithVAT('DE', 100, 'USD');
      if (result && result.total_with_vat > 100) {
        tests.push({
          name: 'Price Calculation with VAT',
          status: 'pass',
          message: `Price calculation working (100 → ${result.total_with_vat})`,
          duration: Date.now() - testStart,
        });
        console.log(`✅ Test 5: Price Calculation - PASS`);
      } else {
        tests.push({
          name: 'Price Calculation with VAT',
          status: 'fail',
          message: 'Price calculation returned unexpected result',
          duration: Date.now() - testStart,
        });
        console.log('❌ Test 5: Price Calculation - FAIL');
      }
    } catch (error) {
      tests.push({
        name: 'Price Calculation with VAT',
        status: 'fail',
        message: `Price calculation failed: ${error}`,
        duration: Date.now() - testStart,
      });
      console.log('❌ Test 5: Price Calculation - FAIL');
    }
  }

  // Test 6: Check last sync time
  {
    const testStart = Date.now();
    try {
      const lastSync = await taxDataService.getLastSyncTime();
      if (lastSync) {
        tests.push({
          name: 'Last Sync Timestamp',
          status: 'pass',
          message: `Last sync: ${lastSync.toLocaleDateString()} ${lastSync.toLocaleTimeString()}`,
          duration: Date.now() - testStart,
        });
        console.log(`✅ Test 6: Last Sync - PASS`);
      } else {
        tests.push({
          name: 'Last Sync Timestamp',
          status: 'fail',
          message: 'No sync timestamp found (collection may not have run yet)',
          duration: Date.now() - testStart,
        });
        console.log('❌ Test 6: Last Sync - FAIL (no data)');
      }
    } catch (error) {
      tests.push({
        name: 'Last Sync Timestamp',
        status: 'fail',
        message: `Failed to check sync time: ${error}`,
        duration: Date.now() - testStart,
      });
      console.log('❌ Test 6: Last Sync - FAIL');
    }
  }

  // Calculate summary
  const passed = tests.filter((t) => t.status === 'pass').length;
  const failed = tests.filter((t) => t.status === 'fail').length;
  const overallStatus: VerificationResult['summary']['overallStatus'] =
    failed === 0 ? 'success' : failed < 3 ? 'partial' : 'failed';

  console.log('\n================================================\n');
  console.log(`📊 VERIFICATION RESULTS:`);
  console.log(`   Total Tests: ${tests.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Status: ${overallStatus.toUpperCase()}`);
  console.log(`   Total Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log('\n================================================\n');

  if (overallStatus === 'success') {
    console.log('🎉 All tests passed! Tax system is ready to use.');
  } else if (overallStatus === 'partial') {
    console.log('⚠️  Some tests failed. Check the errors above.');
    console.log('💡 Common fixes:');
    console.log('   1. Add APILAYER_API_KEY to .env.local');
    console.log('   2. Run: npx prisma db push');
    console.log('   3. Trigger collection: POST /api/admin/tax-management?action=run-job');
  } else {
    console.log('❌ Multiple tests failed. Please check your setup.');
  }

  console.log('\nFor detailed help, see: TAX_DATA_SETUP.md\n');

  return {
    timestamp: new Date().toISOString(),
    tests,
    summary: {
      totalTests: tests.length,
      passed,
      failed,
      overallStatus,
    },
  };
}

// Export for API route
export default verifyTaxDataSystem;
