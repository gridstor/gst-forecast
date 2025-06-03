-- Energy Forecast Architecture Redesign Migration
-- This script transforms the existing simple model to a sophisticated versioned forecast model

BEGIN;

-- ========== STEP 1: CREATE NEW TABLES ==========

-- Create ENUMs first
CREATE TYPE "InstanceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'EXPIRED', 'FAILED');
CREATE TYPE "RunType" AS ENUM ('SCHEDULED', 'MANUAL', 'TRIGGERED', 'BACKFILL', 'CORRECTION');
CREATE TYPE "InputType" AS ENUM ('WEATHER_FORECAST', 'WEATHER_ACTUAL', 'DEMAND_FORECAST', 'DEMAND_ACTUAL', 
    'GENERATION_FORECAST', 'GENERATION_ACTUAL', 'TRANSMISSION_LIMITS', 'FUEL_PRICES', 
    'HYDRO_CONDITIONS', 'RENEWABLE_FORECAST', 'MARKET_FUNDAMENTALS', 'REGULATORY_CHANGES', 'OTHER');
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
    "status" "InstanceStatus" DEFAULT 'DRAFT',
    "modelType" VARCHAR(100),
    "modelVersion" VARCHAR(50),
    "runType" "RunType" DEFAULT 'SCHEDULED',
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
CREATE INDEX idx_curve_instance_run_date ON "CurveInstance"("forecastRunDate");
CREATE INDEX idx_curve_instance_status ON "CurveInstance"("status");

-- Create new PriceForecast table (rename existing one first)
ALTER TABLE "price_forecasts" RENAME TO "price_forecasts_legacy";

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
CREATE INDEX idx_input_lineage_type_source ON "CurveInputLineage"("inputType", "inputSource");

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
CREATE INDEX idx_version_history_date ON "VersionHistory"("changedAt");

-- Create enhanced CurveSchedule table (rename existing)
ALTER TABLE "curve_schedule" RENAME TO "curve_schedule_legacy";

CREATE TABLE "CurveSchedule" (
    "id" SERIAL PRIMARY KEY,
    "curve_definition_id" INTEGER NOT NULL REFERENCES "CurveDefinition"("id"),
    "scheduleType" "ScheduleType" NOT NULL,
    "frequency" "UpdateFrequency" NOT NULL,
    "dayOfWeek" INTEGER CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
    "dayOfMonth" INTEGER CHECK ("dayOfMonth" >= 1 AND "dayOfMonth" <= 31),
    "timeOfDay" VARCHAR(5),
    "leadTimeDays" INTEGER DEFAULT 0,
    "freshnessHours" INTEGER DEFAULT 24,
    "responsibleTeam" VARCHAR(100) NOT NULL,
    "importance" INTEGER DEFAULT 3,
    "isActive" BOOLEAN DEFAULT true,
    "validFrom" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_curve_schedule_definition ON "CurveSchedule"("curve_definition_id");
CREATE INDEX idx_curve_schedule_active ON "CurveSchedule"("isActive", "validFrom", "validUntil");

-- Create ScheduleRun table
CREATE TABLE "ScheduleRun" (
    "id" SERIAL PRIMARY KEY,
    "schedule_id" INTEGER NOT NULL REFERENCES "CurveSchedule"("id"),
    "scheduledFor" TIMESTAMP NOT NULL,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "status" "RunStatus" NOT NULL,
    "instancesCreated" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB
);

CREATE INDEX idx_schedule_run_schedule ON "ScheduleRun"("schedule_id", "scheduledFor");
CREATE INDEX idx_schedule_run_status ON "ScheduleRun"("status");

-- Create QualityMetric table
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

CREATE INDEX idx_quality_metric_instance ON "QualityMetric"("curve_instance_id");
CREATE INDEX idx_quality_metric_type ON "QualityMetric"("metricType");

-- Create DefaultCurveInput table
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

CREATE INDEX idx_default_input_definition ON "DefaultCurveInput"("curve_definition_id");

-- Create LegacyCurveMapping table
CREATE TABLE "LegacyCurveMapping" (
    "id" SERIAL PRIMARY KEY,
    "oldCurveId" INTEGER UNIQUE NOT NULL,
    "newCurveDefinitionId" INTEGER NOT NULL,
    "migrationNotes" TEXT,
    "migratedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== STEP 2: MIGRATE DATA ==========

-- Create CurveDefinition entries from existing curve_definitions
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
SELECT DISTINCT
    UPPER(CONCAT(
        COALESCE(market, 'UNKNOWN'), '_',
        COALESCE(mark_type, 'UNKNOWN'), '_',
        COALESCE(location, 'UNKNOWN')
    )) as "curveName",
    COALESCE(market, 'UNKNOWN') as "market",
    COALESCE(location, 'UNKNOWN') as "location",
    COALESCE(mark_type, 'LMP') as "product",
    CASE 
        WHEN value_type LIKE '%energy%' THEN 'Energy'
        WHEN value_type LIKE '%capacity%' THEN 'Capacity'
        ELSE 'Energy'
    END as "commodity",
    COALESCE(
        CASE 
            WHEN value_type LIKE '%$/MWh%' THEN '$/MWh'
            WHEN value_type LIKE '%$/MW%' THEN '$/MW-day'
            ELSE '$/MWh'
        END,
        '$/MWh'
    ) as "units",
    COALESCE(granularity, 'HOURLY') as "granularity",
    CASE 
        WHEN market = 'CAISO' THEN 'America/Los_Angeles'
        WHEN market = 'ERCOT' THEN 'America/Chicago'
        ELSE 'UTC'
    END as "timezone",
    CONCAT('Migrated from legacy curve: ', mark_type, ' - ', mark_case) as "description",
    true as "isActive",
    jsonb_build_object(
        'legacy_curve_id', curve_id,
        'legacy_mark_case', mark_case,
        'legacy_curve_creator', curve_creator,
        'legacy_value_type', value_type
    ) as "metadata",
    COALESCE(created_at, CURRENT_TIMESTAMP) as "createdAt"
FROM "Forecasts".curve_definitions;

-- Create mapping table entries
INSERT INTO "LegacyCurveMapping" ("oldCurveId", "newCurveDefinitionId", "migrationNotes")
SELECT 
    cd.curve_id,
    cdef.id,
    'Initial migration from legacy model'
FROM "Forecasts".curve_definitions cd
JOIN "CurveDefinition" cdef ON 
    cdef."curveName" = UPPER(CONCAT(
        COALESCE(cd.market, 'UNKNOWN'), '_',
        COALESCE(cd.mark_type, 'UNKNOWN'), '_',
        COALESCE(cd.location, 'UNKNOWN')
    ));

-- Create initial CurveInstance for each existing curve with price data
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
    "notes",
    "metadata"
)
SELECT DISTINCT
    lcm."newCurveDefinitionId",
    'legacy_v1' as "instanceVersion",
    COALESCE(
        (SELECT MIN(flow_date_start) FROM "Forecasts".price_forecasts WHERE curve_id = cd.curve_id),
        cd.curve_start_date,
        CURRENT_DATE
    ) as "deliveryPeriodStart",
    COALESCE(
        (SELECT MAX(flow_date_start) FROM "Forecasts".price_forecasts WHERE curve_id = cd.curve_id),
        cd.curve_end_date,
        CURRENT_DATE + INTERVAL '1 year'
    ) as "deliveryPeriodEnd",
    COALESCE(cd.mark_date, cd.created_at, CURRENT_TIMESTAMP) as "forecastRunDate",
    COALESCE(cd.mark_date, cd.created_at, CURRENT_TIMESTAMP) as "freshnessStartDate",
    NULL as "freshnessEndDate", -- Current active version
    'ACTIVE' as "status",
    COALESCE(cd.mark_model_type_desc, 'Historical') as "modelType",
    'BACKFILL' as "runType",
    'migration_script' as "createdBy",
    'Migrated from legacy curve_definitions table' as "notes",
    jsonb_build_object(
        'legacy_curve_id', cd.curve_id,
        'legacy_mark_date', cd.mark_date,
        'legacy_fundamentals_desc', cd.mark_fundamentals_desc,
        'legacy_dispatch_optimization_desc', cd.mark_dispatch_optimization_desc
    ) as "metadata"
FROM "Forecasts".curve_definitions cd
JOIN "LegacyCurveMapping" lcm ON lcm."oldCurveId" = cd.curve_id
WHERE EXISTS (
    SELECT 1 FROM "Forecasts".price_forecasts pf WHERE pf.curve_id = cd.curve_id
);

-- Migrate price forecast data
INSERT INTO "PriceForecast" (
    "curve_instance_id",
    "timestamp",
    "value",
    "confidence",
    "valueHigh",
    "valueLow",
    "flags"
)
SELECT 
    ci.id as "curve_instance_id",
    pf.flow_date_start as "timestamp",
    pf.value as "value",
    NULL as "confidence",
    NULL as "valueHigh",
    NULL as "valueLow",
    ARRAY[]::TEXT[] as "flags"
FROM "Forecasts".price_forecasts pf
JOIN "LegacyCurveMapping" lcm ON lcm."oldCurveId" = pf.curve_id
JOIN "CurveInstance" ci ON 
    ci."curve_definition_id" = lcm."newCurveDefinitionId" 
    AND ci."instanceVersion" = 'legacy_v1';

-- Migrate curve schedules
INSERT INTO "CurveSchedule" (
    "curve_definition_id",
    "scheduleType",
    "frequency",
    "dayOfWeek",
    "dayOfMonth",
    "timeOfDay",
    "leadTimeDays",
    "freshnessHours",
    "responsibleTeam",
    "importance",
    "isActive",
    "metadata"
)
SELECT 
    lcm."newCurveDefinitionId",
    'REGULAR' as "scheduleType",
    CASE 
        WHEN cs.update_frequency = 'DAILY' THEN 'DAILY'::UpdateFrequency
        WHEN cs.update_frequency = 'WEEKLY' THEN 'WEEKLY'::UpdateFrequency
        WHEN cs.update_frequency = 'MONTHLY' THEN 'MONTHLY'::UpdateFrequency
        WHEN cs.update_frequency = 'QUARTERLY' THEN 'QUARTERLY'::UpdateFrequency
        ELSE 'ON_DEMAND'::UpdateFrequency
    END as "frequency",
    NULL as "dayOfWeek",
    cs.update_day as "dayOfMonth",
    '09:00' as "timeOfDay", -- Default morning run
    0 as "leadTimeDays",
    CASE 
        WHEN cs.update_frequency = 'DAILY' THEN 24
        WHEN cs.update_frequency = 'WEEKLY' THEN 168
        WHEN cs.update_frequency = 'MONTHLY' THEN 720
        ELSE 2160 -- 90 days for quarterly
    END as "freshnessHours",
    cs.responsible_team,
    cs.importance,
    true as "isActive",
    jsonb_build_object(
        'legacy_schedule_id', cs.schedule_id,
        'legacy_curve_pattern', cs.curve_pattern,
        'legacy_source_type', cs.source_type,
        'legacy_provider', cs.provider
    ) as "metadata"
FROM curve_schedule_legacy cs
LEFT JOIN "LegacyCurveMapping" lcm ON lcm."oldCurveId" = cs.curve_id
WHERE lcm."newCurveDefinitionId" IS NOT NULL;

-- ========== STEP 3: CREATE HELPER FUNCTIONS ==========

-- Function to get current active forecast instances
CREATE OR REPLACE FUNCTION get_active_curve_instances(
    p_curve_definition_id INTEGER DEFAULT NULL,
    p_as_of_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    curve_instance_id INTEGER,
    curve_definition_id INTEGER,
    instance_version VARCHAR,
    delivery_period_start TIMESTAMP,
    delivery_period_end TIMESTAMP,
    freshness_start TIMESTAMP,
    freshness_end TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.curve_definition_id,
        ci."instanceVersion",
        ci."deliveryPeriodStart",
        ci."deliveryPeriodEnd",
        ci."freshnessStartDate",
        ci."freshnessEndDate"
    FROM "CurveInstance" ci
    WHERE 
        ci.status = 'ACTIVE'
        AND ci."freshnessStartDate" <= p_as_of_date
        AND (ci."freshnessEndDate" IS NULL OR ci."freshnessEndDate" > p_as_of_date)
        AND (p_curve_definition_id IS NULL OR ci.curve_definition_id = p_curve_definition_id)
    ORDER BY 
        ci.curve_definition_id,
        ci."deliveryPeriodStart",
        ci."freshnessStartDate" DESC;
END;
$$;

-- Function to create a new curve instance version
CREATE OR REPLACE FUNCTION create_curve_instance_version(
    p_curve_definition_id INTEGER,
    p_delivery_start TIMESTAMP,
    p_delivery_end TIMESTAMP,
    p_version_suffix VARCHAR DEFAULT NULL,
    p_created_by VARCHAR DEFAULT 'system'
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
    -- Find the latest version for this curve and delivery period
    SELECT ci.id, 
           COALESCE(
               CAST(SUBSTRING(ci."instanceVersion" FROM 'v(\d+)') AS INTEGER),
               0
           ) + 1
    INTO v_previous_instance_id, v_version_number
    FROM "CurveInstance" ci
    WHERE ci.curve_definition_id = p_curve_definition_id
      AND ci."deliveryPeriodStart" = p_delivery_start
    ORDER BY ci.id DESC
    LIMIT 1;

    -- Generate new version string
    v_new_version := 'v' || COALESCE(v_version_number, 1);
    IF p_version_suffix IS NOT NULL THEN
        v_new_version := v_new_version || '_' || p_version_suffix;
    END IF;

    -- Expire the previous active instance
    IF v_previous_instance_id IS NOT NULL THEN
        UPDATE "CurveInstance"
        SET "freshnessEndDate" = CURRENT_TIMESTAMP,
            status = 'SUPERSEDED',
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = v_previous_instance_id
          AND "freshnessEndDate" IS NULL;
    END IF;

    -- Create new instance
    INSERT INTO "CurveInstance" (
        curve_definition_id,
        "instanceVersion",
        "deliveryPeriodStart",
        "deliveryPeriodEnd",
        "forecastRunDate",
        "freshnessStartDate",
        "freshnessEndDate",
        status,
        "runType",
        "createdBy"
    ) VALUES (
        p_curve_definition_id,
        v_new_version,
        p_delivery_start,
        p_delivery_end,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        NULL,
        'DRAFT',
        'MANUAL',
        p_created_by
    ) RETURNING id INTO v_new_instance_id;

    -- Create version history entry
    INSERT INTO "VersionHistory" (
        curve_instance_id,
        previous_instance_id,
        "changeType",
        "changeReason",
        "changedBy"
    ) VALUES (
        v_new_instance_id,
        v_previous_instance_id,
        CASE WHEN v_previous_instance_id IS NULL THEN 'INITIAL' ELSE 'UPDATE' END,
        'New version created',
        p_created_by
    );

    RETURN v_new_instance_id;
END;
$$;

-- ========== STEP 4: CREATE VIEWS FOR BACKWARD COMPATIBILITY ==========

-- Create a view that mimics the old curve_definitions structure
CREATE OR REPLACE VIEW curve_definitions_compat AS
SELECT 
    cd.id as curve_id,
    cd."market" as market,
    cd."location" as location,
    cd."product" as mark_type,
    ci."modelType" as mark_model_type_desc,
    cd."description" as mark_case,
    ci."forecastRunDate" as mark_date,
    cd."units" as units,
    cd."granularity" as granularity,
    cd."metadata"->>'legacy_curve_creator' as curve_creator,
    cd."commodity" as value_type,
    cd."createdAt" as created_at,
    ci."deliveryPeriodStart" as curve_start_date,
    ci."deliveryPeriodEnd" as curve_end_date
FROM "CurveDefinition" cd
LEFT JOIN LATERAL (
    SELECT * FROM "CurveInstance" ci
    WHERE ci.curve_definition_id = cd.id
      AND ci.status = 'ACTIVE'
      AND ci."freshnessEndDate" IS NULL
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1
) ci ON true;

-- Create updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updatedAt
CREATE TRIGGER update_curve_definition_updated_at BEFORE UPDATE ON "CurveDefinition"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_curve_instance_updated_at BEFORE UPDATE ON "CurveInstance"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_curve_schedule_updated_at BEFORE UPDATE ON "CurveSchedule"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT; 