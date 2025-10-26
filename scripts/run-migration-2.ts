// Run second migration: move granularity, scenario, degradationType to instance
// Usage: npx tsx scripts/run-migration-2.ts

import { query } from '../src/lib/db';

async function runMigration() {
  try {
    console.log('🚀 Running second migration...');
    console.log('   Moving granularity, scenario, degradationType to CurveInstance');
    console.log('---');
    
    // Step 1: Add columns
    console.log('Step 1: Adding columns to CurveInstance...');
    await query(`
      ALTER TABLE "Forecasts"."CurveInstance"
        ADD COLUMN IF NOT EXISTS "granularity" VARCHAR(20),
        ADD COLUMN IF NOT EXISTS "scenario" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "degradationType" VARCHAR(100)
    `);
    console.log('  ✅ Columns added');
    
    // Step 2: Migrate data
    console.log('Step 2: Migrating existing data...');
    const updateResult = await query(`
      UPDATE "Forecasts"."CurveInstance" ci
      SET 
        "granularity" = cd."granularity",
        "scenario" = cd."scenario",
        "degradationType" = cd."degradationType"
      FROM "Forecasts"."CurveDefinition" cd
      WHERE ci."curveDefinitionId" = cd.id
        AND ci."granularity" IS NULL
    `);
    console.log(`  ✅ Migrated ${updateResult.rowCount} instances`);
    
    // Step 3: Create new indexes
    console.log('Step 3: Creating new indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS "CurveInstance_granularity_scenario_idx" 
        ON "Forecasts"."CurveInstance"("granularity", "scenario")
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS "CurveInstance_createdAt_idx" 
        ON "Forecasts"."CurveInstance"("createdAt")
    `);
    console.log('  ✅ Indexes created');
    
    // Step 4: Drop old indexes (optional)
    console.log('Step 4: Dropping old indexes...');
    try {
      await query(`DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_granularity_idx"`);
      await query(`DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_batteryDuration_scenario_idx"`);
      console.log('  ✅ Old indexes dropped');
    } catch (e) {
      console.log('  ⚠️  Old indexes may not exist (this is okay)');
    }
    
    // Step 5: Create new simplified index
    console.log('Step 5: Creating new simplified index...');
    await query(`
      CREATE INDEX IF NOT EXISTS "CurveDefinition_batteryDuration_idx" 
        ON "Forecasts"."CurveDefinition"("batteryDuration")
    `);
    console.log('  ✅ New index created');
    
    // Verify
    console.log('Step 6: Verifying migration...');
    const verifyResult = await query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT("curveType")::int as with_type,
        COUNT("commodity")::int as with_commodity,
        COUNT("granularity")::int as with_granularity,
        COUNT("scenario")::int as with_scenario,
        COUNT("degradationType")::int as with_degradation
      FROM "Forecasts"."CurveInstance"
    `);
    
    const stats = verifyResult.rows[0];
    console.log('---');
    console.log('📊 Migration Results:');
    console.log(`  Total instances: ${stats.total}`);
    console.log(`  With curveType: ${stats.with_type}`);
    console.log(`  With commodity: ${stats.with_commodity}`);
    console.log(`  With granularity: ${stats.with_granularity}`);
    console.log(`  With scenario: ${stats.with_scenario}`);
    console.log(`  With degradationType: ${stats.with_degradation}`);
    console.log('---');
    
    if (stats.total === stats.with_granularity && 
        stats.total === stats.with_scenario &&
        stats.total === stats.with_degradation) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Run: npx prisma generate');
      console.log('  2. Restart your dev server');
      console.log('');
      console.log('Note: Old columns on CurveDefinition are preserved for safety.');
      console.log('      product, granularity, scenario, degradationType can be dropped later.');
    } else {
      throw new Error('Verification failed: Not all instances have all fields');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error);

