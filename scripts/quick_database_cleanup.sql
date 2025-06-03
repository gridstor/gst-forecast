-- =====================================================
-- QUICK DATABASE CLEANUP - Essential Commands Only
-- Run these commands to clean up legacy scheduling system
-- =====================================================

-- Remove legacy scheduling views
DROP VIEW IF EXISTS "Forecasts".schedule_management;
DROP VIEW IF EXISTS "Forecasts".schedule_calendar;
DROP VIEW IF EXISTS "Forecasts".schedule_summary;

-- Remove legacy scheduling tables (data already migrated)
DROP TABLE IF EXISTS "Forecasts"."CurveSchedule";
DROP TABLE IF EXISTS "Forecasts"."CurveInstanceTemplate";
DROP TABLE IF EXISTS "Forecasts"."ScheduleRun";

-- Remove backup tables (no longer needed)
DROP TABLE IF EXISTS "Forecasts"."CurveSchedule_Backup";
DROP TABLE IF EXISTS "Forecasts"."PriceForecast_Backup";

-- Remove old PriceForecast table (replaced by CurveInstanceData)
DROP TABLE IF EXISTS "Forecasts"."PriceForecast";

-- Remove legacy public schema tables
DROP TABLE IF EXISTS public.curve_definitions;
DROP TABLE IF EXISTS public.price_forecasts;
DROP TABLE IF EXISTS public.curve_schedule;
DROP TABLE IF EXISTS public.curve_comment;
DROP TABLE IF EXISTS public.curve_receipt;
DROP TABLE IF EXISTS public.curve_update_history;
DROP TABLE IF EXISTS public.display_curves;
DROP TABLE IF EXISTS public.website_displays;
DROP TABLE IF EXISTS public."CurveDefinition";
DROP TABLE IF EXISTS public."CurveInstance";

-- Verify final state
SELECT 'Cleanup completed! Remaining tables:' as status;
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'Forecasts' ORDER BY tablename; 