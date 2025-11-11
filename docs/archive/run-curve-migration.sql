-- Migration: Move curveType and commodity from CurveDefinition to CurveInstance
-- Run this with: psql $DATABASE_URL -f scripts/run-curve-migration.sql

BEGIN;

-- Step 1: Add new columns to CurveInstance
ALTER TABLE "Forecasts"."CurveInstance"
  ADD COLUMN IF NOT EXISTS "curveType" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "commodity" VARCHAR(50);

-- Step 2: Migrate existing data from CurveDefinition to CurveInstance
UPDATE "Forecasts"."CurveInstance" ci
SET 
  "curveType" = cd."curveType",
  "commodity" = cd."commodity"
FROM "Forecasts"."CurveDefinition" cd
WHERE ci."curveDefinitionId" = cd.id
  AND ci."curveType" IS NULL;

-- Step 3: Create index for efficient filtering
CREATE INDEX IF NOT EXISTS "CurveInstance_curveType_commodity_idx" 
  ON "Forecasts"."CurveInstance"("curveType", "commodity");

-- Step 4: Drop old index that referenced curveType in CurveDefinition
DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_curveType_batteryDuration_scenario_idx";

-- Step 5: Create new index without curveType
CREATE INDEX IF NOT EXISTS "CurveDefinition_batteryDuration_scenario_idx" 
  ON "Forecasts"."CurveDefinition"("batteryDuration", "scenario");

-- Verify the migration
SELECT 
  COUNT(*) as total_instances,
  COUNT("curveType") as instances_with_type,
  COUNT("commodity") as instances_with_commodity
FROM "Forecasts"."CurveInstance";

COMMIT;

-- Success message
\echo '✅ Migration completed successfully!'
\echo 'Note: Old curveType and commodity columns still exist on CurveDefinition for safety.'
\echo 'You can drop them manually after verifying everything works.'

