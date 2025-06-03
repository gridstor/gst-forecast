-- =====================================================
-- CLEANUP LEGACY TABLES AND DUPLICATES
-- Removes old tables that are no longer needed with new architecture
-- =====================================================

BEGIN;

-- ========== STEP 1: VERIFY NEW ARCHITECTURE EXISTS ==========

DO $$
DECLARE
    v_new_tables INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_new_tables 
    FROM pg_tables 
    WHERE schemaname = 'Forecasts' 
    AND tablename IN ('CurveDefinition', 'CurveInstance', 'PriceForecast');
    
    IF v_new_tables < 3 THEN
        RAISE EXCEPTION 'New architecture tables not found in Forecasts schema. Please run 02_create_energy_forecast_schema.sql first.';
    END IF;
    
    RAISE NOTICE 'New architecture verified. Proceeding with cleanup.';
END $$;

-- ========== STEP 2: DROP LEGACY TABLES IN PUBLIC SCHEMA ==========

-- Drop display/website tables (these were for old UI)
DROP TABLE IF EXISTS public.display_curves CASCADE;
DROP TABLE IF EXISTS public.website_displays CASCADE;
DROP TABLE IF EXISTS public.website_display CASCADE;

-- Drop legacy curve management tables
DROP TABLE IF EXISTS public.curve_comment CASCADE;
DROP TABLE IF EXISTS public.curve_receipt CASCADE;
DROP TABLE IF EXISTS public.curve_update_history CASCADE;
DROP TABLE IF EXISTS public.curve_schedule CASCADE;
DROP TABLE IF EXISTS public.price_forecasts CASCADE;
DROP TABLE IF EXISTS public.curve_definitions CASCADE;

-- Drop duplicate tables that may have been created in public schema
DROP TABLE IF EXISTS public."CurveDefinition" CASCADE;
DROP TABLE IF EXISTS public."CurveInstance" CASCADE;
DROP TABLE IF EXISTS public."PriceForecast" CASCADE;
DROP TABLE IF EXISTS public."CurveSchedule" CASCADE;
DROP TABLE IF EXISTS public."CurveInputLineage" CASCADE;
DROP TABLE IF EXISTS public."VersionHistory" CASCADE;
DROP TABLE IF EXISTS public."ScheduleRun" CASCADE;
DROP TABLE IF EXISTS public."QualityMetric" CASCADE;
DROP TABLE IF EXISTS public."DefaultCurveInput" CASCADE;

-- ========== STEP 3: DROP LEGACY VIEWS ==========

DROP VIEW IF EXISTS public.battery_aware_curves CASCADE;
DROP VIEW IF EXISTS public.upload_page_curves CASCADE;
DROP VIEW IF EXISTS public.inventory_page_instances CASCADE;
DROP VIEW IF EXISTS public.curves_needing_update CASCADE;
DROP VIEW IF EXISTS public.curves_by_type_and_scenario CASCADE;

-- ========== STEP 4: DROP LEGACY CUSTOM TYPES IN PUBLIC SCHEMA ==========

-- Drop any legacy enums that might exist in public
DROP TYPE IF EXISTS public."InstanceStatus" CASCADE;
DROP TYPE IF EXISTS public."RunType" CASCADE;
DROP TYPE IF EXISTS public."InputType" CASCADE;
DROP TYPE IF EXISTS public."UsageType" CASCADE;
DROP TYPE IF EXISTS public."CurveType" CASCADE;
DROP TYPE IF EXISTS public."BatteryDuration" CASCADE;
DROP TYPE IF EXISTS public."ScenarioType" CASCADE;
DROP TYPE IF EXISTS public."DegradationType" CASCADE;
DROP TYPE IF EXISTS public."ScheduleType" CASCADE;
DROP TYPE IF EXISTS public."UpdateFrequency" CASCADE;
DROP TYPE IF EXISTS public."RunStatus" CASCADE;
DROP TYPE IF EXISTS public."ChangeType" CASCADE;

-- ========== STEP 5: DROP LEGACY DATA TABLES (IF ANY) ==========

-- These tables contained raw imported data that's no longer needed
DROP TABLE IF EXISTS public.caiso_long_term_forecasts_annual CASCADE;
DROP TABLE IF EXISTS public.ercot_long_term_forecasts_annual CASCADE;
DROP TABLE IF EXISTS public.caiso_monthly_forecasts CASCADE;
DROP TABLE IF EXISTS public.ercot_monthly_forecasts CASCADE;

-- ========== STEP 6: VERIFICATION ==========

DO $$
DECLARE
    v_public_tables INTEGER;
    v_forecasts_tables INTEGER;
    v_forecasts_views INTEGER;
BEGIN
    -- Count remaining objects
    SELECT COUNT(*) INTO v_public_tables 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('_prisma_migrations', '_prisma_migrations_lock');
    
    SELECT COUNT(*) INTO v_forecasts_tables 
    FROM pg_tables 
    WHERE schemaname = 'Forecasts';
    
    SELECT COUNT(*) INTO v_forecasts_views 
    FROM pg_views 
    WHERE schemaname = 'Forecasts';
    
    RAISE NOTICE '';
    RAISE NOTICE '===== CLEANUP COMPLETE =====';
    RAISE NOTICE 'Remaining public tables (excluding Prisma): %', v_public_tables;
    RAISE NOTICE 'Forecasts schema tables: %', v_forecasts_tables;
    RAISE NOTICE 'Forecasts schema views: %', v_forecasts_views;
    RAISE NOTICE '';
    
    IF v_public_tables = 0 THEN
        RAISE NOTICE 'SUCCESS: All legacy tables removed from public schema';
    ELSE
        RAISE WARNING 'Some tables remain in public schema - please check manually';
    END IF;
    
    IF v_forecasts_tables >= 9 AND v_forecasts_views >= 4 THEN
        RAISE NOTICE 'SUCCESS: New energy forecast architecture is ready';
    ELSE
        RAISE WARNING 'New architecture may be incomplete';
    END IF;
END $$;

-- ========== STEP 7: SHOW CURRENT STATE ==========

-- Show what's left in both schemas
SELECT 
    'TABLES' as object_type,
    schemaname,
    tablename as object_name,
    'Table' as type
FROM pg_tables 
WHERE schemaname IN ('public', 'Forecasts')
AND tablename NOT IN ('_prisma_migrations', '_prisma_migrations_lock')

UNION ALL

SELECT 
    'VIEWS' as object_type,
    schemaname,
    viewname as object_name,
    'View' as type
FROM pg_views 
WHERE schemaname IN ('public', 'Forecasts')

ORDER BY object_type, schemaname, object_name;

COMMIT;

-- =====================================================
-- CLEANUP COMPLETE!
-- 
-- What was removed:
-- - All legacy tables from public schema
-- - Old display/website tables
-- - Duplicate tables created in wrong schema
-- - Legacy views and custom types
-- - Raw data import tables
--
-- What remains:
-- - Clean Forecasts schema with new architecture
-- - Prisma migration tables (needed for Prisma)
-- ===================================================== 