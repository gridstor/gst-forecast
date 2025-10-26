-- Migration: Move granularity, scenario, degradationType to CurveInstance
--            Remove product from CurveDefinition
-- This provides maximum flexibility - each instance can have different settings

BEGIN;

-- Step 1: Add columns to CurveInstance (if they don't already exist)
ALTER TABLE "Forecasts"."CurveInstance"
  ADD COLUMN IF NOT EXISTS "granularity" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "scenario" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "degradationType" VARCHAR(100);

-- Step 2: Migrate existing data from CurveDefinition to CurveInstance
-- Copy granularity, scenario, degradationType values to all existing instances
UPDATE "Forecasts"."CurveInstance" ci
SET 
  "granularity" = cd."granularity",
  "scenario" = cd."scenario",
  "degradationType" = cd."degradationType"
FROM "Forecasts"."CurveDefinition" cd
WHERE ci."curveDefinitionId" = cd.id
  AND ci."granularity" IS NULL;  -- Only update if not already set

-- Step 3: Create new indexes for efficient filtering
CREATE INDEX IF NOT EXISTS "CurveInstance_granularity_scenario_idx" 
  ON "Forecasts"."CurveInstance"("granularity", "scenario");

CREATE INDEX IF NOT EXISTS "CurveInstance_createdAt_idx" 
  ON "Forecasts"."CurveInstance"("createdAt");

-- Step 4: Drop old indexes from CurveDefinition
DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_granularity_idx";
DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_batteryDuration_scenario_idx";

-- Step 5: Create new simplified index on CurveDefinition
CREATE INDEX IF NOT EXISTS "CurveDefinition_batteryDuration_idx" 
  ON "Forecasts"."CurveDefinition"("batteryDuration");

-- Verify the migration
SELECT 
  COUNT(*)::int as total_instances,
  COUNT("curveType")::int as with_type,
  COUNT("commodity")::int as with_commodity,
  COUNT("granularity")::int as with_granularity,
  COUNT("scenario")::int as with_scenario,
  COUNT("degradationType")::int as with_degradation
FROM "Forecasts"."CurveInstance";

COMMIT;

-- Migration Notes:
-- ✅ granularity, scenario, degradationType moved to CurveInstance
-- ✅ Existing data preserved and migrated
-- ✅ Indexes updated for optimal performance
-- ⚠️  Old columns on CurveDefinition NOT dropped (drop manually after verification):
--    - granularity
--    - scenario
--    - degradationType
--    - product (if you want to remove it)
-- 
-- Benefits:
-- - Single definition: "SP15 Battery Revenue"
-- - Multiple instances with different:
--   * curveType: "Revenue Forecast" vs "Price Forecast"
--   * commodity: "Total Revenue" vs "EA Revenue" vs "AS Revenue"
--   * granularity: "MONTHLY" vs "QUARTERLY" vs "ANNUAL"
--   * scenario: "BASE" vs "HIGH" vs "LOW"
--   * degradationType: "NONE" vs "YEAR_5" vs "YEAR_10"

