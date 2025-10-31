-- Migration: Move curveType and commodity from CurveDefinition to CurveInstance
-- This allows a single curve definition (e.g., "SP15 Gridstor Optimized Revenue")
-- to have multiple instances with different curve types (total revenue, energy arb, AS)

-- Step 1: Add new columns to CurveInstance
ALTER TABLE "Forecasts"."CurveInstance"
  ADD COLUMN IF NOT EXISTS "curveType" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "commodity" VARCHAR(50);

-- Step 2: Migrate existing data from CurveDefinition to CurveInstance
-- Copy curveType and commodity values to all existing instances
UPDATE "Forecasts"."CurveInstance" ci
SET 
  "curveType" = cd."curveType",
  "commodity" = cd."commodity"
FROM "Forecasts"."CurveDefinition" cd
WHERE ci."curveDefinitionId" = cd.id
  AND ci."curveType" IS NULL;  -- Only update if not already set

-- Step 3: Create index for efficient filtering
CREATE INDEX IF NOT EXISTS "CurveInstance_curveType_commodity_idx" 
  ON "Forecasts"."CurveInstance"("curveType", "commodity");

-- Step 4: Drop old index that referenced curveType in CurveDefinition
DROP INDEX IF EXISTS "Forecasts"."CurveDefinition_curveType_batteryDuration_scenario_idx";

-- Step 5: Create new index without curveType
CREATE INDEX IF NOT EXISTS "CurveDefinition_batteryDuration_scenario_idx" 
  ON "Forecasts"."CurveDefinition"("batteryDuration", "scenario");

-- Step 6: OPTIONAL - Remove curveType and commodity from CurveDefinition
-- UNCOMMENT THESE LINES AFTER VERIFYING DATA MIGRATION IS SUCCESSFUL
-- ALTER TABLE "Forecasts"."CurveDefinition" 
--   DROP COLUMN IF EXISTS "curveType",
--   DROP COLUMN IF EXISTS "commodity";

-- Migration Notes:
-- - CurveDefinition now describes the general curve (market, location, product)
-- - CurveInstance specifies the specific type (curveType) and commodity
-- - This allows uploading multiple related curves (e.g., total revenue + energy arb + AS)
--   under a single definition like "SP15 Gridstor Optimized Revenue"
-- - Existing data is preserved and migrated to the new structure
-- - The old columns are NOT dropped automatically for safety - drop them manually after verification

