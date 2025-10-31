-- ========================================
-- ADD CASCADE DELETE TO CURVE RELATIONS
-- ========================================
-- This enables deleting curve definitions to automatically
-- delete all instances, schedules, and related data
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


-- VERIFY IT WORKED
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

