// Run curve schema migration using Prisma's existing db connection
// Usage: npx tsx scripts/run-migration-prisma.ts

import { query } from '../src/lib/db';

async function runMigration() {
  try {
    console.log('🔌 Running migration using existing database connection...');
    console.log('---');
    
    // Step 1: Add columns
    console.log('Step 1: Adding columns to CurveInstance...');
    await query(`
      ALTER TABLE "Forecasts"."CurveInstance"
        ADD COLUMN IF NOT EXISTS "curveType" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "commodity" VARCHAR(50)
    `);
    console.log('  ✅ Columns added');
    
    // Step 2: Migrate data
    console.log('Step 2: Migrating existing data...');
    const updateResult = await query(`
      UPDATE "Forecasts"."CurveInstance" ci
      SET 
        "curveType" = cd."curveType",
        "commodity" = cd."commodity"
      FROM "Forecasts"."CurveDefinition" cd
      WHERE ci."curveDefinitionId" = cd.id
        AND ci."curveType" IS NULL
    `);
    console.log(`  ✅ Updated ${updateResult.rowCount} instances`);
    
    // Step 3: Create new index
    console.log('Step 3: Creating new index...');
    await query(`
      CREATE INDEX IF NOT EXISTS "CurveInstance_curveType_commodity_idx" 
        ON "Forecasts"."CurveInstance"("curveType", "commodity")
    `);
    console.log('  ✅ Index created');
    
    // Step 4: Drop old index
    console.log('Step 4: Dropping old index...');
    await query(`
      DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_curveType_batteryDuration_scenario_idx"
    `);
    console.log('  ✅ Old index dropped');
    
    // Step 5: Create updated index
    console.log('Step 5: Creating updated index...');
    await query(`
      CREATE INDEX IF NOT EXISTS "CurveDefinition_batteryDuration_scenario_idx" 
        ON "Forecasts"."CurveDefinition"("batteryDuration", "scenario")
    `);
    console.log('  ✅ New index created');
    
    // Verify
    console.log('Step 6: Verifying migration...');
    const verifyResult = await query(`
      SELECT 
        COUNT(*)::int as total_instances,
        COUNT("curveType")::int as instances_with_type,
        COUNT("commodity")::int as instances_with_commodity
      FROM "Forecasts"."CurveInstance"
    `);
    
    const stats = verifyResult.rows[0];
    console.log('---');
    console.log('📊 Migration Results:');
    console.log(`  Total instances: ${stats.total_instances}`);
    console.log(`  Instances with curveType: ${stats.instances_with_type}`);
    console.log(`  Instances with commodity: ${stats.instances_with_commodity}`);
    console.log('---');
    
    if (stats.total_instances === stats.instances_with_type && 
        stats.total_instances === stats.instances_with_commodity) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Run: npx prisma generate');
      console.log('  2. Restart your dev server (Ctrl+C then npm run dev)');
      console.log('');
      console.log('Note: Old columns on CurveDefinition are preserved for safety.');
      console.log('      You can drop them manually after verifying everything works.');
    } else {
      throw new Error('Verification failed: Not all instances have curveType and commodity');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error);

