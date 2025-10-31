/**
 * Migration: Convert CurveInstance to use array fields
 * 
 * Converts curveType, commodity, scenario from single values to arrays
 * to support multiple values per instance
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Migrating CurveInstance to array fields...\n');
    
    // Step 1: Add new array columns
    console.log('   Adding new array columns...');
    await client.query(`
      ALTER TABLE "Forecasts"."CurveInstance" 
      ADD COLUMN IF NOT EXISTS "curveTypes" TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "commodities" TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "scenarios" TEXT[] DEFAULT '{}';
    `);
    console.log('   ✓ Array columns added\n');
    
    // Step 2: Migrate existing data to arrays
    console.log('   Migrating existing data...');
    await client.query(`
      UPDATE "Forecasts"."CurveInstance"
      SET 
        "curveTypes" = CASE 
          WHEN "curveType" IS NOT NULL THEN ARRAY["curveType"]::TEXT[]
          ELSE '{}'::TEXT[]
        END,
        "commodities" = CASE 
          WHEN "commodity" IS NOT NULL THEN ARRAY["commodity"]::TEXT[]
          ELSE '{}'::TEXT[]
        END,
        "scenarios" = CASE 
          WHEN "scenario" IS NOT NULL THEN ARRAY["scenario"]::TEXT[]
          ELSE '{}'::TEXT[]
        END
      WHERE "curveTypes" = '{}' OR "curveTypes" IS NULL;
    `);
    console.log('   ✓ Data migrated to arrays\n');
    
    // Step 3: Drop old columns
    console.log('   Removing old columns...');
    await client.query(`
      ALTER TABLE "Forecasts"."CurveInstance" 
      DROP COLUMN IF EXISTS "curveType",
      DROP COLUMN IF EXISTS "commodity",
      DROP COLUMN IF EXISTS "scenario";
    `);
    console.log('   ✓ Old columns removed\n');
    
    // Step 4: Create GIN indexes for array searches
    console.log('   Creating GIN indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "CurveInstance_curveTypes_gin_idx" 
        ON "Forecasts"."CurveInstance" USING GIN ("curveTypes");
      
      CREATE INDEX IF NOT EXISTS "CurveInstance_commodities_gin_idx" 
        ON "Forecasts"."CurveInstance" USING GIN ("commodities");
      
      CREATE INDEX IF NOT EXISTS "CurveInstance_scenarios_gin_idx" 
        ON "Forecasts"."CurveInstance" USING GIN ("scenarios");
    `);
    console.log('   ✓ GIN indexes created\n');
    
    // Step 5: Verify migration
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE array_length("curveTypes", 1) > 0) as with_types,
        COUNT(*) FILTER (WHERE array_length("commodities", 1) > 0) as with_commodities,
        COUNT(*) FILTER (WHERE array_length("scenarios", 1) > 0) as with_scenarios
      FROM "Forecasts"."CurveInstance";
    `);
    
    console.log('📊 Migration Results:');
    console.log(`   Total instances: ${result.rows[0].total}`);
    console.log(`   With curve types: ${result.rows[0].with_types}`);
    console.log(`   With commodities: ${result.rows[0].with_commodities}`);
    console.log(`   With scenarios: ${result.rows[0].with_scenarios}\n`);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Restart dev server');
    console.log('   3. Test multi-select in upload/inventory pages\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });


