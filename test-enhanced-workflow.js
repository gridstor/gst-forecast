// Test script for enhanced schedule workflow
const testData = {
  market: "ERCOT",
  location: "Houston",
  product: "Test_Product",
  curveType: "REVENUE",
  deliveryPeriodStart: "2024-02-01T00:00:00Z",
  deliveryPeriodEnd: "2024-02-29T23:59:59Z"
};

async function testPreview() {
  try {
    const response = await fetch('http://localhost:4321/api/curve-schedule/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Preview API Test Success:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Preview API Test Failed:', error.message);
  }
}

async function testCreate() {
  try {
    const response = await fetch('http://localhost:4321/api/curve-schedule/create-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Create Enhanced API Test Success:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Create Enhanced API Test Failed:', error.message);
  }
}

// Run tests
console.log('🧪 Testing Enhanced Schedule Workflow...\n');
testPreview().then(() => {
  console.log('\n');
  return testCreate();
}); 