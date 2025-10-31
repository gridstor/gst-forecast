// Node migration for Windows environments without psql
// Usage: node scripts/add-kw-month-unit.js
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import process from 'process';

// Minimal .env loader for Windows shells
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.trim().startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  }
} catch {}

const sql = `
-- Migration: Add $/kW-month unit to CurveDefinition
-- Date: 2025-10-21
-- Description: Adds '$/kW-month' to the allowed units in the chk_units constraint

BEGIN;

-- Drop the existing constraint
ALTER TABLE "Forecasts"."CurveDefinition" 
DROP CONSTRAINT IF EXISTS chk_units;

-- Add the new constraint with the additional unit
ALTER TABLE "Forecasts"."CurveDefinition"
ADD CONSTRAINT chk_units CHECK (units IN (
  '$/MWh', 
  '$', 
  '$/MW-yr', 
  '$/MW-mo', 
  '$/MW-day', 
  '$/kW-month',
  'MW', 
  'MWh'
));

COMMIT;
`;

async function main() {
  const raw = process.argv[2] || process.env.DATABASE_URL;
  const conn = raw ? raw.replace(/^['"]|['"]$/g, '') : raw; // strip surrounding quotes
  if (!conn) {
    console.error('DATABASE_URL not found. Pass as first arg or set in .env');
    process.exit(1);
  }
  console.log('Connecting with URL prefix:', conn.slice(0, 24));
  const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    console.log('Running migration to add $/kW-month unit...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✓ Migration completed successfully!');
    console.log('✓ Added $/kW-month to allowed units in CurveDefinition table');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();

