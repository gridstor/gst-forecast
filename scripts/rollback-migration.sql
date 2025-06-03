-- Energy Forecast Architecture Rollback Script
-- This script safely reverts the migration back to the original state

BEGIN;

-- Safety check - ensure we're actually rolling back the right database
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CurveDefinition') THEN
        RAISE EXCEPTION 'Migration has not been run - nothing to rollback';
    END IF;
END $$;

-- Log what we're about to rollback
DO $$
DECLARE
    v_curve_defs INTEGER;
    v_instances INTEGER;
    v_prices INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_curve_defs FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_prices FROM "PriceForecast";
    
    RAISE NOTICE 'Rolling back migration with % definitions, % instances, % prices', 
                 v_curve_defs, v_instances, v_prices;
END $$;

-- Drop views first
DROP VIEW IF EXISTS curve_definitions_compat;

-- Drop new tables in dependency order
DROP TABLE IF EXISTS "QualityMetric" CASCADE;
DROP TABLE IF EXISTS "ScheduleRun" CASCADE;
DROP TABLE IF EXISTS "DefaultCurveInput" CASCADE;
DROP TABLE IF EXISTS "CurveInputLineage" CASCADE;
DROP TABLE IF EXISTS "VersionHistory" CASCADE;
DROP TABLE IF EXISTS "PriceForecast" CASCADE;
DROP TABLE IF EXISTS "CurveSchedule" CASCADE;
DROP TABLE IF EXISTS "CurveInstance" CASCADE;
DROP TABLE IF EXISTS "CurveDefinition" CASCADE;
DROP TABLE IF EXISTS "LegacyCurveMapping" CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_active_curve_instances(TIMESTAMP);
DROP FUNCTION IF EXISTS create_curve_instance_version(INTEGER, TIMESTAMP, TIMESTAMP, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop new types
DROP TYPE IF EXISTS "InstanceStatus" CASCADE;
DROP TYPE IF EXISTS "RunType" CASCADE;
DROP TYPE IF EXISTS "InputType" CASCADE;
DROP TYPE IF EXISTS "UsageType" CASCADE;
DROP TYPE IF EXISTS "ChangeType" CASCADE;
DROP TYPE IF EXISTS "ScheduleType" CASCADE;
DROP TYPE IF EXISTS "UpdateFrequency" CASCADE;
DROP TYPE IF EXISTS "RunStatus" CASCADE;

-- Restore original table names if they were renamed
DO $$
BEGIN
    -- Restore price_forecasts
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'Forecasts' AND table_name = 'price_forecasts_legacy') THEN
        ALTER TABLE "Forecasts".price_forecasts_legacy RENAME TO price_forecasts;
        RAISE NOTICE 'Restored original price_forecasts table';
    END IF;
    
    -- Restore curve_schedule
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'Forecasts' AND table_name = 'curve_schedule_legacy') THEN
        ALTER TABLE "Forecasts".curve_schedule_legacy RENAME TO curve_schedule;
        RAISE NOTICE 'Restored original curve_schedule table';
    END IF;
END $$;

-- Verify rollback
DO $$
DECLARE
    v_original_curves INTEGER;
    v_remaining_new_tables INTEGER;
BEGIN
    -- Check original data is intact
    SELECT COUNT(*) INTO v_original_curves FROM "Forecasts".curve_definitions;
    
    -- Check new tables are gone
    SELECT COUNT(*) INTO v_remaining_new_tables
    FROM information_schema.tables 
    WHERE table_name IN ('CurveDefinition', 'CurveInstance', 'PriceForecast', 'CurveSchedule');
    
    IF v_original_curves != 72 THEN
        RAISE WARNING 'Expected 72 original curves, found %', v_original_curves;
    END IF;
    
    IF v_remaining_new_tables > 0 THEN
        RAISE WARNING 'Some new tables were not properly removed: %', v_remaining_new_tables;
    END IF;
    
    RAISE NOTICE 'Rollback complete. Original curves: %, New tables remaining: %', 
                 v_original_curves, v_remaining_new_tables;
END $$;

COMMIT;

-- Final verification queries (run these manually after rollback)
/*
-- Check original tables are restored
SELECT 
    'curve_definitions' as table_name, 
    COUNT(*) as count 
FROM "Forecasts".curve_definitions
UNION ALL
SELECT 
    'price_forecasts' as table_name, 
    COUNT(*) as count 
FROM "Forecasts".price_forecasts
UNION ALL
SELECT 
    'curve_schedule' as table_name, 
    COUNT(*) as count 
FROM "Forecasts".curve_schedule;

-- Ensure new tables are gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('CurveDefinition', 'CurveInstance', 'PriceForecast')
  AND table_schema = 'public';
*/ 