-- Energy Forecast Architecture Migration - Consolidated Approach
-- This migration assumes you've already run the consolidation script
-- It creates the full schema using the consolidated data

BEGIN;

-- ========== STEP 0: SAFETY CHECKS ==========

-- Check if consolidation was run
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CurveDefinition') THEN
        RAISE EXCEPTION 'Please run consolidate-curves-properly.sql first to consolidate duplicate curves';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'LegacyCurveMapping') THEN
        RAISE EXCEPTION 'LegacyCurveMapping table not found - run consolidation script first';
    END IF;
END $$;

-- Log migration status
DO $$
DECLARE
    v_definitions INTEGER;
    v_instances INTEGER;
    v_prices INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_definitions FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_prices FROM "PriceForecast";
    
    RAISE NOTICE 'Starting migration with % definitions, % instances, % price records', 
                 v_definitions, v_instances, v_prices;
END $$;

-- ========== STEP 1: CREATE REMAINING SCHEMA OBJECTS ==========

-- Create remaining ENUMs that consolidation script might have missed
DO $$
BEGIN
    CREATE TYPE "InputType" AS ENUM ('WEATHER_FORECAST', 'WEATHER_ACTUAL', 'DEMAND_FORECAST', 'DEMAND_ACTUAL', 
        'GENERATION_FORECAST', 'GENERATION_ACTUAL', 'TRANSMISSION_LIMITS', 'FUEL_PRICES', 
        'HYDRO_CONDITIONS', 'RENEWABLE_FORECAST', 'MARKET_FUNDAMENTALS', 'REGULATORY_CHANGES', 'LEGACY_MIGRATION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "UsageType" AS ENUM ('PRIMARY', 'VALIDATION', 'REFERENCE', 'FALLBACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "ChangeType" AS ENUM ('INITIAL', 'UPDATE', 'CORRECTION', 'REVISION', 'FINAL', 'ROLLBACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "ScheduleType" AS ENUM ('REGULAR', 'AD_HOC', 'TRIGGERED', 'EVENT_BASED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "UpdateFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ON_DEMAND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PARTIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create remaining tables that consolidation might not have created

-- CurveInputLineage table
CREATE TABLE IF NOT EXISTS "CurveInputLineage" (
    "id" SERIAL PRIMARY KEY,
    "curve_instance_id" INTEGER NOT NULL REFERENCES "CurveInstance"("id") ON DELETE CASCADE,
    "inputType" "InputType" NOT NULL,
    "inputSource" VARCHAR(100) NOT NULL,
    "inputIdentifier" VARCHAR(255) NOT NULL,
    "inputVersion" VARCHAR(50),
    "inputTimestamp" TIMESTAMP NOT NULL,
    "usageType" "UsageType" NOT NULL,
    "transformApplied" TEXT,
    "weight" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_input_lineage_instance ON "CurveInputLineage"("curve_instance_id");

-- VersionHistory table
CREATE TABLE IF NOT EXISTS "VersionHistory" (
    "id" SERIAL PRIMARY KEY,
    "curve_instance_id" INTEGER NOT NULL REFERENCES "CurveInstance"("id"),
    "previous_instance_id" INTEGER,
    "changeType" "ChangeType" NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedBy" VARCHAR(100) NOT NULL,
    "changedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "changeDetails" JSONB
);

CREATE INDEX IF NOT EXISTS idx_version_history_instance ON "VersionHistory"("curve_instance_id");

-- Rename existing curve_schedule if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'Forecasts' AND table_name = 'curve_schedule') THEN
        ALTER TABLE "Forecasts".curve_schedule RENAME TO curve_schedule_legacy;
    END IF;
END $$;

-- Create new CurveSchedule table
CREATE TABLE IF NOT EXISTS "CurveSchedule" (
    "id" SERIAL PRIMARY KEY,
    "curve_definition_id" INTEGER NOT NULL REFERENCES "CurveDefinition"("id"),
    "scheduleType" "ScheduleType" NOT NULL DEFAULT 'REGULAR',
    "frequency" "UpdateFrequency" NOT NULL,
    "dayOfWeek" INTEGER CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
    "dayOfMonth" INTEGER CHECK ("dayOfMonth" >= 1 AND "dayOfMonth" <= 31),
    "timeOfDay" VARCHAR(5) DEFAULT '09:00',
    "leadTimeDays" INTEGER DEFAULT 0,
    "freshnessHours" INTEGER DEFAULT 720, -- 30 days default
    "responsibleTeam" VARCHAR(100) NOT NULL DEFAULT 'Market Analysis',
    "importance" INTEGER DEFAULT 3,
    "isActive" BOOLEAN DEFAULT true,
    "validFrom" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_curve_schedule_definition ON "CurveSchedule"("curve_definition_id");

-- Create additional tables
CREATE TABLE IF NOT EXISTS "ScheduleRun" (
    "id" SERIAL PRIMARY KEY,
    "schedule_id" INTEGER NOT NULL REFERENCES "CurveSchedule"("id"),
    "scheduledFor" TIMESTAMP NOT NULL,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "instancesCreated" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB
);

CREATE TABLE IF NOT EXISTS "QualityMetric" (
    "id" SERIAL PRIMARY KEY,
    "curve_instance_id" INTEGER NOT NULL REFERENCES "CurveInstance"("id"),
    "metricType" VARCHAR(50) NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "comparisonType" VARCHAR(50),
    "comparisonId" INTEGER,
    "calculatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB
);

CREATE TABLE IF NOT EXISTS "DefaultCurveInput" (
    "id" SERIAL PRIMARY KEY,
    "curve_definition_id" INTEGER NOT NULL REFERENCES "CurveDefinition"("id"),
    "inputType" "InputType" NOT NULL,
    "inputSource" VARCHAR(100) NOT NULL,
    "inputIdentifier" VARCHAR(255) NOT NULL,
    "isRequired" BOOLEAN DEFAULT true,
    "defaultWeight" DOUBLE PRECISION,
    "validFrom" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP
);

-- ========== STEP 2: ADD PLACEHOLDER LINEAGE FOR MIGRATED INSTANCES ==========

-- Add lineage records for all migrated instances
INSERT INTO "CurveInputLineage" (
    "curve_instance_id",
    "inputType",
    "inputSource",
    "inputIdentifier",
    "inputTimestamp",
    "usageType",
    "metadata"
)
SELECT 
    ci.id,
    'LEGACY_MIGRATION'::"InputType",
    'Pre-migration data',
    CONCAT('legacy_curve_', ci."metadata"->>'legacy_curve_id'),
    ci."forecastRunDate",
    'PRIMARY'::"UsageType",
    jsonb_build_object(
        'note', 'Migrated from legacy system via consolidation',
        'migration_date', CURRENT_TIMESTAMP,
        'original_granularity', ci."metadata"->>'legacy_granularity'
    )
FROM "CurveInstance" ci
WHERE NOT EXISTS (
    SELECT 1 FROM "CurveInputLineage" cil 
    WHERE cil."curve_instance_id" = ci.id
);

-- ========== STEP 3: CREATE CURVE SCHEDULES ==========

-- Create schedules based on consolidated curves
INSERT INTO "CurveSchedule" (
    "curve_definition_id",
    "scheduleType",
    "frequency",
    "dayOfMonth",
    "responsibleTeam",
    "importance",
    "freshnessHours"
)
SELECT 
    cd.id,
    'REGULAR'::"ScheduleType",
    -- Determine frequency based on product and instance granularities
    CASE 
        WHEN cd."product" LIKE '%RT%' OR 
             EXISTS (SELECT 1 FROM "CurveInstance" ci 
                     WHERE ci."curve_definition_id" = cd.id 
                     AND ci."metadata"->>'legacy_granularity' = 'HOURLY') 
        THEN 'DAILY'::"UpdateFrequency"
        WHEN cd."product" LIKE '%DA%' THEN 'DAILY'::"UpdateFrequency"
        WHEN cd."granularity" = 'MONTHLY' THEN 'MONTHLY'::"UpdateFrequency"
        ELSE 'WEEKLY'::"UpdateFrequency"
    END as "frequency",
    15 as "dayOfMonth", -- Default to 15th of month
    'Market Analysis' as "responsibleTeam",
    3 as "importance", -- Medium importance
    CASE 
        WHEN cd."product" LIKE '%RT%' THEN 24      -- 1 day for real-time
        WHEN cd."product" LIKE '%DA%' THEN 24      -- 1 day for day-ahead
        ELSE 720                                     -- 30 days for others
    END as "freshnessHours"
FROM "CurveDefinition" cd
WHERE NOT EXISTS (
    SELECT 1 FROM "CurveSchedule" cs 
    WHERE cs."curve_definition_id" = cd.id
);

-- ========== STEP 4: CREATE HELPER FUNCTIONS ==========

-- Function to get active curve instances
CREATE OR REPLACE FUNCTION get_active_curve_instances(
    p_as_of_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    curve_instance_id INTEGER,
    curve_definition_id INTEGER,
    curve_name VARCHAR,
    market VARCHAR,
    location VARCHAR,
    instance_version VARCHAR,
    delivery_period_start TIMESTAMP,
    delivery_period_end TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci."curve_definition_id",
        cd."curveName",
        cd."market",
        cd."location",
        ci."instanceVersion",
        ci."deliveryPeriodStart",
        ci."deliveryPeriodEnd"
    FROM "CurveInstance" ci
    JOIN "CurveDefinition" cd ON cd.id = ci."curve_definition_id"
    WHERE 
        ci.status = 'ACTIVE'
        AND ci."freshnessStartDate" <= p_as_of_date
        AND (ci."freshnessEndDate" IS NULL OR ci."freshnessEndDate" > p_as_of_date)
    ORDER BY cd."market", cd."location", ci."deliveryPeriodStart";
END;
$$;

-- ========== STEP 5: CREATE BACKWARD COMPATIBILITY VIEWS ==========

-- View for legacy curve_definitions compatibility
CREATE OR REPLACE VIEW curve_definitions_compat AS
SELECT 
    lcm."oldCurveId" as curve_id,
    cd."market",
    cd."location",
    cd."product" as mark_type,
    ci."modelType" as mark_model_type_desc,
    ci."metadata"->>'legacy_mark_case' as mark_case,
    ci."forecastRunDate" as mark_date,
    cd."units",
    ci."metadata"->>'legacy_granularity' as granularity,
    cd."metadata"->>'legacy_creators'->>0 as curve_creator,
    'price' as value_type,
    ci."createdAt" as created_at
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
JOIN "LegacyCurveMapping" lcm ON lcm."newCurveInstanceId" = ci.id;

-- ========== STEP 6: VERIFICATION ==========

DO $$
DECLARE
    v_definitions INTEGER;
    v_instances INTEGER;
    v_prices INTEGER;
    v_schedules INTEGER;
    v_legacy_curves INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_definitions FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_prices FROM "PriceForecast";
    SELECT COUNT(*) INTO v_schedules FROM "CurveSchedule";
    SELECT COUNT(*) INTO v_legacy_curves FROM curve_definitions_compat;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== MIGRATION COMPLETE =====';
    RAISE NOTICE 'CurveDefinitions: %', v_definitions;
    RAISE NOTICE 'CurveInstances: %', v_instances;
    RAISE NOTICE 'PriceForecasts: %', v_prices;
    RAISE NOTICE 'CurveSchedules: %', v_schedules;
    RAISE NOTICE 'Legacy view records: %', v_legacy_curves;
    
    -- Show consolidated results
    RAISE NOTICE '';
    RAISE NOTICE 'Sample consolidated curves:';
END $$;

-- Display sample of consolidated data
SELECT 
    cd."curveName",
    cd."market",
    cd."location",
    COUNT(DISTINCT ci.id) as instances,
    STRING_AGG(DISTINCT ci."metadata"->>'legacy_granularity', ', ') as granularities,
    MIN(ci."deliveryPeriodStart") as earliest_data,
    MAX(ci."deliveryPeriodEnd") as latest_data
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."curveName", cd."market", cd."location"
ORDER BY instances DESC
LIMIT 5;

COMMIT; 