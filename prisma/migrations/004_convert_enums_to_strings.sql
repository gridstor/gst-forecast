-- Migration: Convert CurveType, BatteryDuration, ScenarioType, and DegradationType from enums to strings
-- This allows users to enter custom values while maintaining existing data

-- Step 1: Add new string columns
ALTER TABLE "Forecasts"."CurveDefinition" 
  ADD COLUMN IF NOT EXISTS "curveType_new" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "batteryDuration_new" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "scenario_new" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "degradationType_new" VARCHAR(100);

-- Step 2: Copy data from enum columns to string columns
UPDATE "Forecasts"."CurveDefinition"
SET 
  "curveType_new" = "curveType"::text,
  "batteryDuration_new" = "batteryDuration"::text,
  "scenario_new" = "scenario"::text,
  "degradationType_new" = "degradationType"::text;

-- Step 3: Drop old enum columns
ALTER TABLE "Forecasts"."CurveDefinition"
  DROP COLUMN IF EXISTS "curveType",
  DROP COLUMN IF EXISTS "batteryDuration",
  DROP COLUMN IF EXISTS "scenario",
  DROP COLUMN IF EXISTS "degradationType";

-- Step 4: Rename new columns to original names
ALTER TABLE "Forecasts"."CurveDefinition"
  RENAME COLUMN "curveType_new" TO "curveType";
  
ALTER TABLE "Forecasts"."CurveDefinition"
  RENAME COLUMN "batteryDuration_new" TO "batteryDuration";
  
ALTER TABLE "Forecasts"."CurveDefinition"
  RENAME COLUMN "scenario_new" TO "scenario";
  
ALTER TABLE "Forecasts"."CurveDefinition"
  RENAME COLUMN "degradationType_new" TO "degradationType";

-- Step 5: Set defaults for new rows
ALTER TABLE "Forecasts"."CurveDefinition"
  ALTER COLUMN "curveType" SET DEFAULT 'REVENUE',
  ALTER COLUMN "batteryDuration" SET DEFAULT 'UNKNOWN',
  ALTER COLUMN "scenario" SET DEFAULT 'BASE',
  ALTER COLUMN "degradationType" SET DEFAULT 'NONE';

-- Step 6: Make columns NOT NULL if they aren't already
ALTER TABLE "Forecasts"."CurveDefinition"
  ALTER COLUMN "curveType" SET NOT NULL,
  ALTER COLUMN "batteryDuration" SET NOT NULL,
  ALTER COLUMN "scenario" SET NOT NULL,
  ALTER COLUMN "degradationType" SET NOT NULL;

-- Note: Keep the enum types for now (other parts of schema might use them)
-- They can be dropped later if confirmed unused:
-- DROP TYPE IF EXISTS "Forecasts"."CurveType";
-- DROP TYPE IF EXISTS "Forecasts"."BatteryDuration";
-- DROP TYPE IF EXISTS "Forecasts"."ScenarioType";
-- DROP TYPE IF EXISTS "Forecasts"."DegradationType";

