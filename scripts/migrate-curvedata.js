// Node migration for Windows environments without psql
// Usage: node scripts/migrate-curvedata.js
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
-- Create CurveData table
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveData" (
  id                SERIAL PRIMARY KEY,
  "curveInstanceId" INT NOT NULL REFERENCES "Forecasts"."CurveInstance"(id) ON DELETE CASCADE,
  "timestamp"       TIMESTAMPTZ NOT NULL,
  "valueP5"  DOUBLE PRECISION,
  "valueP25" DOUBLE PRECISION,
  "valueP50" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "valueP75" DOUBLE PRECISION,
  "valueP95" DOUBLE PRECISION,
  flags            TEXT[] DEFAULT '{}',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='Forecasts' AND indexname='idx_curvedata_instance_timestamp') THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_curvedata_instance_timestamp ON "Forecasts"."CurveData" ("curveInstanceId","timestamp")';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='Forecasts' AND indexname='idx_curvedata_timestamp') THEN
    EXECUTE 'CREATE INDEX idx_curvedata_timestamp ON "Forecasts"."CurveData" ("timestamp")';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='Forecasts' AND indexname='idx_curvedata_instance') THEN
    EXECUTE 'CREATE INDEX idx_curvedata_instance ON "Forecasts"."CurveData" ("curveInstanceId")';
  END IF;
END $$;

-- Backfill from PriceForecast if present
INSERT INTO "Forecasts"."CurveData"
  ("curveInstanceId","timestamp","valueP5","valueP25","valueP50","valueP75","valueP95", flags, "createdAt","updatedAt")
SELECT pf."curveInstanceId", pf."timestamp",
       pf."valueP5", pf."valueP25", pf."valueP50", pf."valueP75", pf."valueP95",
       COALESCE(pf.flags, '{}'), COALESCE(pf."createdAt", NOW()), COALESCE(pf."updatedAt", NOW())
FROM "Forecasts"."PriceForecast" pf
LEFT JOIN "Forecasts"."CurveData" cd
  ON cd."curveInstanceId" = pf."curveInstanceId" AND cd."timestamp" = pf."timestamp"
WHERE cd.id IS NULL;

-- Compat view
CREATE OR REPLACE VIEW "Forecasts"."PriceForecast_compat" AS
SELECT
  cd.id,
  cd."curveInstanceId",
  cd."timestamp",
  50::INT AS pvalue,
  cd."valueP50" AS value,
  def.units,
  cd."valueP5", cd."valueP25", cd."valueP50", cd."valueP75", cd."valueP95",
  cd.flags, cd."createdAt", cd."updatedAt"
FROM "Forecasts"."CurveData" cd
JOIN "Forecasts"."CurveInstance" ci ON ci.id = cd."curveInstanceId"
JOIN "Forecasts"."CurveDefinition" def ON def.id = ci."curveDefinitionId";
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
    console.log('Running CurveData migration...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('CurveData migration completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();


