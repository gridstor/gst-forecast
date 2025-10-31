/**
 * Migration: Restructure CurveData table
 * 
 * Converts from wide P-value format to tall format with curveType/commodity/scenario columns
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
    console.log('🔄 Restructuring CurveData table...\n');
    
    // Step 1: Rename old table as backup
    console.log('   Creating backup of existing data...');
    await client.query(`
      DROP TABLE IF EXISTS "Forecasts"."CurveData_Backup_PValues";
      CREATE TABLE "Forecasts"."CurveData_Backup_PValues" AS 
      SELECT * FROM "Forecasts"."CurveData";
    `);
    console.log('   ✓ Backup created\n');
    
    // Step 2: Drop old table
    console.log('   Dropping old CurveData table...');
    await client.query('DROP TABLE "Forecasts"."CurveData" CASCADE;');
    console.log('   ✓ Old table dropped\n');
    
    // Step 3: Create new structure
    console.log('   Creating new CurveData table...');
    await client.query(`
      CREATE TABLE "Forecasts"."CurveData" (
        "id" SERIAL PRIMARY KEY,
        "curveInstanceId" INTEGER NOT NULL,
        "timestamp" TIMESTAMPTZ(6) NOT NULL,
        "value" DOUBLE PRECISION NOT NULL,
        "curveType" VARCHAR(100) NOT NULL,
        "commodity" VARCHAR(100) NOT NULL,
        "scenario" VARCHAR(100) NOT NULL,
        "units" VARCHAR(50),
        "flags" TEXT[] DEFAULT '{}',
        "metadata" JSONB,
        "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CurveData_curveInstanceId_fkey" 
          FOREIGN KEY ("curveInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE
      );
    `);
    console.log('   ✓ New table created\n');
    
    // Step 4: Create indexes
    console.log('   Creating indexes...');
    await client.query(`
      CREATE INDEX "CurveData_curveInstanceId_idx" ON "Forecasts"."CurveData"("curveInstanceId");
      CREATE INDEX "CurveData_timestamp_idx" ON "Forecasts"."CurveData"("timestamp");
      CREATE INDEX "CurveData_curveInstanceId_timestamp_idx" ON "Forecasts"."CurveData"("curveInstanceId", "timestamp");
      CREATE INDEX "CurveData_curveType_idx" ON "Forecasts"."CurveData"("curveType");
      CREATE INDEX "CurveData_commodity_idx" ON "Forecasts"."CurveData"("commodity");
      CREATE INDEX "CurveData_scenario_idx" ON "Forecasts"."CurveData"("scenario");
      CREATE INDEX "CurveData_combination_idx" ON "Forecasts"."CurveData"("curveInstanceId", "curveType", "commodity", "scenario");
    `);
    console.log('   ✓ Indexes created\n');
    
    // Step 5: Migrate old data if any exists
    console.log('   Checking for data to migrate...');
    const oldData = await client.query('SELECT COUNT(*) FROM "Forecasts"."CurveData_Backup_PValues"');
    const count = parseInt(oldData.rows[0].count);
    
    if (count > 0) {
      console.log(`   Found ${count} old records - converting format...`);
      
      // Convert old wide format to new tall format
      // This gets the instance info and unpivots the P-values
      await client.query(`
        INSERT INTO "Forecasts"."CurveData" 
          ("curveInstanceId", "timestamp", "value", "curveType", "commodity", "scenario", "units", "createdAt")
        SELECT 
          cd."curveInstanceId",
          cd."timestamp",
          cd."valueP50" as value,
          COALESCE(ci."curveTypes"[1], 'Unknown') as "curveType",
          COALESCE(ci."commodities"[1], 'Unknown') as "commodity",
          COALESCE(ci."scenarios"[1], 'BASE') as "scenario",
          def.units,
          cd."createdAt"
        FROM "Forecasts"."CurveData_Backup_PValues" cd
        JOIN "Forecasts"."CurveInstance" ci ON cd."curveInstanceId" = ci.id
        JOIN "Forecasts"."CurveDefinition" def ON ci."curveDefinitionId" = def.id
        WHERE cd."valueP50" IS NOT NULL;
      `);
      
      console.log('   ✓ Data migrated (using P50 values)\n');
    } else {
      console.log('   No old data to migrate\n');
    }
    
    // Step 6: Verify
    const result = await client.query(`
      SELECT COUNT(*) as total
      FROM "Forecasts"."CurveData";
    `);
    
    console.log('📊 Migration Results:');
    console.log(`   New CurveData records: ${result.rows[0].total}\n`);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Restart dev server');
    console.log('   3. Upload CSV with new format (no P-values)\n');
    
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


