-- Migration: Allow duplicate curve names across different markets/locations
-- Changes unique constraint from (curveName) to (curveName, market, location)
-- 
-- This allows you to:
-- ✅ Have "SP15_4H" in both CAISO and ERCOT
-- ✅ Rename curves freely within the same market/location
-- ❌ Have duplicate (name + market + location) combinations

-- Step 1: Drop the old unique constraint on curveName
ALTER TABLE "Forecasts"."CurveDefinition" 
DROP CONSTRAINT IF EXISTS "CurveDefinition_curveName_key";

-- Step 2: Add new composite unique constraint
ALTER TABLE "Forecasts"."CurveDefinition"
ADD CONSTRAINT "CurveDefinition_curveName_market_location_key" 
UNIQUE ("curveName", "market", "location");

-- Verify the changes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'Forecasts'
AND conrelid = '"Forecasts"."CurveDefinition"'::regclass
AND contype = 'u';

-- Test: Check for any existing duplicates that would violate the new constraint
SELECT 
    "curveName", 
    "market", 
    "location", 
    COUNT(*) as count
FROM "Forecasts"."CurveDefinition"
GROUP BY "curveName", "market", "location"
HAVING COUNT(*) > 1;

-- If the above query returns any rows, you have duplicates that need to be merged first!

