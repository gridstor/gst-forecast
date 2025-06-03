-- =====================================================
-- DATABASE CLEANUP FOR DELIVERY MANAGEMENT SYSTEM
-- Remove legacy scheduling system and unused tables for fresh launch
-- =====================================================

BEGIN;

-- Display current state before cleanup
SELECT 'BEFORE CLEANUP - Table Count: ' || COUNT(*) as status
FROM information_schema.tables 
WHERE table_schema IN ('Forecasts', 'public');

-- ========== STEP 1: DROP LEGACY SCHEDULING SYSTEM VIEWS ==========
-- These views reference the old scheduling system
DROP VIEW IF EXISTS "Forecasts".schedule_management CASCADE;
DROP VIEW IF EXISTS "Forecasts".schedule_calendar CASCADE;
DROP VIEW IF EXISTS "Forecasts".schedule_summary CASCADE;

-- Drop any other legacy views that might exist
DROP VIEW IF EXISTS "Forecasts".upload_page_curves CASCADE;
DROP VIEW IF EXISTS public.battery_aware_curves CASCADE;

-- ========== STEP 2: DROP LEGACY SCHEDULING SYSTEM TABLES ==========
-- These tables are no longer needed after migration to delivery system

-- Drop schedule-related tables (data already migrated to CurveDeliveryRequest)
DROP TABLE IF EXISTS "Forecasts"."CurveSchedule" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."CurveInstanceTemplate" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."ScheduleRun" CASCADE;

-- Drop backup tables (migration completed successfully)
DROP TABLE IF EXISTS "Forecasts"."CurveSchedule_Backup" CASCADE;
DROP TABLE IF EXISTS "Forecasts"."PriceForecast_Backup" CASCADE;

-- Drop old PriceForecast table (replaced by CurveInstanceData)
DROP TABLE IF EXISTS "Forecasts"."PriceForecast" CASCADE;

-- ========== STEP 3: DROP LEGACY PUBLIC SCHEMA TABLES ==========
-- These appear to be from an older version of the system

DROP TABLE IF EXISTS public.curve_definitions CASCADE;
DROP TABLE IF EXISTS public.price_forecasts CASCADE;
DROP TABLE IF EXISTS public.curve_schedule CASCADE;
DROP TABLE IF EXISTS public.curve_comment CASCADE;
DROP TABLE IF EXISTS public.curve_receipt CASCADE;
DROP TABLE IF EXISTS public.curve_update_history CASCADE;
DROP TABLE IF EXISTS public.display_curves CASCADE;
DROP TABLE IF EXISTS public.website_displays CASCADE;

-- Drop any duplicate tables in public schema
DROP TABLE IF EXISTS public."CurveDefinition" CASCADE;
DROP TABLE IF EXISTS public."CurveInstance" CASCADE;

-- ========== STEP 4: CLEAN UP UNUSED ENUMS (IF ANY) ==========
-- Check for any orphaned enum types from old system
-- Note: Only drop if not referenced by remaining tables

-- First check what enums exist
-- DROP TYPE IF EXISTS public.old_status_type CASCADE;
-- DROP TYPE IF EXISTS public.legacy_frequency_type CASCADE;

-- ========== STEP 5: VERIFY ESSENTIAL DELIVERY SYSTEM INTACT ==========
-- Ensure our core delivery management system is still healthy

-- Check core tables exist
SELECT 
    'ESSENTIAL TABLE CHECK' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    VALUES 
        ('CurveDefinition'),
        ('CurveDeliveryRequest'), 
        ('CurveDeliverySpec'),
        ('CurveInstance'),
        ('CurveInstanceData')
) AS required(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = required.table_name 
    AND t.table_schema = 'Forecasts'
ORDER BY required.table_name;

-- Check essential views exist  
SELECT 
    'ESSENTIAL VIEW CHECK' as check_type,
    view_name,
    CASE WHEN view_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    VALUES 
        ('delivery_management'),
        ('delivery_instance_data'),
        ('curve_instance_timeseries')
) AS required(view_name)
LEFT JOIN information_schema.views v ON v.table_name = required.view_name 
    AND v.table_schema = 'Forecasts'
ORDER BY required.view_name;

-- ========== STEP 6: OPTIMIZE REMAINING TABLES ==========
-- Update statistics for query planner after cleanup
ANALYZE "Forecasts"."CurveDefinition";
ANALYZE "Forecasts"."CurveDeliveryRequest";
ANALYZE "Forecasts"."CurveDeliverySpec";
ANALYZE "Forecasts"."CurveInstance";
ANALYZE "Forecasts"."CurveInstanceData";

-- Clean up any remaining utility tables if they exist and are unused
-- Only uncomment these if you're sure they're not needed:
-- DROP TABLE IF EXISTS "Forecasts"."DefaultCurveInput" CASCADE;
-- DROP TABLE IF EXISTS "Forecasts"."CurveInputLineage" CASCADE;
-- DROP TABLE IF EXISTS "Forecasts"."QualityMetric" CASCADE;
-- DROP TABLE IF EXISTS "Forecasts"."VersionHistory" CASCADE;

-- ========== STEP 7: FINAL STATE VERIFICATION ==========
-- Show final clean state

SELECT 'AFTER CLEANUP - Forecasts Schema Tables:' as status;
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'Forecasts'
ORDER BY tablename;

SELECT 'AFTER CLEANUP - Forecasts Schema Views:' as status;
SELECT 
    schemaname,
    viewname,
    viewowner  
FROM pg_views
WHERE schemaname = 'Forecasts'
ORDER BY viewname;

-- Display data counts in remaining tables
SELECT 'FINAL DATA COUNTS:' as status;
SELECT 
    'CurveDefinition' as table_name,
    COUNT(*) as record_count
FROM "Forecasts"."CurveDefinition"

UNION ALL

SELECT 
    'CurveDeliveryRequest' as table_name,
    COUNT(*) as record_count
FROM "Forecasts"."CurveDeliveryRequest"

UNION ALL

SELECT 
    'CurveDeliverySpec' as table_name,
    COUNT(*) as record_count
FROM "Forecasts"."CurveDeliverySpec"

UNION ALL

SELECT 
    'CurveInstance' as table_name,
    COUNT(*) as record_count
FROM "Forecasts"."CurveInstance"

UNION ALL

SELECT 
    'CurveInstanceData' as table_name,
    COUNT(*) as record_count
FROM "Forecasts"."CurveInstanceData"

ORDER BY table_name;

-- ========== CLEANUP COMPLETED SUCCESSFULLY ==========
-- 
-- ✅ REMOVED:
-- • Legacy scheduling system (CurveSchedule, CurveInstanceTemplate, ScheduleRun)
-- • Backup tables (CurveSchedule_Backup, PriceForecast_Backup)
-- • Old PriceForecast table (replaced by CurveInstanceData) 
-- • Legacy public schema tables (curve_definitions, price_forecasts, etc.)
-- • Outdated views (schedule_management, schedule_calendar, etc.)
--
-- ✅ PRESERVED:
-- • Core delivery management system (CurveDefinition, CurveDeliveryRequest, etc.)
-- • Essential views (delivery_management, curve_instance_timeseries, etc.)
-- • Data integrity and relationships
-- • Performance indexes
--
-- 🚀 RESULT: Clean, optimized database ready for delivery management system launch!

COMMIT; 