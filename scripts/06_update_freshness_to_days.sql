-- =====================================================
-- UPDATE FRESHNESS FROM HOURS TO DAYS
-- Migration to convert freshnessHours to freshnessDays
-- =====================================================

BEGIN;

-- Step 1: Drop dependent views first (they'll be recreated by the workflow script)
DROP VIEW IF EXISTS "Forecasts".schedule_summary CASCADE;
DROP VIEW IF EXISTS "Forecasts".schedule_calendar CASCADE;
DROP VIEW IF EXISTS "Forecasts".schedule_management CASCADE;
DROP VIEW IF EXISTS "Forecasts".curves_needing_update CASCADE;

-- Step 2: Add new freshnessDays column
ALTER TABLE "Forecasts"."CurveSchedule" 
ADD COLUMN "freshnessDays" INTEGER;

-- Step 3: Convert existing freshnessHours to days (divide by 24)
UPDATE "Forecasts"."CurveSchedule" 
SET "freshnessDays" = CASE 
    WHEN "freshnessHours" IS NOT NULL THEN ROUND("freshnessHours"::DECIMAL / 24)
    ELSE 30 
END;

-- Step 4: Set default value for new column
ALTER TABLE "Forecasts"."CurveSchedule" 
ALTER COLUMN "freshnessDays" SET DEFAULT 30;

-- Step 5: Make new column NOT NULL
ALTER TABLE "Forecasts"."CurveSchedule" 
ALTER COLUMN "freshnessDays" SET NOT NULL;

-- Step 6: Now drop old freshnessHours column (no dependencies left)
ALTER TABLE "Forecasts"."CurveSchedule" 
DROP COLUMN "freshnessHours";

COMMIT;

-- ========== VERIFICATION ==========
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===== FRESHNESS UPDATE COMPLETE =====';
    RAISE NOTICE 'Updated CurveSchedule table:';
    RAISE NOTICE '  - Dropped dependent views';
    RAISE NOTICE '  - Renamed freshnessHours to freshnessDays';
    RAISE NOTICE '  - Converted hours to days (divided by 24)';
    RAISE NOTICE '  - Set default value to 30 days';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: You must now run:';
    RAISE NOTICE '    scripts/05_schedule_first_workflow.sql';
    RAISE NOTICE '    to recreate the views with freshnessDays logic!';
    RAISE NOTICE '';
END $$; 