-- ========================================
-- FIX CURVE DEFINITION CONSTRAINTS
-- ========================================
-- Run this SQL to enable:
-- 1. Renaming curves (allows duplicate names across different markets/locations)
-- 2. Deleting curves (cascade deletes instances, schedules, data)
--
-- SAFE TO RUN: Will not lose any existing data
-- ========================================

-- PART 1: Update unique constraint to allow duplicate names across markets
-- ========================================

-- Drop old unique constraint (name only)
ALTER TABLE "Forecasts"."CurveDefinition" 
DROP CONSTRAINT IF EXISTS "CurveDefinition_curveName_key";

-- Add new composite unique constraint (name + market + location)
-- This allows "SP15_4H" to exist in both CAISO and ERCOT
ALTER TABLE "Forecasts"."CurveDefinition"
ADD CONSTRAINT "CurveDefinition_curveName_market_location_key" 
UNIQUE ("curveName", "market", "location");


-- PART 2: Add CASCADE DELETE to all curve relations
-- ========================================

-- Fix CurveInstance -> CurveDefinition (cascade instances when definition deleted)
ALTER TABLE "Forecasts"."CurveInstance"
DROP CONSTRAINT IF EXISTS "CurveInstance_curveDefinitionId_fkey";

ALTER TABLE "Forecasts"."CurveInstance"
ADD CONSTRAINT "CurveInstance_curveDefinitionId_fkey"
FOREIGN KEY ("curveDefinitionId") 
REFERENCES "Forecasts"."CurveDefinition"(id) 
ON DELETE CASCADE;


-- Fix CurveSchedule -> CurveDefinition (cascade schedules when definition deleted)
ALTER TABLE "Forecasts"."CurveSchedule"
DROP CONSTRAINT IF EXISTS "CurveSchedule_curveDefinitionId_fkey";

ALTER TABLE "Forecasts"."CurveSchedule"
ADD CONSTRAINT "CurveSchedule_curveDefinitionId_fkey"
FOREIGN KEY ("curveDefinitionId") 
REFERENCES "Forecasts"."CurveDefinition"(id) 
ON DELETE CASCADE;


-- Fix DefaultCurveInput -> CurveDefinition (cascade inputs when definition deleted)
ALTER TABLE "Forecasts"."DefaultCurveInput"
DROP CONSTRAINT IF EXISTS "DefaultCurveInput_curveDefinitionId_fkey";

ALTER TABLE "Forecasts"."DefaultCurveInput"
ADD CONSTRAINT "DefaultCurveInput_curveDefinitionId_fkey"
FOREIGN KEY ("curveDefinitionId") 
REFERENCES "Forecasts"."CurveDefinition"(id) 
ON DELETE CASCADE;


-- VERIFICATION QUERIES
-- ========================================

-- Verify unique constraint is correct
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'Forecasts'
AND conrelid = '"Forecasts"."CurveDefinition"'::regclass
AND contype = 'u'
ORDER BY conname;

-- Verify CASCADE deletes are set
SELECT 
    con.conname AS constraint_name,
    rel.relname AS table_name,
    CASE con.confdeltype
        WHEN 'c' THEN '✓ CASCADE'
        WHEN 'a' THEN '✗ NO ACTION'
        WHEN 'r' THEN '✗ RESTRICT'
        ELSE con.confdeltype::text
    END AS delete_action
FROM pg_constraint con
JOIN pg_class rel ON con.conrelid = rel.oid
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
WHERE nsp.nspname = 'Forecasts'
AND con.conrelid IN (
    '"Forecasts"."CurveInstance"'::regclass,
    '"Forecasts"."CurveSchedule"'::regclass,
    '"Forecasts"."DefaultCurveInput"'::regclass
)
AND con.contype = 'f'
AND con.conname LIKE '%curveDefinitionId%'
ORDER BY rel.relname, con.conname;

-- Check for any duplicate curve names that would violate new constraint
SELECT 
    "curveName", 
    "market", 
    "location", 
    COUNT(*) as count,
    array_agg(id) as ids
FROM "Forecasts"."CurveDefinition"
GROUP BY "curveName", "market", "location"
HAVING COUNT(*) > 1;

-- ========================================
-- DONE! After running this SQL:
-- 1. Restart your dev server (stop and start npm run dev)
-- 2. Try renaming a curve - should work now!
-- 3. Try deleting a curve - should work now!
-- ========================================

