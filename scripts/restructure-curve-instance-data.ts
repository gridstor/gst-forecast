import { PrismaClient } from '@prisma/client';

async function restructureCurveInstanceData() {
  console.log('🔗 Connecting to database via Prisma...');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected to AWS RDS successfully!');
    
    console.log('\n📋 Starting CurveInstanceData table restructure...');

    // Step 1: Create backup of existing data (if any)
    console.log('1️⃣ Creating backup of existing PriceForecast data...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Forecasts"."PriceForecast_backup" AS 
      SELECT * FROM "Forecasts"."PriceForecast";
    `;
    console.log('✅ Backup created');

    // Step 2: Drop existing table to recreate with new structure
    console.log('2️⃣ Dropping existing PriceForecast table...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Forecasts"."PriceForecast" CASCADE;`;
    console.log('✅ Table dropped');

    // Step 3: Create Granularity enum if not exists
    console.log('3️⃣ Creating Granularity enum...');
    await prisma.$executeRaw`
      DO $$ BEGIN
          CREATE TYPE "Forecasts"."Granularity" AS ENUM (
              'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'
          );
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✅ Granularity enum created');

    // Step 4: Create new CurveInstanceData table structure
    console.log('4️⃣ Creating new CurveInstanceData table structure...');
    await prisma.$executeRaw`
      CREATE TABLE "Forecasts"."PriceForecast" (
          "id" SERIAL PRIMARY KEY,
          "curveInstanceId" INTEGER NOT NULL,
          "timestamp" TIMESTAMPTZ NOT NULL,
          "pvalue" INTEGER NOT NULL,
          "value" DOUBLE PRECISION NOT NULL,
          "units" VARCHAR(50) NOT NULL DEFAULT '$/MWh',
          "pValueGranularity" "Forecasts"."PValueGranularity" NOT NULL DEFAULT 'MONTHLY',
          "granularity" "Forecasts"."Granularity" NOT NULL DEFAULT 'HOURLY',
          "flags" TEXT[] DEFAULT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ New table structure created');

    // Step 5: Add foreign key constraint
    console.log('5️⃣ Adding foreign key constraint...');
    await prisma.$executeRaw`
      ALTER TABLE "Forecasts"."PriceForecast" 
      ADD CONSTRAINT "fk_priceforecast_curveinstance" 
      FOREIGN KEY ("curveInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE;
    `;
    console.log('✅ Foreign key constraint added');

    // Step 6: Add comments to columns
    console.log('6️⃣ Adding column comments...');
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."curveInstanceId" IS 'Links to the specific CurveInstance that contains this data point';
    `;
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."timestamp" IS 'The specific date and time this forecast value represents';
    `;
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."pvalue" IS 'The percentile value (e.g., 10, 50, 90) - allows flexible storage of any percentile';
    `;
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."value" IS 'The forecasted price/value at this timestamp and percentile';
    `;
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."units" IS 'Units of measurement for the value (e.g., $/MWh, MW, MWh)';
    `;
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."pValueGranularity" IS 'Time window over which the percentile was calculated';
    `;
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."granularity" IS 'Time resolution of this data point (from CurveInstance for verification)';
    `;
    await prisma.$executeRaw`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."flags" IS 'Data quality flags: ["outlier", "holiday", "estimated", "peak_hour"]';
    `;
    console.log('✅ Column comments added');

    // Step 7: Create performance indexes
    console.log('7️⃣ Creating performance indexes...');
    await prisma.$executeRaw`
      CREATE INDEX "idx_priceforecast_instance_timestamp" 
      ON "Forecasts"."PriceForecast" ("curveInstanceId", "timestamp");
    `;
    await prisma.$executeRaw`
      CREATE INDEX "idx_priceforecast_pvalue_granularity" 
      ON "Forecasts"."PriceForecast" ("pvalue", "pValueGranularity");
    `;
    await prisma.$executeRaw`
      CREATE INDEX "idx_priceforecast_timestamp_pvalue" 
      ON "Forecasts"."PriceForecast" ("timestamp", "pvalue");
    `;
    console.log('✅ Performance indexes created');

    // Step 8: Insert sample data to demonstrate structure (only if CurveInstance exists)
    console.log('8️⃣ Inserting sample data...');
    
    // Check if any CurveInstance records exist
    const instanceCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Forecasts"."CurveInstance";
    `;
    
    const count = (instanceCount as any[])[0]?.count || 0;
    
    if (count > 0) {
      // Get the first available CurveInstance ID
      const firstInstance = await prisma.$queryRaw`
        SELECT id FROM "Forecasts"."CurveInstance" ORDER BY id LIMIT 1;
      `;
      
      const instanceId = (firstInstance as any[])[0]?.id;
      
      if (instanceId) {
        await prisma.$executeRaw`
          INSERT INTO "Forecasts"."PriceForecast" 
          ("curveInstanceId", "timestamp", "pvalue", "value", "units", "pValueGranularity", "granularity", "flags")
          VALUES 
          (${instanceId}, '2025-01-01 00:00:00+00', 10, 42.50, '$/MWh', 'MONTHLY', 'HOURLY', '{"bearish"}'),
          (${instanceId}, '2025-01-01 00:00:00+00', 50, 48.75, '$/MWh', 'MONTHLY', 'HOURLY', NULL),
          (${instanceId}, '2025-01-01 00:00:00+00', 90, 55.20, '$/MWh', 'MONTHLY', 'HOURLY', '{"bullish"}'),
          (${instanceId}, '2025-01-01 01:00:00+00', 10, 38.90, '$/MWh', 'MONTHLY', 'HOURLY', NULL),
          (${instanceId}, '2025-01-01 01:00:00+00', 50, 44.25, '$/MWh', 'MONTHLY', 'HOURLY', NULL),
          (${instanceId}, '2025-01-01 01:00:00+00', 90, 51.80, '$/MWh', 'MONTHLY', 'HOURLY', NULL)
          ON CONFLICT DO NOTHING;
        `;
        console.log(`✅ Sample data inserted using CurveInstance ID ${instanceId}`);
      } else {
        console.log('⚠️ No valid CurveInstance found, skipping sample data');
      }
    } else {
      console.log('⚠️ No CurveInstance records exist, skipping sample data insertion');
      console.log('   You can create sample data after creating CurveInstance records');
    }

    // Step 9: Verification
    console.log('\n🔍 Verifying new table structure...');
    
    // Check table structure
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'PriceForecast' 
        AND table_schema = 'Forecasts'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📊 New table structure:');
    console.table(tableStructure);

    // Show sample data
    const sampleData = await prisma.$queryRaw`
      SELECT "curveInstanceId", "timestamp", "pvalue", "value", "units", "pValueGranularity", "granularity", "flags"
      FROM "Forecasts"."PriceForecast" 
      ORDER BY "timestamp", "pvalue" 
      LIMIT 6;
    `;
    
    console.log('\n📋 Sample data structure:');
    console.table(sampleData);

    console.log('\n🎉 CurveInstanceData restructure completed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('  ✅ Restructured table with flexible pvalue field');
    console.log('  ✅ Added units field for value measurement');
    console.log('  ✅ Added granularity field (duplicated from CurveInstance for verification)');
    console.log('  ✅ Flexible percentile storage (any pvalue: 10, 50, 90, 95, etc.)');
    console.log('  ✅ Multiple rows per timestamp for different percentiles');
    console.log('  ✅ Performance indexes for efficient querying');
    console.log('  ✅ Sample data shows structure with P10, P50, P90 for same timestamp');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
restructureCurveInstanceData(); 