/**
 * Migration Script: Create Forecasts Schema Tables
 * 
 * This script creates all the tables needed for the new CurveDefinition/CurveInstance
 * architecture in the Forecasts schema.
 * 
 * Run with: npx tsx scripts/run-forecasts-migration.ts
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Forecasts schema migration...\n');
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'prisma', 'migrations', '20251028_create_forecasts_schema', 'migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded');
    console.log('📊 Executing migration...\n');
    
    // Execute the entire migration
    // Note: We don't use transactions for DDL in PostgreSQL as they auto-commit
    
    try {
      console.log('   Creating enums...');
      await client.query(migrationSQL);
      console.log('   ✓ All objects created\n');
      
      console.log('✅ Migration completed successfully!\n');
      
      // Verify tables were created
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'Forecasts'
        ORDER BY table_name;
      `);
      
      console.log('📋 Tables created in Forecasts schema:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      
      console.log('\n🎉 All done! You can now:');
      console.log('   1. Restart your dev server');
      console.log('   2. Create curve definitions and instances');
      console.log('   3. Create schedules and ad-hoc requests');
      console.log('   4. Both calendars will now populate correctly\n');
      
    } catch (error) {
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });

