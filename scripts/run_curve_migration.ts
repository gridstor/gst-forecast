import { Pool } from 'pg';
import { config } from '../src/config/database';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('Starting curve tracking migration...');
  
  const pool = new Pool(config);

  try {
    // Read migration SQL
    const sqlPath = join(__dirname, 'migrate_curve_tracking_v2.sql');
    console.log('Reading migration file from:', sqlPath);
    const sql = readFileSync(sqlPath, 'utf8');

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Run migration SQL
      console.log('Executing migration SQL...');
      await client.query(sql);

      await client.query('COMMIT');
      console.log('Migration completed successfully!');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error during transaction:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration(); 