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

