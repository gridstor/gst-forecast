// Test database functions directly
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFunctionExists() {
  try {
    console.log('🔍 Checking if preview function exists...');
    
    const functions = await prisma.$queryRaw`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'Forecasts' 
      AND routine_name LIKE '%preview%'
    `;
    
    console.log('Functions found:', functions);
    
    if (functions.length === 0) {
      console.log('❌ No preview functions found in Forecasts schema');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking functions:', error.message);
    return false;
  }
}

async function testPreviewFunction() {
  try {
    console.log('🧪 Testing preview function...');
    
    const result = await prisma.$queryRaw`
      SELECT "Forecasts".preview_schedule_creation(
        'ERCOT'::VARCHAR,
        'Houston'::VARCHAR,
        'Test_Product'::VARCHAR,
        'REVENUE'::VARCHAR,
        '2024-02-01T00:00:00Z'::TIMESTAMPTZ,
        '2024-02-29T23:59:59Z'::TIMESTAMPTZ
      ) as preview_data
    `;
    
    console.log('✅ Preview function works!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing preview function:', error.message);
  }
}

async function testCreateFunction() {
  try {
    console.log('🧪 Testing create function...');
    
    const result = await prisma.$queryRaw`
      SELECT "Forecasts".create_schedule_with_instance_template(
        'ERCOT'::VARCHAR,
        'Houston'::VARCHAR,
        'Test_Product_Create'::VARCHAR,
        'REVENUE'::VARCHAR,
        '2024-03-01T00:00:00Z'::TIMESTAMPTZ,
        '2024-03-31T23:59:59Z'::TIMESTAMPTZ
      ) as creation_result
    `;
    
    console.log('✅ Create function works!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing create function:', error.message);
  }
}

async function main() {
  console.log('🔧 Testing Enhanced Schedule Workflow Database Functions\n');
  
  const functionsExist = await testFunctionExists();
  
  if (functionsExist) {
    await testPreviewFunction();
    console.log('\n');
    await testCreateFunction();
  }
  
  await prisma.$disconnect();
}

main().catch(console.error); 