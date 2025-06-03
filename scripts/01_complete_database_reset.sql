-- =====================================================
-- COMPLETE DATABASE RESET SCRIPT
-- WARNING: This will delete ALL data - backup first!
-- =====================================================

BEGIN;

-- ========== STEP 1: DROP ALL CONSTRAINTS ==========
-- Drop foreign key constraints first to avoid dependency issues

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign key constraints in Forecasts schema
    FOR r IN (
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'Forecasts')
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- ========== STEP 2: DROP ALL EXISTING TABLES ==========

-- Drop new architecture tables if they exist
DROP TABLE IF EXISTS "Forecasts"."CurveInputLineage" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."PriceForecast" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."LegacyCurveMapping" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."CurveInstance" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."ScheduleRun" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."CurveSchedule" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."QualityMetric" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."DefaultCurveInput" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."VersionHistory" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."CurveDefinition" CASCADE;

-- Drop legacy tables
DROP TABLE IF EXISTS "Forecasts".price_forecasts_legacy CASCADE;
DROP TABLE IF EXISTS "Forecasts".price_forecasts CASCADE;
DROP TABLE IF EXISTS "Forecasts".curve_schedule CASCADE;
DROP TABLE IF EXISTS "Forecasts".curve_schedule_legacy CASCADE;
DROP TABLE IF EXISTS "Forecasts".curve_definitions CASCADE;
DROP TABLE IF EXISTS "Forecasts".curve_update_history CASCADE;
DROP TABLE IF EXISTS "Forecasts".curve_receipts CASCADE;
DROP TABLE IF EXISTS "Forecasts".curve_comments CASCADE;

-- Drop any other tables in the Forecasts schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'Forecasts'
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS "Forecasts".' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- ========== STEP 3: DROP ALL CUSTOM TYPES ==========

-- Drop all custom types in the correct order
DROP TYPE IF EXISTS "Forecasts"."RunStatus" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."UpdateFrequency" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."ScheduleType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."ChangeType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."ScenarioType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."BatteryDuration" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."DegradationType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."CurveType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."UsageType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."InputType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."RunType" CASCADE;
DROP TYPE IF EXISTS "Forecasts"."InstanceStatus" CASCADE;

-- Drop any remaining types
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT typname 
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'Forecasts'
        AND t.typtype = 'e'  -- enum types
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS "Forecasts".' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- ========== STEP 4: DROP ALL VIEWS ==========

DROP VIEW IF EXISTS "Forecasts".upload_page_curves CASCADE;
DROP VIEW IF EXISTS "Forecasts".upload_page_curves_enhanced CASCADE;
DROP VIEW IF EXISTS "Forecasts".inventory_page_instances CASCADE;
DROP VIEW IF EXISTS "Forecasts".inventory_page_instances_enhanced CASCADE;
DROP VIEW IF EXISTS "Forecasts".curves_by_type_and_degradation CASCADE;
DROP VIEW IF EXISTS "Forecasts".curves_needing_update CASCADE;
DROP VIEW IF EXISTS "Forecasts".curve_definitions_compat CASCADE;
DROP VIEW IF EXISTS "Forecasts".battery_aware_curves CASCADE;

-- Drop any remaining views
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'Forecasts'
    ) LOOP
        EXECUTE 'DROP VIEW IF EXISTS "Forecasts".' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
END $$;

-- ========== STEP 5: DROP ALL FUNCTIONS ==========

DROP FUNCTION IF EXISTS "Forecasts".get_active_instance_for_date CASCADE;
DROP FUNCTION IF EXISTS "Forecasts".create_curve_instance_version CASCADE;

-- Drop any remaining functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'Forecasts'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS "Forecasts".' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- ========== STEP 6: VERIFY CLEAN STATE ==========

DO $$
DECLARE
    v_table_count INTEGER;
    v_type_count INTEGER;
    v_view_count INTEGER;
    v_function_count INTEGER;
BEGIN
    -- Count remaining objects
    SELECT COUNT(*) INTO v_table_count FROM pg_tables WHERE schemaname = 'Forecasts';
    SELECT COUNT(*) INTO v_type_count FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'Forecasts' AND t.typtype = 'e';
    SELECT COUNT(*) INTO v_view_count FROM pg_views WHERE schemaname = 'Forecasts';
    SELECT COUNT(*) INTO v_function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'Forecasts';
    
    RAISE NOTICE '';
    RAISE NOTICE '===== DATABASE RESET COMPLETE =====';
    RAISE NOTICE 'Remaining tables: %', v_table_count;
    RAISE NOTICE 'Remaining types: %', v_type_count;
    RAISE NOTICE 'Remaining views: %', v_view_count;
    RAISE NOTICE 'Remaining functions: %', v_function_count;
    RAISE NOTICE '';
    
    IF v_table_count > 0 OR v_type_count > 0 OR v_view_count > 0 OR v_function_count > 0 THEN
        RAISE WARNING 'Some objects may still exist. Please check manually.';
    ELSE
        RAISE NOTICE 'All objects successfully removed. Ready for fresh schema creation.';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- IMPORTANT: After running this script, run:
-- 02_create_energy_forecast_schema.sql
-- ===================================================== 