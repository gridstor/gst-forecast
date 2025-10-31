// Test all API endpoints to ensure they work after migration
// Usage: npx tsx scripts/test-api-endpoints.ts

const BASE_URL = 'http://localhost:4321';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
  endpoint: string,
  method: string = 'GET',
  expectedStatus: number = 200,
  body?: any
): Promise<TestResult> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => null);
    
    const success = response.status === expectedStatus;
    const result: TestResult = {
      endpoint,
      method,
      status: response.status,
      success,
      data
    };
    
    if (!success) {
      result.error = `Expected ${expectedStatus}, got ${response.status}`;
    }
    
    return result;
  } catch (error) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  console.log('='.repeat(80));
  
  // Test 1: Curve Definitions
  console.log('\n📋 Testing Curve Definition APIs...');
  let result = await testEndpoint('/api/curves/definitions');
  results.push(result);
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/curves/definitions - ${result.status}`);
  
  // Get a definition ID for further tests
  let definitionId = result.data?.[0]?.id;
  
  if (definitionId) {
    // Test 2: Curve Instances
    console.log('\n📋 Testing Curve Instance APIs...');
    result = await testEndpoint(`/api/curves/instances?definitionId=${definitionId}`);
    results.push(result);
    console.log(`  ${result.success ? '✅' : '❌'} GET /api/curves/instances - ${result.status}`);
    
    if (result.data && result.data.length > 0) {
      console.log(`    → Found ${result.data.length} instances`);
      console.log(`    → Instance has curveType: ${result.data[0].curveType !== undefined ? '✅' : '❌'}`);
      console.log(`    → Instance has commodity: ${result.data[0].commodity !== undefined ? '✅' : '❌'}`);
    }
    
    // Get an instance ID for further tests
    let instanceId = result.data?.[0]?.id;
    
    if (instanceId) {
      // Test 3: Curve Data
      console.log('\n📋 Testing Curve Data APIs...');
      result = await testEndpoint(`/api/curves/data?curveInstanceId=${instanceId}`);
      results.push(result);
      console.log(`  ${result.success ? '✅' : '❌'} GET /api/curves/data - ${result.status}`);
      
      if (result.success && result.data?.priceData) {
        console.log(`    → Found ${result.data.priceData.length} data points`);
        if (result.data.priceData.length > 0) {
          const point = result.data.priceData[0];
          console.log(`    → Has valueP50: ${point.valueP50 !== undefined ? '✅' : '❌'}`);
          console.log(`    → Has valueP5: ${point.valueP5 !== undefined ? '✅' : '❌'}`);
        }
      }
      
      // Test 4: Curve Data with P-Values
      result = await testEndpoint(`/api/curves/data-with-pvalues?instanceIds=${instanceId}`);
      results.push(result);
      console.log(`  ${result.success ? '✅' : '❌'} GET /api/curves/data-with-pvalues - ${result.status}`);
      
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const point = result.data[0];
        console.log(`    → Has all p-values: ${point.valueP5 && point.valueP25 && point.valueP50 && point.valueP75 && point.valueP95 ? '✅' : '⚠️'}`);
      }
    }
  }
  
  // Test 5: Curve Locations
  console.log('\n📋 Testing Utility APIs...');
  result = await testEndpoint('/api/curves/locations');
  results.push(result);
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/curves/locations - ${result.status}`);
  
  // Test 6: By Location Enhanced
  result = await testEndpoint('/api/curves/by-location-enhanced?market=CAISO&location=SP15');
  results.push(result);
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/curves/by-location-enhanced - ${result.status}`);
  
  // Test 7: Delivery Requests
  console.log('\n📋 Testing Delivery Request APIs...');
  result = await testEndpoint('/api/delivery-request/list');
  results.push(result);
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/delivery-request/list - ${result.status}`);
  
  result = await testEndpoint('/api/delivery-request/setup');
  results.push(result);
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/delivery-request/setup - ${result.status}`);
  
  // Test 8: Admin APIs
  console.log('\n📋 Testing Admin APIs...');
  result = await testEndpoint('/api/admin/test-prisma');
  results.push(result);
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/admin/test-prisma - ${result.status}`);
  
  result = await testEndpoint('/api/admin/curve-field-values');
  results.push(result);
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/admin/curve-field-values - ${result.status}`);
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY:\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Success rate: ${Math.round((passed / total) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ${r.method} ${r.endpoint}`);
      console.log(`    Status: ${r.status}`);
      console.log(`    Error: ${r.error || 'Unknown'}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  return { passed, failed, total, results };
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok || response.status === 404; // 404 is okay, means server is running
  } catch {
    return false;
  }
}

// Main
(async () => {
  console.log('🔍 Checking if dev server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Dev server is not running!');
    console.error('Please start it with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  
  const summary = await runTests();
  
  process.exit(summary.failed > 0 ? 1 : 0);
})();

