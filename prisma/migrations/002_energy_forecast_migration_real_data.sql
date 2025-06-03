-- Energy Forecast Architecture Migration - Real Data Only
-- This script migrates existing production data to the new architecture
-- NO SAMPLE DATA WILL BE CREATED

BEGIN;

-- ========== STEP 0: SAFETY CHECKS ==========

-- Check if migration already ran
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CurveDefinition') THEN
        RAISE EXCEPTION 'Migration already executed - CurveDefinition table exists';
    END IF;
END $$;

-- Check if unique_name column exists (from duplicate fix script)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'Forecasts' 
        AND table_name = 'curve_definitions' 
        AND column_name = 'unique_name'
    ) THEN
        RAISE EXCEPTION 'Please run fix-duplicate-curves.sql first to create unique curve names';
    END IF;
END $$;

-- Log existing data counts for verification
DO $$
DECLARE
    v_curve_count INTEGER;
    v_price_count INTEGER;
    v_schedule_count INTEGER;
    v_null_names INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_curve_count FROM "Forecasts".curve_definitions;
    SELECT COUNT(*) INTO v_price_count FROM "Forecasts".price_forecasts;
    SELECT COUNT(*) INTO v_schedule_count FROM "Forecasts".curve_schedule;
    SELECT COUNT(*) INTO v_null_names FROM "Forecasts".curve_definitions WHERE unique_name IS NULL;
    
    IF v_null_names > 0 THEN
        RAISE EXCEPTION 'Found % curves with NULL unique_name - run fix-duplicate-curves.sql first', v_null_names;
    END IF;
    
    RAISE NOTICE 'Starting migration with % curves, % price records, % schedules', 
                 v_curve_count, v_price_count, v_schedule_count;
END $$;

-- ========== STEP 1: CREATE NEW SCHEMA OBJECTS ==========

-- Create ENUMs
CREATE TYPE "InstanceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'EXPIRED', 'FAILED');
CREATE TYPE "RunType" AS ENUM ('SCHEDULED', 'MANUAL', 'TRIGGERED', 'BACKFILL', 'CORRECTION');
CREATE TYPE "InputType" AS ENUM ('WEATHER_FORECAST', 'WEATHER_ACTUAL', 'DEMAND_FORECAST', 'DEMAND_ACTUAL', 
    'GENERATION_FORECAST', 'GENERATION_ACTUAL', 'TRANSMISSION_LIMITS', 'FUEL_PRICES', 
    'HYDRO_CONDITIONS', 'RENEWABLE_FORECAST', 'MARKET_FUNDAMENTALS', 'REGULATORY_CHANGES', 'LEGACY_MIGRATION', 'OTHER');
CREATE TYPE "UsageType" AS ENUM ('PRIMARY', 'VALIDATION', 'REFERENCE', 'FALLBACK');
CREATE TYPE "ChangeType" AS ENUM ('INITIAL', 'UPDATE', 'CORRECTION', 'REVISION', 'FINAL', 'ROLLBACK');
CREATE TYPE "ScheduleType" AS ENUM ('REGULAR', 'AD_HOC', 'TRIGGERED', 'EVENT_BASED');
CREATE TYPE "UpdateFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ON_DEMAND');
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PARTIAL');

-- Create CurveDefinition table
CREATE TABLE "CurveDefinition" (
    "id" SERIAL PRIMARY KEY,
    "curveName" VARCHAR(255) UNIQUE NOT NULL,
    "market" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "product" VARCHAR(50) NOT NULL,
    "commodity" VARCHAR(50) NOT NULL,
    "units" VARCHAR(50) NOT NULL,
    "granularity" VARCHAR(20) NOT NULL,
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_curve_def_market_location_product ON "CurveDefinition"("market", "location", "product");
CREATE INDEX idx_curve_def_name ON "CurveDefinition"("curveName");

-- Create CurveInstance table
CREATE TABLE "CurveInstance" (
    "id" SERIAL PRIMARY KEY,
    "curve_definition_id" INTEGER NOT NULL REFERENCES "CurveDefinition"("id"),
    "instanceVersion" VARCHAR(50) NOT NULL,
    "deliveryPeriodStart" TIMESTAMP NOT NULL,
    "deliveryPeriodEnd" TIMESTAMP NOT NULL,
    "forecastRunDate" TIMESTAMP NOT NULL,
    "freshnessStartDate" TIMESTAMP NOT NULL,
    "freshnessEndDate" TIMESTAMP,
    "status" "InstanceStatus" DEFAULT 'ACTIVE',
    "modelType" VARCHAR(100),
    "modelVersion" VARCHAR(50),
    "runType" "RunType" DEFAULT 'BACKFILL',
    "createdBy" VARCHAR(100) NOT NULL,
    "approvedBy" VARCHAR(100),
    "approvedAt" TIMESTAMP,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_curve_instance_unique ON "CurveInstance"("curve_definition_id", "instanceVersion", "deliveryPeriodStart");
CREATE INDEX idx_curve_instance_freshness ON "CurveInstance"("curve_definition_id", "freshnessStartDate", "freshnessEndDate");
CREATE INDEX idx_curve_instance_delivery ON "CurveInstance"("deliveryPeriodStart", "deliveryPeriodEnd");
CREATE INDEX idx_curve_instance_status ON "CurveInstance"("status");

-- Create new PriceForecast table (rename existing if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'Forecasts' AND table_name = 'price_forecasts') THEN
        ALTER TABLE "Forecasts".price_forecasts RENAME TO price_forecasts_legacy;
    END IF;
END $$;

CREATE TABLE "PriceForecast" (
    "id" SERIAL PRIMARY KEY,
    "curve_instance_id" INTEGER NOT NULL REFERENCES "CurveInstance"("id") ON DELETE CASCADE,
    "timestamp" TIMESTAMP NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "valueHigh" DOUBLE PRECISION,
    "valueLow" DOUBLE PRECISION,
    "flags" TEXT[]
);

CREATE UNIQUE INDEX idx_price_forecast_unique ON "PriceForecast"("curve_instance_id", "timestamp");
CREATE INDEX idx_price_forecast_instance ON "PriceForecast"("curve_instance_id");
CREATE INDEX idx_price_forecast_timestamp ON "PriceForecast"("timestamp");

-- Create CurveInputLineage table
CREATE TABLE "CurveInputLineage" (
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

CREATE INDEX idx_input_lineage_instance ON "CurveInputLineage"("curve_instance_id");

-- Create VersionHistory table
CREATE TABLE "VersionHistory" (
    "id" SERIAL PRIMARY KEY,
    "curve_instance_id" INTEGER NOT NULL REFERENCES "CurveInstance"("id"),
    "previous_instance_id" INTEGER,
    "changeType" "ChangeType" NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedBy" VARCHAR(100) NOT NULL,
    "changedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "changeDetails" JSONB
);

CREATE INDEX idx_version_history_instance ON "VersionHistory"("curve_instance_id");

-- Rename existing curve_schedule if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'Forecasts' AND table_name = 'curve_schedule') THEN
        ALTER TABLE "Forecasts".curve_schedule RENAME TO curve_schedule_legacy;
    END IF;
END $$;

-- Create new CurveSchedule table
CREATE TABLE "CurveSchedule" (
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

CREATE INDEX idx_curve_schedule_definition ON "CurveSchedule"("curve_definition_id");

-- Create minimal required tables
CREATE TABLE "ScheduleRun" (
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

CREATE TABLE "QualityMetric" (
    "id" SERIAL PRIMARY KEY,
    "curve_instance_id" INTEGER NOT NULL REFERENCES "CurveInstance"("id"),
    "metricType" VARCHAR(50) NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "comparisonType" VARCHAR(50),
    "comparisonId" INTEGER,
    "calculatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB
);

CREATE TABLE "DefaultCurveInput" (
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

CREATE TABLE "LegacyCurveMapping" (
    "id" SERIAL PRIMARY KEY,
    "oldCurveId" INTEGER UNIQUE NOT NULL,
    "newCurveDefinitionId" INTEGER NOT NULL,
    "migrationNotes" TEXT,
    "migratedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== STEP 2: MIGRATE EXISTING CURVE DEFINITIONS ==========

-- Migrate all 72 existing curve definitions using the unique_name column
INSERT INTO "CurveDefinition" (
    "curveName",
    "market",
    "location",
    "product",
    "commodity",
    "units",
    "granularity",
    "timezone",
    "description",
    "isActive",
    "metadata",
    "createdAt"
)
SELECT 
    -- Use the pre-calculated unique_name to avoid duplicates
    unique_name as "curveName",
    COALESCE(market, 'UNKNOWN') as "market",
    COALESCE(location, 'Unknown Location') as "location",
    COALESCE(mark_type, 'UNKNOWN') as "product",
    'Energy' as "commodity", -- Default to Energy for all
    '$/MWh' as "units", -- Default unit
    COALESCE(granularity, 'HOURLY') as "granularity",
    CASE 
        WHEN market = 'CAISO' THEN 'America/Los_Angeles'
        WHEN market = 'ERCOT' THEN 'America/Chicago'
        ELSE 'UTC'
    END as "timezone",
    CONCAT('Curve: ', COALESCE(mark_type, ''), ' - ', COALESCE(mark_case, '')) as "description",
    true as "isActive",
    jsonb_build_object(
        'legacy_curve_id', curve_id,
        'legacy_mark_case', mark_case,
        'legacy_curve_creator', curve_creator,
        'legacy_value_type', value_type,
        'legacy_model_type', mark_model_type_desc
    ) as "metadata",
    COALESCE(created_at, CURRENT_TIMESTAMP) as "createdAt"
FROM "Forecasts".curve_definitions;

-- Create mapping for all migrated curves
INSERT INTO "LegacyCurveMapping" ("oldCurveId", "newCurveDefinitionId", "migrationNotes")
SELECT 
    cd.curve_id,
    cdef.id,
    CASE 
        WHEN cd.unique_name LIKE '%_V%' THEN 'Production migration - renamed due to duplicate'
        ELSE 'Production migration - preserved all original data'
    END
FROM "Forecasts".curve_definitions cd
JOIN "CurveDefinition" cdef ON cdef."curveName" = cd.unique_name;

-- ========== STEP 3: MIGRATE EXISTING PRICE DATA IF IT EXISTS ==========

-- Only create CurveInstances if there's actual price data
INSERT INTO "CurveInstance" (
    "curve_definition_id",
    "instanceVersion",
    "deliveryPeriodStart",
    "deliveryPeriodEnd",
    "forecastRunDate",
    "freshnessStartDate",
    "freshnessEndDate",
    "status",
    "modelType",
    "runType",
    "createdBy",
    "notes"
)
SELECT DISTINCT
    lcm."newCurveDefinitionId",
    'legacy_v1' as "instanceVersion",
    COALESCE(price_data.min_date, CURRENT_DATE) as "deliveryPeriodStart",
    COALESCE(price_data.max_date, CURRENT_DATE + INTERVAL '1 year') as "deliveryPeriodEnd",
    COALESCE(cd.mark_date, cd.created_at, CURRENT_TIMESTAMP) as "forecastRunDate",
    COALESCE(cd.mark_date, cd.created_at, CURRENT_TIMESTAMP) as "freshnessStartDate",
    NULL as "freshnessEndDate", -- Still active
    'ACTIVE'::InstanceStatus as "status",
    COALESCE(cd.mark_model_type_desc, 'Historical') as "modelType",
    'BACKFILL'::RunType as "runType",
    'migration_script' as "createdBy",
    'Migrated from production data' as "notes"
FROM "Forecasts".curve_definitions cd
JOIN "LegacyCurveMapping" lcm ON lcm."oldCurveId" = cd.curve_id
LEFT JOIN LATERAL (
    SELECT 
        MIN(flow_date_start) as min_date,
        MAX(flow_date_start) as max_date
    FROM "Forecasts".price_forecasts pf 
    WHERE pf.curve_id = cd.curve_id
) price_data ON true
WHERE price_data.min_date IS NOT NULL; -- Only create instance if price data exists

-- Migrate actual price forecast data
INSERT INTO "PriceForecast" (
    "curve_instance_id",
    "timestamp",
    "value"
)
SELECT 
    ci.id as "curve_instance_id",
    pf.flow_date_start as "timestamp",
    pf.value as "value"
FROM "Forecasts".price_forecasts pf
JOIN "LegacyCurveMapping" lcm ON lcm."oldCurveId" = pf.curve_id
JOIN "CurveInstance" ci ON 
    ci."curve_definition_id" = lcm."newCurveDefinitionId" 
    AND ci."instanceVersion" = 'legacy_v1';

-- Create placeholder lineage for migrated instances
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
    'LEGACY_MIGRATION'::InputType,
    'Pre-migration data',
    CONCAT('legacy_curve_', ci."curve_definition_id"),
    ci."forecastRunDate",
    'PRIMARY'::UsageType,
    jsonb_build_object(
        'note', 'Migrated from legacy system - original lineage not available',
        'migration_date', CURRENT_TIMESTAMP
    )
FROM "CurveInstance" ci;

-- ========== STEP 4: CREATE MINIMAL CURVE SCHEDULES ==========

-- Only create schedules if they don't already exist in legacy table
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
    'REGULAR'::ScheduleType,
    -- Determine frequency based on curve characteristics
    CASE 
        WHEN cd."product" LIKE '%RT%' THEN 'DAILY'::UpdateFrequency
        WHEN cd."product" LIKE '%DA%' THEN 'DAILY'::UpdateFrequency
        ELSE 'MONTHLY'::UpdateFrequency
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
LEFT JOIN "Forecasts".curve_schedule_legacy csl ON 
    EXISTS (
        SELECT 1 FROM "LegacyCurveMapping" lcm 
        WHERE lcm."newCurveDefinitionId" = cd.id 
        AND lcm."oldCurveId" = csl.curve_id
    )
WHERE csl.schedule_id IS NULL; -- Only create if no legacy schedule exists

-- ========== STEP 5: CREATE HELPER FUNCTIONS ==========

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
        ci.curve_definition_id,
        cd."curveName",
        cd."market",
        cd."location",
        ci."instanceVersion",
        ci."deliveryPeriodStart",
        ci."deliveryPeriodEnd"
    FROM "CurveInstance" ci
    JOIN "CurveDefinition" cd ON cd.id = ci.curve_definition_id
    WHERE 
        ci.status = 'ACTIVE'
        AND ci."freshnessStartDate" <= p_as_of_date
        AND (ci."freshnessEndDate" IS NULL OR ci."freshnessEndDate" > p_as_of_date)
    ORDER BY cd."market", cd."location", ci."deliveryPeriodStart";
END;
$$;

-- ========== STEP 6: CREATE BACKWARD COMPATIBILITY VIEW ==========

CREATE OR REPLACE VIEW curve_definitions_compat AS
SELECT 
    cd.id as curve_id,
    cd."market" as market,
    cd."location" as location,
    cd."product" as mark_type,
    cd."metadata"->>'legacy_model_type' as mark_model_type_desc,
    cd."description" as mark_case,
    ci."forecastRunDate" as mark_date,
    cd."units" as units,
    cd."granularity" as granularity,
    cd."metadata"->>'legacy_curve_creator' as curve_creator,
    cd."metadata"->>'legacy_value_type' as value_type,
    cd."createdAt" as created_at
FROM "CurveDefinition" cd
LEFT JOIN LATERAL (
    SELECT * FROM "CurveInstance" ci
    WHERE ci.curve_definition_id = cd.id
      AND ci.status = 'ACTIVE'
      AND ci."freshnessEndDate" IS NULL
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1
) ci ON true;

-- ========== STEP 7: VERIFICATION ==========

-- Log final counts
DO $$
DECLARE
    v_new_curves INTEGER;
    v_instances INTEGER;
    v_prices INTEGER;
    v_schedules INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_new_curves FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_prices FROM "PriceForecast";
    SELECT COUNT(*) INTO v_schedules FROM "CurveSchedule";
    
    RAISE NOTICE 'Migration complete: % curves, % instances, % prices, % schedules', 
                 v_new_curves, v_instances, v_prices, v_schedules;
                 
    -- Verify all 72 curves migrated
    IF v_new_curves != 72 THEN
        RAISE WARNING 'Expected 72 curves, but migrated %', v_new_curves;
    END IF;
END $$;

COMMIT; 