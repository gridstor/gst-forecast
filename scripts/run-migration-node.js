// Run curve schema migration using Node.js
// Usage: node scripts/run-migration-node.js

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || 
  'postgresql://brett_rudder:XYGyCEdpGqehNPn@gridstor-dev.cxoowsyptaww.us-east-2.rds.amazonaws.com:5432/analytics_workspace?schema=Forecasts&sslmode=require';

async function runMigration() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'run-curve-migration.sql'),
      'utf8'
    );
    
    // Remove psql-specific commands
    const cleanSQL = migrationSQL
      .replace(/\\echo.*/g, '')
      .trim();
    
    console.log('📝 Running migration...');
    console.log('---');
    
    // Execute migration
    await client.query('BEGIN');
    
    // Step 1: Add columns
    console.log('Step 1: Adding columns to CurveInstance...');
    await client.query(`
      ALTER TABLE "Forecasts"."CurveInstance"
        ADD COLUMN IF NOT EXISTS "curveType" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "commodity" VARCHAR(50)
    `);
    
    // Step 2: Migrate data
    console.log('Step 2: Migrating existing data...');
    const updateResult = await client.query(`
      UPDATE "Forecasts"."CurveInstance" ci
      SET 
        "curveType" = cd."curveType",
        "commodity" = cd."commodity"
      FROM "Forecasts"."CurveDefinition" cd
      WHERE ci."curveDefinitionId" = cd.id
        AND ci."curveType" IS NULL
    `);
    console.log(`  → Updated ${updateResult.rowCount} instances`);
    
    // Step 3: Create new index
    console.log('Step 3: Creating new index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "CurveInstance_curveType_commodity_idx" 
        ON "Forecasts"."CurveInstance"("curveType", "commodity")
    `);
    
    // Step 4: Drop old index
    console.log('Step 4: Dropping old index...');
    await client.query(`
      DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_curveType_batteryDuration_scenario_idx"
    `);
    
    // Step 5: Create updated index
    console.log('Step 5: Creating updated index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "CurveDefinition_batteryDuration_scenario_idx" 
        ON "Forecasts"."CurveDefinition"("batteryDuration", "scenario")
    `);
    
    // Verify
    console.log('Step 6: Verifying migration...');
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_instances,
        COUNT("curveType") as instances_with_type,
        COUNT("commodity") as instances_with_commodity
      FROM "Forecasts"."CurveInstance"
    `);
    
    const stats = verifyResult.rows[0];
    console.log('---');
    console.log('📊 Migration Results:');
    console.log(`  Total instances: ${stats.total_instances}`);
    console.log(`  Instances with curveType: ${stats.instances_with_type}`);
    console.log(`  Instances with commodity: ${stats.instances_with_commodity}`);
    
    if (stats.total_instances === stats.instances_with_type && 
        stats.total_instances === stats.instances_with_commodity) {
      await client.query('COMMIT');
      console.log('---');
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Run: npx prisma generate');
      console.log('  2. Restart your dev server: npm run dev');
      console.log('');
      console.log('Note: Old columns on CurveDefinition are preserved for safety.');
      console.log('      You can drop them manually after verifying everything works.');
    } else {
      throw new Error('Verification failed: Not all instances have curveType and commodity');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('   Transaction has been rolled back.');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);

