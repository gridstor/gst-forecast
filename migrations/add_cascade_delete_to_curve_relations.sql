-- Add CASCADE DELETE to curve relations
-- This allows deleting a CurveDefinition to automatically delete all its instances, schedules, etc.

-- 1. Fix CurveInstance -> CurveDefinition relation
ALTER TABLE "Forecasts"."CurveInstance"
DROP CONSTRAINT IF EXISTS "CurveInstance_curveDefinitionId_fkey";

ALTER TABLE "Forecasts"."CurveInstance"
ADD CONSTRAINT "CurveInstance_curveDefinitionId_fkey"
FOREIGN KEY ("curveDefinitionId") 
REFERENCES "Forecasts"."CurveDefinition"(id) 
ON DELETE CASCADE;

-- 2. Fix CurveSchedule -> CurveDefinition relation
ALTER TABLE "Forecasts"."CurveSchedule"
DROP CONSTRAINT IF EXISTS "CurveSchedule_curveDefinitionId_fkey";

ALTER TABLE "Forecasts"."CurveSchedule"
ADD CONSTRAINT "CurveSchedule_curveDefinitionId_fkey"
FOREIGN KEY ("curveDefinitionId") 
REFERENCES "Forecasts"."CurveDefinition"(id) 
ON DELETE CASCADE;

-- 3. Fix DefaultCurveInput -> CurveDefinition relation
ALTER TABLE "Forecasts"."DefaultCurveInput"
DROP CONSTRAINT IF EXISTS "DefaultCurveInput_curveDefinitionId_fkey";

ALTER TABLE "Forecasts"."DefaultCurveInput"
ADD CONSTRAINT "DefaultCurveInput_curveDefinitionId_fkey"
FOREIGN KEY ("curveDefinitionId") 
REFERENCES "Forecasts"."CurveDefinition"(id) 
ON DELETE CASCADE;

-- Verify the changes
SELECT 
    con.conname AS constraint_name,
    con.confdeltype AS delete_action,
    CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS delete_action_name
FROM pg_constraint con
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
WHERE nsp.nspname = 'Forecasts'
AND con.conrelid IN (
    '"Forecasts"."CurveInstance"'::regclass,
    '"Forecasts"."CurveSchedule"'::regclass,
    '"Forecasts"."DefaultCurveInput"'::regclass
)
AND con.contype = 'f'
AND con.conname LIKE '%curveDefinitionId%'
ORDER BY con.conname;

