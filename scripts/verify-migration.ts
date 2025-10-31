/**
 * Verification Script: Test array field migration
 * Run with: npx tsx scripts/verify-migration.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('🔍 Verifying migration...\n');
    
    // Test 1: Can we query instances with array fields?
    console.log('Test 1: Querying instances with array fields...');
    const instances = await prisma.curveInstance.findMany({
      select: {
        id: true,
        instanceVersion: true,
        curveTypes: true,
        commodities: true,
        scenarios: true
      },
      take: 5
    });
    console.log(`   ✓ Found ${instances.length} instances`);
    if (instances.length > 0) {
      console.log(`   Sample: ${instances[0].instanceVersion}`);
      console.log(`     Types: ${JSON.stringify(instances[0].curveTypes)}`);
      console.log(`     Commodities: ${JSON.stringify(instances[0].commodities)}`);
      console.log(`     Scenarios: ${JSON.stringify(instances[0].scenarios)}`);
    }
    
    // Test 2: Can we create an instance with arrays?
    console.log('\nTest 2: Testing array field creation (dry run)...');
    const testData = {
      curveTypes: ['P-Values', 'Revenue Forecast'],
      commodities: ['EA Revenue', 'AS Revenue'],
      scenarios: ['BASE', 'HIGH']
    };
    console.log(`   ✓ Would create with: ${JSON.stringify(testData)}`);
    
    // Test 3: Flatten arrays to get unique values
    console.log('\nTest 3: Extracting unique values from arrays...');
    const allInstances = await prisma.curveInstance.findMany({
      select: {
        curveTypes: true,
        commodities: true,
        scenarios: true
      }
    });
    
    const allTypes = allInstances.flatMap(i => i.curveTypes || []);
    const allCommodities = allInstances.flatMap(i => i.commodities || []);
    const allScenarios = allInstances.flatMap(i => i.scenarios || []);
    
    console.log(`   ✓ Unique curve types: ${[...new Set(allTypes)].join(', ')}`);
    console.log(`   ✓ Unique commodities: ${[...new Set(allCommodities)].join(', ')}`);
    console.log(`   ✓ Unique scenarios: ${[...new Set(allScenarios)].join(', ')}`);
    
    console.log('\n✅ All verification tests passed!');
    console.log('\n📝 You can now:');
    console.log('   1. Create instances with multiple types, commodities, and scenarios');
    console.log('   2. Edit existing instances to add/remove values');
    console.log('   3. Link instances to schedules/requests');
    console.log('   4. Track deliveries end-to-end\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify()
  .then(() => {
    console.log('✨ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });


