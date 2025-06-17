import { Pool } from 'pg';
import { config } from '../src/config/database';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runDeliveryMigration() {
  console.log('🚀 Starting delivery management system migration...');
  console.log('This will create the delivery management tables and migrate existing data.\n');
  
  const pool = new Pool(config);

  try {
    // Read migration SQL
    const sqlPath = join(__dirname, 'migrate_to_delivery_management.sql');
    console.log('📖 Reading migration file from:', sqlPath);
    const sql = readFileSync(sqlPath, 'utf8');

    // Begin transaction
    const client = await pool.connect();
    try {
      console.log('🔄 Starting database transaction...');
      await client.query('BEGIN');

      // Run migration SQL
      console.log('⚡ Executing delivery management migration...');
      await client.query(sql);

      await client.query('COMMIT');
      console.log('✅ Migration completed successfully!\n');
      
      console.log('📊 What was created:');
      console.log('  • CurveDeliveryRequest table (tracks delivery commitments)');
      console.log('  • CurveDeliverySpec table (delivery specifications)');
      console.log('  • DeliveryStatus enum (REQUESTED, IN_PROGRESS, DELIVERED, CANCELLED)');
      console.log('  • Delivery management view for dashboard');
      console.log('  • Required indexes for performance');
      console.log('  • Migration of existing schedule data\n');
      
      console.log('🎉 Delivery management system is now ready!');
      console.log('   You can now visit: http://localhost:4323/curve-schedule/manage');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error during transaction:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n🔧 Possible solutions:');
        console.log('1. Ensure the base energy forecast schema is set up first');
        console.log('2. Run: npm run prisma:migrate');
        console.log('3. Check if CurveDefinition and CurveInstance tables exist');
      }
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runDeliveryMigration(); 