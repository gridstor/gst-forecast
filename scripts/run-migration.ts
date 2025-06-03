import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Try to load environment variables, fallback if dotenv not available
try {
  const { config } = await import('dotenv');
  config();
} catch (e) {
  console.log('Note: dotenv not available, using existing environment variables');
}

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.log('Please create a .env file with your DATABASE_URL');
    console.log('Current environment variables:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  console.log('Database:', connectionString.replace(/:[^:@]+@/, ':****@'));

  // More permissive SSL configuration for AWS RDS
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('rds.amazonaws.com') ? {
      rejectUnauthorized: false,
      requestCert: false
    } : false
  });

  try {
    console.log('\n📋 Starting CurveInstanceData structure update migration...');

    // Step 1: Create PValueGranularity enum
    console.log('1️⃣ Creating PValueGranularity enum...');
    await pool.query(`
      DO $$ BEGIN
          CREATE TYPE "Forecasts"."PValueGranularity" AS ENUM (
              'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY',
              'ROLLING_7D', 'ROLLING_30D', 'ROLLING_90D', 'SEASONAL'
          );
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ PValueGranularity enum created');

    // Step 2: Add pValueGranularity column
    console.log('2️⃣ Adding pValueGranularity column...');
    await pool.query(`
      ALTER TABLE "Forecasts"."PriceForecast" 
      ADD COLUMN IF NOT EXISTS "pValueGranularity" "Forecasts"."PValueGranularity" DEFAULT 'MONTHLY';
    `);
    console.log('✅ pValueGranularity column added');

    // Step 3: Add column comment
    console.log('3️⃣ Adding column comments...');
    await pool.query(`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."pValueGranularity" IS 
      'Specifies the time window over which the P-value confidence intervals (valueP90, valueP10) were calculated.';
    `);
    console.log('✅ Column comments added');

    // Step 4: Remove deprecated columns
    console.log('4️⃣ Removing deprecated valueHigh and valueLow columns...');
    await pool.query(`
      ALTER TABLE "Forecasts"."PriceForecast" 
      DROP COLUMN IF EXISTS "valueHigh";
    `);
    await pool.query(`
      ALTER TABLE "Forecasts"."PriceForecast" 
      DROP COLUMN IF EXISTS "valueLow";
    `);
    console.log('✅ Deprecated columns removed');

    // Step 5: Update P-value column comments
    console.log('5️⃣ Updating P-value column comments...');
    await pool.query(`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."valueP90" IS 
      '90th percentile value calculated over the time window specified by pValueGranularity.';
    `);
    await pool.query(`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."valueP10" IS 
      '10th percentile value calculated over the time window specified by pValueGranularity.';
    `);
    await pool.query(`
      COMMENT ON COLUMN "Forecasts"."PriceForecast"."flags" IS 
      'Array of data quality flags such as ["outlier", "holiday", "estimated"].';
    `);
    console.log('✅ P-value column comments updated');

    // Step 6: Create indexes
    console.log('6️⃣ Creating performance indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_priceforecast_pvalue_granularity" 
      ON "Forecasts"."PriceForecast" ("pValueGranularity");
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_priceforecast_instance_timestamp_granularity" 
      ON "Forecasts"."PriceForecast" ("curveInstanceId", "timestamp", "pValueGranularity");
    `);
    console.log('✅ Performance indexes created');

    // Step 7: Verification
    console.log('\n🔍 Verifying migration results...');
    
    // Check table structure
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'PriceForecast' 
        AND table_schema = 'Forecasts'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Updated table structure:');
    console.table(tableStructure.rows);

    // Check enum values
    const enumValues = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'PValueGranularity' 
            AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'Forecasts')
      )
      ORDER BY enumsortorder;
    `);
    
    console.log('\n🏷️ PValueGranularity enum values:');
    enumValues.rows.forEach(row => console.log(`  - ${row.enumlabel}`));

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('  ✅ Added pValueGranularity field with MONTHLY default');
    console.log('  ✅ Removed deprecated valueHigh and valueLow columns');
    console.log('  ✅ Added detailed column comments');
    console.log('  ✅ Created performance indexes');
    console.log('  ✅ Table now supports granular P-value confidence intervals');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration(); 