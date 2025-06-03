-- =====================================================
-- ENERGY FORECAST SCHEMA CREATION
-- Complete production-ready schema for energy market curves
-- =====================================================

BEGIN;

-- ========== STEP 1: CREATE CUSTOM TYPES ==========

-- Instance lifecycle status
CREATE TYPE "Forecasts"."InstanceStatus" AS ENUM (
    'DRAFT',              -- Instance created but not ready
    'PENDING_APPROVAL',   -- Awaiting approval
    'APPROVED',           -- Approved but not yet active
    'ACTIVE',             -- Currently active/in use
    'SUPERSEDED',         -- Replaced by newer version
    'EXPIRED',            -- Past freshness end date
    'FAILED'              -- Failed quality checks or other issues
);

-- How the instance was created
CREATE TYPE "Forecasts"."RunType" AS ENUM (
    'SCHEDULED',          -- Created via scheduled run
    'MANUAL',             -- Manual ad-hoc creation
    'TRIGGERED',          -- Event-triggered creation
    'BACKFILL',           -- Historical data migration
    'CORRECTION'          -- Correction to existing data
);

-- Types of fundamental inputs
CREATE TYPE "Forecasts"."InputType" AS ENUM (
    'WEATHER_FORECAST',
    'WEATHER_ACTUAL',
    'DEMAND_FORECAST',
    'DEMAND_ACTUAL',
    'GENERATION_FORECAST',
    'GENERATION_ACTUAL',
    'TRANSMISSION_LIMITS',
    'FUEL_PRICES',
    'HYDRO_CONDITIONS',
    'RENEWABLE_FORECAST',
    'MARKET_FUNDAMENTALS',
    'REGULATORY_CHANGES',
    'LEGACY_MIGRATION',
    'OTHER'
);

-- How inputs are used
CREATE TYPE "Forecasts"."UsageType" AS ENUM (
    'PRIMARY',            -- Primary input
    'VALIDATION',         -- Used for validation
    'REFERENCE',          -- Reference data
    'FALLBACK'            -- Fallback if primary unavailable
);

-- Curve product types
CREATE TYPE "Forecasts"."CurveType" AS ENUM (
    'REVENUE',            -- Total revenue curves
    'REVENUE_OTHER',      -- Other revenue types
    'ENERGY',             -- Energy price curves
    'ENERGY_ARB',         -- Energy arbitrage curves
    'AS',                 -- Ancillary services
    'TB2',                -- Two-hour battery
    'TB4',                -- Four-hour battery
    'RA',                 -- Resource adequacy
    'DA',                 -- Day-ahead
    'RT',                 -- Real-time
    'OTHER'               -- Other types
);

-- Battery duration options
CREATE TYPE "Forecasts"."BatteryDuration" AS ENUM (
    '2H',                 -- 2-hour battery
    '2.6H',               -- 2.6-hour battery (Goleta specific)
    '4H',                 -- 4-hour battery
    '8H',                 -- 8-hour battery
    'UNKNOWN',            -- Unknown duration
    'OTHER'               -- Other durations
);

-- Scenario types for forecasts
CREATE TYPE "Forecasts"."ScenarioType" AS ENUM (
    'BASE',               -- Base case scenario
    'LOW',                -- Low case
    'HIGH',               -- High case
    'P50',                -- 50th percentile
    'P90',                -- 90th percentile
    'P10',                -- 10th percentile
    'DOWNSIDE',           -- Downside scenario
    'UPSIDE',             -- Upside scenario
    'WORST',              -- Worst case
    'BEST',               -- Best case
    'ACTUAL',             -- Actual/historical
    'TARGET',             -- Target scenario
    'LOWER_BOUND',        -- Lower bound
    'UPPER_BOUND',        -- Upper bound
    'OTHER'               -- Other scenarios
);

-- Degradation types (for future use)
CREATE TYPE "Forecasts"."DegradationType" AS ENUM (
    'NONE',               -- No degradation
    'YEAR_1',             -- Degradation year 1
    'YEAR_2',             -- Degradation year 2
    'YEAR_5',             -- Degradation year 5
    'YEAR_10',            -- Degradation year 10
    'YEAR_15',            -- Degradation year 15
    'YEAR_20',            -- Degradation year 20
    'CUSTOM',             -- Custom degradation schedule
    'OTHER'               -- Other degradation
);

-- Schedule-related types
CREATE TYPE "Forecasts"."ScheduleType" AS ENUM (
    'REGULAR',            -- Regular recurring schedule
    'AD_HOC',             -- Ad-hoc/one-time
    'TRIGGERED',          -- Event-triggered
    'EVENT_BASED'         -- Based on market events
);

CREATE TYPE "Forecasts"."UpdateFrequency" AS ENUM (
    'HOURLY',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'ANNUALLY',
    'ON_DEMAND'
);

CREATE TYPE "Forecasts"."RunStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'PARTIAL'
);

-- Version change types
CREATE TYPE "Forecasts"."ChangeType" AS ENUM (
    'INITIAL',            -- Initial version
    'UPDATE',             -- Regular update
    'CORRECTION',         -- Correction to existing
    'REVISION',           -- Major revision
    'FINAL',              -- Final version
    'ROLLBACK'            -- Rollback to previous
);

-- ========== STEP 2: CREATE CORE TABLES ==========

-- CurveDefinition: Conceptual curve templates
CREATE TABLE "Forecasts"."CurveDefinition" (
    "id" SERIAL PRIMARY KEY,
    "curveName" VARCHAR(255) UNIQUE NOT NULL,
    "market" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "product" VARCHAR(100) NOT NULL,
    "curveType" "Forecasts"."CurveType" NOT NULL,
    "batteryDuration" "Forecasts"."BatteryDuration" NOT NULL DEFAULT 'UNKNOWN',
    "scenario" "Forecasts"."ScenarioType" NOT NULL DEFAULT 'BASE',
    "degradationType" "Forecasts"."DegradationType" NOT NULL DEFAULT 'NONE',
    "commodity" VARCHAR(50) NOT NULL DEFAULT 'Energy',
    "units" VARCHAR(50) NOT NULL DEFAULT '$/MWh',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(100),
    CONSTRAINT chk_market CHECK (market IN ('ERCOT', 'CAISO', 'PJM', 'MISO', 'SPP', 'NYISO', 'ISO-NE')),
    CONSTRAINT chk_units CHECK (units IN ('$/MWh', '$', '$/MW-yr', '$/MW-mo', '$/MW-day', 'MW', 'MWh'))
);

-- CurveInstance: Specific forecast runs
CREATE TABLE "Forecasts"."CurveInstance" (
    "id" SERIAL PRIMARY KEY,
    "curveDefinitionId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveDefinition"("id"),
    "instanceVersion" VARCHAR(50) NOT NULL,
    "granularity" VARCHAR(20) NOT NULL,
    "deliveryPeriodStart" TIMESTAMPTZ NOT NULL,
    "deliveryPeriodEnd" TIMESTAMPTZ NOT NULL,
    "forecastRunDate" TIMESTAMPTZ NOT NULL,
    "freshnessStartDate" TIMESTAMPTZ NOT NULL,
    "freshnessEndDate" TIMESTAMPTZ,
    "status" "Forecasts"."InstanceStatus" NOT NULL DEFAULT 'DRAFT',
    "modelType" VARCHAR(100),
    "modelVersion" VARCHAR(50),
    "runType" "Forecasts"."RunType" NOT NULL DEFAULT 'MANUAL',
    "createdBy" VARCHAR(100) NOT NULL,
    "approvedBy" VARCHAR(100),
    "approvedAt" TIMESTAMPTZ,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_granularity CHECK (granularity IN ('5MIN', '15MIN', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL')),
    CONSTRAINT chk_delivery_period CHECK ("deliveryPeriodEnd" > "deliveryPeriodStart"),
    CONSTRAINT chk_freshness_dates CHECK ("freshnessEndDate" IS NULL OR "freshnessEndDate" > "freshnessStartDate"),
    CONSTRAINT uk_curve_instance_version UNIQUE ("curveDefinitionId", "instanceVersion")
);

-- PriceForecast: Time series data points
CREATE TABLE "Forecasts"."PriceForecast" (
    "id" SERIAL PRIMARY KEY,
    "curveInstanceId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION CHECK ("confidence" >= 0 AND "confidence" <= 1),
    "valueHigh" DOUBLE PRECISION,
    "valueLow" DOUBLE PRECISION,
    "valueP90" DOUBLE PRECISION,
    "valueP10" DOUBLE PRECISION,
    "flags" TEXT[],
    CONSTRAINT chk_value_bounds CHECK (
        ("valueHigh" IS NULL OR "valueHigh" >= "value") AND
        ("valueLow" IS NULL OR "valueLow" <= "value")
    ),
    CONSTRAINT uk_instance_timestamp UNIQUE ("curveInstanceId", "timestamp")
);

-- CurveSchedule: When curves need updates
CREATE TABLE "Forecasts"."CurveSchedule" (
    "id" SERIAL PRIMARY KEY,
    "curveDefinitionId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveDefinition"("id"),
    "scheduleType" "Forecasts"."ScheduleType" NOT NULL DEFAULT 'REGULAR',
    "frequency" "Forecasts"."UpdateFrequency" NOT NULL,
    "dayOfWeek" INTEGER CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
    "dayOfMonth" INTEGER CHECK ("dayOfMonth" >= 1 AND "dayOfMonth" <= 31),
    "timeOfDay" TIME DEFAULT '09:00:00',
    "leadTimeDays" INTEGER DEFAULT 0,
    "freshnessHours" INTEGER NOT NULL DEFAULT 720, -- 30 days default
    "responsibleTeam" VARCHAR(100) NOT NULL DEFAULT 'Market Analysis',
    "notificationEmails" TEXT[],
    "importance" INTEGER NOT NULL DEFAULT 3 CHECK ("importance" >= 1 AND "importance" <= 5),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_valid_period CHECK ("validUntil" IS NULL OR "validUntil" > "validFrom")
);

-- CurveInputLineage: Track fundamental inputs
CREATE TABLE "Forecasts"."CurveInputLineage" (
    "id" SERIAL PRIMARY KEY,
    "curveInstanceId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE,
    "inputType" "Forecasts"."InputType" NOT NULL,
    "inputSource" VARCHAR(100) NOT NULL,
    "inputIdentifier" VARCHAR(255) NOT NULL,
    "inputVersion" VARCHAR(50),
    "inputTimestamp" TIMESTAMPTZ NOT NULL,
    "usageType" "Forecasts"."UsageType" NOT NULL,
    "transformApplied" TEXT,
    "weight" DOUBLE PRECISION CHECK ("weight" >= 0 AND "weight" <= 1),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========== STEP 3: CREATE SUPPORTING TABLES ==========

-- Version history tracking
CREATE TABLE "Forecasts"."VersionHistory" (
    "id" SERIAL PRIMARY KEY,
    "curveInstanceId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveInstance"("id"),
    "previousInstanceId" INTEGER REFERENCES "Forecasts"."CurveInstance"("id"),
    "changeType" "Forecasts"."ChangeType" NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedBy" VARCHAR(100) NOT NULL,
    "changedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeDetails" JSONB
);

-- Schedule run tracking
CREATE TABLE "Forecasts"."ScheduleRun" (
    "id" SERIAL PRIMARY KEY,
    "scheduleId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveSchedule"("id"),
    "scheduledFor" TIMESTAMPTZ NOT NULL,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "status" "Forecasts"."RunStatus" NOT NULL DEFAULT 'PENDING',
    "instancesCreated" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB
);

-- Quality metrics
CREATE TABLE "Forecasts"."QualityMetric" (
    "id" SERIAL PRIMARY KEY,
    "curveInstanceId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveInstance"("id"),
    "metricType" VARCHAR(50) NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "comparisonType" VARCHAR(50),
    "comparisonId" INTEGER,
    "calculatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB
);

-- Default curve inputs configuration
CREATE TABLE "Forecasts"."DefaultCurveInput" (
    "id" SERIAL PRIMARY KEY,
    "curveDefinitionId" INTEGER NOT NULL REFERENCES "Forecasts"."CurveDefinition"("id"),
    "inputType" "Forecasts"."InputType" NOT NULL,
    "inputSource" VARCHAR(100) NOT NULL,
    "inputIdentifier" VARCHAR(255) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "defaultWeight" DOUBLE PRECISION CHECK ("defaultWeight" >= 0 AND "defaultWeight" <= 1),
    "validFrom" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMPTZ
);

-- ========== STEP 4: CREATE INDEXES ==========

-- CurveDefinition indexes
CREATE INDEX idx_curve_def_market_location ON "Forecasts"."CurveDefinition"("market", "location");
CREATE INDEX idx_curve_def_type_battery_scenario ON "Forecasts"."CurveDefinition"("curveType", "batteryDuration", "scenario");
CREATE INDEX idx_curve_def_active ON "Forecasts"."CurveDefinition"("isActive") WHERE "isActive" = true;
CREATE INDEX idx_curve_def_created_at ON "Forecasts"."CurveDefinition"("createdAt");

-- CurveInstance indexes
CREATE INDEX idx_curve_instance_definition ON "Forecasts"."CurveInstance"("curveDefinitionId");
CREATE INDEX idx_curve_instance_status ON "Forecasts"."CurveInstance"("status");
CREATE INDEX idx_curve_instance_freshness ON "Forecasts"."CurveInstance"("freshnessStartDate", "freshnessEndDate");
CREATE INDEX idx_curve_instance_delivery ON "Forecasts"."CurveInstance"("deliveryPeriodStart", "deliveryPeriodEnd");
CREATE INDEX idx_curve_instance_forecast_date ON "Forecasts"."CurveInstance"("forecastRunDate");
CREATE INDEX idx_curve_instance_granularity ON "Forecasts"."CurveInstance"("curveDefinitionId", "granularity");

-- PriceForecast indexes
CREATE INDEX idx_price_forecast_instance ON "Forecasts"."PriceForecast"("curveInstanceId");
CREATE INDEX idx_price_forecast_timestamp ON "Forecasts"."PriceForecast"("timestamp");
CREATE INDEX idx_price_forecast_instance_time ON "Forecasts"."PriceForecast"("curveInstanceId", "timestamp");

-- CurveSchedule indexes
CREATE INDEX idx_curve_schedule_definition ON "Forecasts"."CurveSchedule"("curveDefinitionId");
CREATE INDEX idx_curve_schedule_active ON "Forecasts"."CurveSchedule"("isActive", "validFrom", "validUntil");
CREATE INDEX idx_curve_schedule_frequency ON "Forecasts"."CurveSchedule"("frequency");

-- CurveInputLineage indexes
CREATE INDEX idx_curve_lineage_instance ON "Forecasts"."CurveInputLineage"("curveInstanceId");
CREATE INDEX idx_curve_lineage_type ON "Forecasts"."CurveInputLineage"("inputType");
CREATE INDEX idx_curve_lineage_source ON "Forecasts"."CurveInputLineage"("inputSource");

-- ========== STEP 5: CREATE HELPER FUNCTIONS ==========

-- Get active curve instance for a definition at a point in time
CREATE OR REPLACE FUNCTION "Forecasts".get_active_instance_for_date(
    p_definition_id INTEGER,
    p_delivery_date TIMESTAMPTZ,
    p_as_of_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_instance_id INTEGER;
BEGIN
    SELECT ci."id" INTO v_instance_id
    FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = p_definition_id
      AND ci."deliveryPeriodStart" <= p_delivery_date
      AND ci."deliveryPeriodEnd" >= p_delivery_date
      AND ci."freshnessStartDate" <= p_as_of_date
      AND (ci."freshnessEndDate" IS NULL OR ci."freshnessEndDate" > p_as_of_date)
      AND ci."status" = 'ACTIVE'
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1;
    
    RETURN v_instance_id;
END;
$$;

-- Create a new curve instance version
CREATE OR REPLACE FUNCTION "Forecasts".create_curve_instance_version(
    p_definition_id INTEGER,
    p_delivery_start TIMESTAMPTZ,
    p_delivery_end TIMESTAMPTZ,
    p_granularity VARCHAR,
    p_created_by VARCHAR,
    p_run_type "Forecasts"."RunType" DEFAULT 'MANUAL',
    p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_instance_id INTEGER;
    v_previous_instance_id INTEGER;
    v_version_number INTEGER;
    v_new_version VARCHAR;
BEGIN
    -- Find previous instance for same delivery period
    SELECT ci."id" INTO v_previous_instance_id
    FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = p_definition_id
      AND ci."deliveryPeriodStart" = p_delivery_start
      AND ci."granularity" = p_granularity
      AND ci."status" = 'ACTIVE'
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1;
    
    -- Calculate version number
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(ci."instanceVersion" FROM 'v([0-9]+)$') AS INTEGER)
    ), 0) + 1 INTO v_version_number
    FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = p_definition_id
      AND ci."deliveryPeriodStart" = p_delivery_start
      AND ci."granularity" = p_granularity;
    
    v_new_version := CONCAT(
        TO_CHAR(p_delivery_start, 'YYYY_MM'), '_',
        LOWER(p_granularity), '_v',
        v_version_number
    );
    
    -- Expire previous instance if exists
    IF v_previous_instance_id IS NOT NULL THEN
        UPDATE "Forecasts"."CurveInstance"
        SET "freshnessEndDate" = CURRENT_TIMESTAMP,
            "status" = 'SUPERSEDED',
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = v_previous_instance_id;
    END IF;
    
    -- Create new instance
    INSERT INTO "Forecasts"."CurveInstance" (
        "curveDefinitionId",
        "instanceVersion",
        "granularity",
        "deliveryPeriodStart",
        "deliveryPeriodEnd",
        "forecastRunDate",
        "freshnessStartDate",
        "status",
        "runType",
        "createdBy",
        "notes"
    ) VALUES (
        p_definition_id,
        v_new_version,
        p_granularity,
        p_delivery_start,
        p_delivery_end,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        'ACTIVE',
        p_run_type,
        p_created_by,
        p_notes
    )
    RETURNING "id" INTO v_new_instance_id;
    
    -- Create version history entry
    IF v_previous_instance_id IS NOT NULL THEN
        INSERT INTO "Forecasts"."VersionHistory" (
            "curveInstanceId",
            "previousInstanceId",
            "changeType",
            "changeReason",
            "changedBy"
        ) VALUES (
            v_new_instance_id,
            v_previous_instance_id,
            'UPDATE',
            COALESCE(p_notes, 'New version created'),
            p_created_by
        );
    ELSE
        INSERT INTO "Forecasts"."VersionHistory" (
            "curveInstanceId",
            "changeType",
            "changeReason",
            "changedBy"
        ) VALUES (
            v_new_instance_id,
            'INITIAL',
            COALESCE(p_notes, 'Initial version'),
            p_created_by
        );
    END IF;
    
    RETURN v_new_instance_id;
END;
$$;

-- ========== STEP 6: CREATE VIEWS ==========

-- View for upload curves page
CREATE OR REPLACE VIEW "Forecasts".upload_page_curves AS
SELECT 
    cd."id" AS definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cd."curveType",
    cd."batteryDuration",
    cd."scenario",
    cd."units",
    latest."instanceVersion" AS latest_version,
    latest."granularity" AS latest_granularity,
    latest."deliveryPeriodEnd" AS latest_period_end,
    latest."forecastRunDate" AS last_updated,
    COUNT(DISTINCT ci."id") AS total_instances,
    COUNT(DISTINCT pf."id") AS total_price_points
FROM "Forecasts"."CurveDefinition" cd
LEFT JOIN LATERAL (
    SELECT * FROM "Forecasts"."CurveInstance"
    WHERE "curveDefinitionId" = cd."id"
    AND "status" = 'ACTIVE'
    ORDER BY "forecastRunDate" DESC
    LIMIT 1
) latest ON true
LEFT JOIN "Forecasts"."CurveInstance" ci ON ci."curveDefinitionId" = cd."id"
LEFT JOIN "Forecasts"."PriceForecast" pf ON pf."curveInstanceId" = ci."id"
WHERE cd."isActive" = true
GROUP BY cd."id", cd."curveName", cd."market", cd."location", cd."product",
         cd."curveType", cd."batteryDuration", cd."scenario", cd."units",
         latest."instanceVersion", latest."granularity",
         latest."deliveryPeriodEnd", latest."forecastRunDate";

-- View for inventory page
CREATE OR REPLACE VIEW "Forecasts".inventory_page_instances AS
SELECT 
    ci."id" AS instance_id,
    cd."id" AS definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cd."curveType",
    cd."batteryDuration",
    cd."scenario",
    ci."instanceVersion",
    ci."granularity",
    ci."deliveryPeriodStart",
    ci."deliveryPeriodEnd",
    ci."forecastRunDate",
    ci."status",
    ci."modelType",
    COUNT(pf."id") AS price_count,
    MIN(pf."timestamp") AS data_start,
    MAX(pf."timestamp") AS data_end,
    ci."metadata",
    ci."createdBy",
    ci."createdAt"
FROM "Forecasts"."CurveInstance" ci
JOIN "Forecasts"."CurveDefinition" cd ON cd."id" = ci."curveDefinitionId"
LEFT JOIN "Forecasts"."PriceForecast" pf ON pf."curveInstanceId" = ci."id"
GROUP BY ci."id", cd."id", cd."curveName", cd."market", cd."location",
         cd."product", cd."curveType", cd."batteryDuration", cd."scenario",
         ci."instanceVersion", ci."granularity", ci."deliveryPeriodStart",
         ci."deliveryPeriodEnd", ci."forecastRunDate", ci."status",
         ci."modelType", ci."metadata", ci."createdBy", ci."createdAt";

-- View for curves needing updates
CREATE OR REPLACE VIEW "Forecasts".curves_needing_update AS
SELECT 
    cs."id" AS schedule_id,
    cd."id" AS definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cd."curveType",
    cd."batteryDuration",
    cd."scenario",
    cs."frequency",
    cs."freshnessHours",
    cs."responsibleTeam",
    latest."forecastRunDate" AS last_updated,
    CASE 
        WHEN latest."forecastRunDate" IS NULL THEN CURRENT_TIMESTAMP
        WHEN cs."frequency" = 'HOURLY' THEN latest."forecastRunDate" + INTERVAL '1 hour'
        WHEN cs."frequency" = 'DAILY' THEN latest."forecastRunDate" + INTERVAL '1 day'
        WHEN cs."frequency" = 'WEEKLY' THEN latest."forecastRunDate" + INTERVAL '1 week'
        WHEN cs."frequency" = 'MONTHLY' THEN latest."forecastRunDate" + INTERVAL '1 month'
        WHEN cs."frequency" = 'QUARTERLY' THEN latest."forecastRunDate" + INTERVAL '3 months'
        WHEN cs."frequency" = 'ANNUALLY' THEN latest."forecastRunDate" + INTERVAL '1 year'
        ELSE latest."forecastRunDate" + INTERVAL '30 days'
    END AS next_update_due,
    CASE 
        WHEN latest."forecastRunDate" IS NULL THEN true
        WHEN latest."forecastRunDate" + (cs."freshnessHours" || ' hours')::INTERVAL < CURRENT_TIMESTAMP THEN true
        ELSE false
    END AS is_stale
FROM "Forecasts"."CurveSchedule" cs
JOIN "Forecasts"."CurveDefinition" cd ON cd."id" = cs."curveDefinitionId"
LEFT JOIN LATERAL (
    SELECT * FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = cs."curveDefinitionId"
      AND ci."status" = 'ACTIVE'
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1
) latest ON true
WHERE cs."isActive" = true
  AND cd."isActive" = true
  AND (cs."validUntil" IS NULL OR cs."validUntil" > CURRENT_TIMESTAMP);

-- View for curve types and scenarios distribution
CREATE OR REPLACE VIEW "Forecasts".curves_by_type_and_scenario AS
SELECT 
    cd."curveType",
    cd."scenario",
    cd."batteryDuration",
    cd."market",
    cd."location",
    COUNT(DISTINCT cd."id") AS definition_count,
    COUNT(DISTINCT ci."id") AS instance_count,
    STRING_AGG(DISTINCT cd."curveName", ', ' ORDER BY cd."curveName") AS curve_names
FROM "Forecasts"."CurveDefinition" cd
LEFT JOIN "Forecasts"."CurveInstance" ci ON ci."curveDefinitionId" = cd."id"
GROUP BY cd."curveType", cd."scenario", cd."batteryDuration", cd."market", cd."location"
ORDER BY cd."curveType", cd."scenario", cd."batteryDuration", cd."market", cd."location";

-- ========== STEP 7: CREATE TRIGGERS FOR UPDATED TIMESTAMPS ==========

-- Function to update timestamps
CREATE OR REPLACE FUNCTION "Forecasts".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_curve_definition_updated_at BEFORE UPDATE ON "Forecasts"."CurveDefinition"
    FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

CREATE TRIGGER update_curve_instance_updated_at BEFORE UPDATE ON "Forecasts"."CurveInstance"
    FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

CREATE TRIGGER update_curve_schedule_updated_at BEFORE UPDATE ON "Forecasts"."CurveSchedule"
    FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

-- ========== STEP 8: VERIFICATION ==========

DO $$
DECLARE
    v_table_count INTEGER;
    v_type_count INTEGER;
    v_view_count INTEGER;
    v_function_count INTEGER;
BEGIN
    -- Count created objects
    SELECT COUNT(*) INTO v_table_count FROM pg_tables WHERE schemaname = 'Forecasts';
    SELECT COUNT(*) INTO v_type_count FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'Forecasts' AND t.typtype = 'e';
    SELECT COUNT(*) INTO v_view_count FROM pg_views WHERE schemaname = 'Forecasts';
    SELECT COUNT(*) INTO v_function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'Forecasts';
    
    RAISE NOTICE '';
    RAISE NOTICE '===== SCHEMA CREATION COMPLETE =====';
    RAISE NOTICE 'Tables created: %', v_table_count;
    RAISE NOTICE 'Custom types created: %', v_type_count;
    RAISE NOTICE 'Views created: %', v_view_count;
    RAISE NOTICE 'Functions created: %', v_function_count;
    RAISE NOTICE '';
    RAISE NOTICE 'The energy forecast schema is ready for use!';
END $$;

COMMIT;

-- =====================================================
-- Schema is ready! Next steps:
-- 1. Run 03_sample_data_structure.sql to see examples
-- 2. Use 04_migrate_legacy_data.sql if you have data to migrate
-- ===================================================== 