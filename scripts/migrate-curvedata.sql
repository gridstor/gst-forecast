-- Forecasts schema migration: introduce CurveData and backfill from PriceForecast
-- Safe to run multiple times; uses IF NOT EXISTS guards.

-- 1) Create new wide P-value table
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

-- 2) Indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='Forecasts' AND indexname='idx_curvedata_instance_timestamp') THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_curvedata_instance_timestamp
             ON "Forecasts"."CurveData" ("curveInstanceId","timestamp")';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='Forecasts' AND indexname='idx_curvedata_timestamp') THEN
    EXECUTE 'CREATE INDEX idx_curvedata_timestamp
             ON "Forecasts"."CurveData" ("timestamp")';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='Forecasts' AND indexname='idx_curvedata_instance') THEN
    EXECUTE 'CREATE INDEX idx_curvedata_instance
             ON "Forecasts"."CurveData" ("curveInstanceId")';
  END IF;
END $$;

-- 3) Backfill from PriceForecast into CurveData
INSERT INTO "Forecasts"."CurveData"
  ("curveInstanceId","timestamp","valueP5","valueP25","valueP50","valueP75","valueP95", flags, "createdAt","updatedAt")
SELECT pf."curveInstanceId", pf."timestamp",
       pf."valueP5", pf."valueP25", pf."valueP50", pf."valueP75", pf."valueP95",
       COALESCE(pf.flags, '{}'), COALESCE(pf."createdAt", NOW()), COALESCE(pf."updatedAt", NOW())
FROM "Forecasts"."PriceForecast" pf
LEFT JOIN "Forecasts"."CurveData" cd
  ON cd."curveInstanceId" = pf."curveInstanceId" AND cd."timestamp" = pf."timestamp"
WHERE cd.id IS NULL; -- avoid duplicates if re-run

-- 4) Compatibility view for old shape
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


