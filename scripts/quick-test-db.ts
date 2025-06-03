// Quick test script - Run with: tsx scripts/quick-test-db.ts
// Environment variables are loaded automatically from .env file
import { PrismaClient } from '@prisma/client';

async function quickTest() {
  console.log('Quick Database Test\n');
  console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? '✅ Yes' : '❌ No');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found. Make sure .env file exists in the root directory.');
    console.log('\nTip: Run this script with tsx or npm run:');
    console.log('  tsx scripts/quick-test-db.ts');
    return;
  }

  // Show connection info (hide password)
  const dbUrl = process.env.DATABASE_URL;
  const sanitizedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log('Connecting to:', sanitizedUrl);

  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  try {
    // Quick connection test
    await prisma.$connect();
    console.log('\n✅ Connected to AWS RDS successfully!\n');

    // Check for data
    const scheduleCount = await prisma.curveSchedule.count();
    const curveDefCount = await prisma.curve_definitions.count();
    
    console.log(`📊 Data Summary:`);
    console.log(`   - curve_schedule: ${scheduleCount} records`);
    console.log(`   - curve_definitions: ${curveDefCount} records`);

    if (scheduleCount === 0) {
      console.log('\n⚠️  The curve_schedule table is empty!');
      console.log('   Run: npm run populate-curves');
    } else {
      // Show a few samples
      console.log('\n📋 Sample Curve Schedules:');
      const samples = await prisma.curveSchedule.findMany({
        take: 3,
        select: {
          curvePattern: true,
          location: true,
          updateFrequency: true
        }
      });
      
      samples.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.curvePattern} - ${s.location} (${s.updateFrequency})`);
      });
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'P2021') {
      console.log('\n🔧 Table not found in current schema');
      console.log('   Make sure your DATABASE_URL includes: ?schema=Forecasts');
    }
  } finally {
    await prisma.$disconnect();
  }
}

quickTest(); 