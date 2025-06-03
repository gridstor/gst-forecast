-- =====================================================
-- DEGRADATION TYPE TO DATE-ONLY MIGRATION
-- This script helps transition from degradation types to date-only approach
-- =====================================================

BEGIN;

-- ========== STEP 1: DOCUMENT THE CHANGE ==========
-- We are simplifying degradation handling from type-based to date-only approach.
-- 
-- BEFORE: 
-- - degradationType enum with values like 'NONE', 'YEAR_1', 'YEAR_2', etc.
-- - degradationStartDate as optional field
--
-- AFTER:
-- - degradationStartDate as the primary degradation control
-- - If date is set: degradation starts on that date
-- - If date is null: no degradation
-- - degradationType defaults to 'NONE' for backward compatibility

RAISE NOTICE 'Starting degradation migration to date-only approach...';

-- ========== STEP 2: UPDATE EXISTING RECORDS ==========
-- For existing schedules with degradation types but no start dates,
-- we could optionally set reasonable start dates based on the type.
-- For now, we'll just ensure they default to 'NONE' type.

UPDATE "Forecasts"."CurveDefinition" 
SET "degradationType" = 'NONE'::"Forecasts"."DegradationType"
WHERE "degradationType" IS NULL;

-- ========== STEP 3: UPDATE INSTANCE TEMPLATES ==========
-- Ensure all instance templates have consistent degradation handling
UPDATE "Forecasts"."CurveInstanceTemplate"
SET "customDegradeType" = NULL
WHERE "degradationStartDate" IS NULL;

-- ========== STEP 4: ADD COMMENTS FOR FUTURE REFERENCE ==========
COMMENT ON COLUMN "Forecasts"."CurveInstanceTemplate"."degradationStartDate" IS 
'Primary degradation control: If set, degradation starts on this date. If NULL, no degradation.';

COMMENT ON COLUMN "Forecasts"."CurveDefinition"."degradationType" IS 
'Legacy field: Now defaults to NONE. Use CurveInstanceTemplate.degradationStartDate for degradation control.';

RAISE NOTICE 'Degradation migration completed successfully.';
RAISE NOTICE 'UI Changes:';
RAISE NOTICE '- Removed degradation type dropdown from create-enhanced form';
RAISE NOTICE '- Added radio button control: "No degradation" vs "Degradation starts on [date]"';
RAISE NOTICE '- Backend APIs default degradationType to NONE';

COMMIT; 