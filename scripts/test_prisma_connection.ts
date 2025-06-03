import { PrismaClient } from '@prisma/client';

// Note: You need to set DATABASE_URL environment variable
// Example: DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=Forecasts"

async function testPrismaConnection() {
  console.log('Testing Prisma connection...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.log('\nPlease create a .env file in the root directory with:');
    console.log('DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=Forecasts"');
    console.log('\nNote: Your data appears to be in the "Forecasts" schema, not "public"');
    return;
  }

  console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn']
  });

  try {
    // Test connection
    console.log('\n1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');

    // Check curve_schedule table
    console.log('\n2. Checking curve_schedule table...');
    const scheduleCount = await prisma.curveSchedule.count();
    console.log(`   Found ${scheduleCount} records in curve_schedule`);

    if (scheduleCount === 0) {
      console.log('   ⚠️  No data in curve_schedule table!');
      console.log('   You may need to run: npm run populate-curves');
    }

    // Check curve_definitions table
    console.log('\n3. Checking curve_definitions table...');
    const curveCount = await prisma.curve_definitions.count();
    console.log(`   Found ${curveCount} records in curve_definitions`);

    // Get a sample of curve schedules
    if (scheduleCount > 0) {
      console.log('\n4. Sample curve schedules:');
      const samples = await prisma.curveSchedule.findMany({
        take: 3,
        select: {
          id: true,
          curvePattern: true,
          location: true,
          updateFrequency: true,
          nextUpdateDue: true
        }
      });
      
      samples.forEach((schedule, index) => {
        console.log(`\n   ${index + 1}. ${schedule.curvePattern}`);
        console.log(`      Location: ${schedule.location}`);
        console.log(`      Update Frequency: ${schedule.updateFrequency}`);
        console.log(`      Next Due: ${schedule.nextUpdateDue ? schedule.nextUpdateDue.toISOString() : 'Not set'}`);
      });
    }

    // Check raw SQL to verify schema
    console.log('\n5. Verifying database schema...');
    const result = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'curve_schedule' 
      ORDER BY table_schema;
    `;
    console.log('   Found curve_schedule in schemas:', result);

  } catch (error) {
    console.error('\n❌ Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('P1001')) {
        console.log('\n🔧 Connection Error - Possible solutions:');
        console.log('1. Ensure PostgreSQL is running');
        console.log('2. Check if port 5433 is correct (default is usually 5432)');
        console.log('3. Verify username/password');
        console.log('4. Check if the database exists');
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n🔧 Table not found - Possible solutions:');
        console.log('1. Run migrations: npx prisma migrate dev');
        console.log('2. Check if tables are in correct schema (public vs Forecasts)');
        console.log('3. Update DATABASE_URL to include correct schema');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPrismaConnection().catch(console.error); 