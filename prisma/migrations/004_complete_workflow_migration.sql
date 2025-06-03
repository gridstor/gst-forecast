-- Complete Workflow Migration
-- Run this AFTER workflow-compatible-consolidation.sql
-- Sets up scheduling, views, and remaining infrastructure

BEGIN;

-- ========== STEP 0: VERIFY CONSOLIDATION WAS RUN ==========

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CurveDefinition') THEN
        RAISE EXCEPTION 'Please run workflow-compatible-consolidation.sql first';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'LegacyCurveMapping') THEN
        RAISE EXCEPTION 'LegacyCurveMapping not found - ensure consolidation completed successfully';
    END IF;
END $$;

-- ========== STEP 1: CREATE REMAINING ENUMS ==========

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

-- ========== STEP 2: CREATE SCHEDULING TABLES ==========

-- Rename old curve_schedule if exists
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
    "importance" INTEGER DEFAULT 3 CHECK ("importance" >= 1 AND "importance" <= 5),
    "isActive" BOOLEAN DEFAULT true,
    "validFrom" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_curve_schedule_definition ON "CurveSchedule"("curve_definition_id");
CREATE INDEX IF NOT EXISTS idx_curve_schedule_active ON "CurveSchedule"("isActive", "validFrom", "validUntil");

-- ========== STEP 3: CREATE SCHEDULES BASED ON CURVES ==========

-- Create intelligent schedules based on curve characteristics
INSERT INTO "CurveSchedule" (
    "curve_definition_id",
    "scheduleType",
    "frequency",
    "dayOfWeek",
    "dayOfMonth",
    "timeOfDay",
    "freshnessHours",
    "responsibleTeam",
    "importance",
    "metadata"
)
SELECT 
    cd.id,
    'REGULAR'::"ScheduleType",
    -- Determine frequency based on product and instance characteristics
    CASE 
        WHEN cd."product" LIKE '%RT%' OR cd."product" LIKE '%Real%Time%' THEN 'HOURLY'::"UpdateFrequency"
        WHEN cd."product" LIKE '%DA%' OR cd."product" LIKE '%Day%Ahead%' THEN 'DAILY'::"UpdateFrequency"
        WHEN EXISTS (
            SELECT 1 FROM "CurveInstance" ci 
            WHERE ci."curve_definition_id" = cd.id 
            AND ci."granularity" IN ('HOURLY', '15MIN', '5MIN')
        ) THEN 'DAILY'::"UpdateFrequency"
        WHEN EXISTS (
            SELECT 1 FROM "CurveInstance" ci 
            WHERE ci."curve_definition_id" = cd.id 
            AND ci."granularity" = 'DAILY'
        ) THEN 'WEEKLY'::"UpdateFrequency"
        ELSE 'MONTHLY'::"UpdateFrequency"
    END as "frequency",
    2 as "dayOfWeek", -- Tuesday for weekly
    1 as "dayOfMonth", -- 1st for monthly
    CASE 
        WHEN cd."product" LIKE '%RT%' THEN '00:00'
        WHEN cd."product" LIKE '%DA%' THEN '10:00'
        ELSE '09:00'
    END as "timeOfDay",
    CASE 
        WHEN cd."product" LIKE '%RT%' THEN 24      -- 1 day for real-time
        WHEN cd."product" LIKE '%DA%' THEN 48      -- 2 days for day-ahead
        WHEN EXISTS (
            SELECT 1 FROM "CurveInstance" ci 
            WHERE ci."curve_definition_id" = cd.id 
            AND ci."granularity" IN ('HOURLY', 'DAILY')
        ) THEN 168  -- 7 days for hourly/daily
        ELSE 720    -- 30 days for monthly
    END as "freshnessHours",
    'Market Analysis' as "responsibleTeam",
    CASE 
        WHEN cd."product" LIKE '%RT%' OR cd."product" LIKE '%DA%' THEN 5  -- High importance
        WHEN cd."market" = 'ERCOT' THEN 4  -- ERCOT higher priority
        ELSE 3  -- Medium importance
    END as "importance",
    jsonb_build_object(
        'auto_generated', true,
        'generation_date', CURRENT_TIMESTAMP,
        'based_on_instances', (
            SELECT jsonb_agg(DISTINCT ci."granularity")
            FROM "CurveInstance" ci
            WHERE ci."curve_definition_id" = cd.id
        )
    )
FROM "CurveDefinition" cd
WHERE NOT EXISTS (
    SELECT 1 FROM "CurveSchedule" cs 
    WHERE cs."curve_definition_id" = cd.id
);

-- ========== STEP 4: CREATE SUPPORTING TABLES ==========

-- Version History table
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
CREATE INDEX IF NOT EXISTS idx_version_history_previous ON "VersionHistory"("previous_instance_id");

-- Schedule Run tracking
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

CREATE INDEX IF NOT EXISTS idx_schedule_run_schedule ON "ScheduleRun"("schedule_id");
CREATE INDEX IF NOT EXISTS idx_schedule_run_status ON "ScheduleRun"("status", "scheduledFor");

-- Quality Metrics
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

CREATE INDEX IF NOT EXISTS idx_quality_metric_instance ON "QualityMetric"("curve_instance_id");
CREATE INDEX IF NOT EXISTS idx_quality_metric_type ON "QualityMetric"("metricType");

-- Default Curve Inputs
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

-- ========== STEP 5: CREATE HELPER FUNCTIONS ==========

-- Function to get active curve instance for a definition at a point in time
CREATE OR REPLACE FUNCTION get_active_instance_for_date(
    p_definition_id INTEGER,
    p_delivery_date TIMESTAMP,
    p_as_of_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_instance_id INTEGER;
BEGIN
    SELECT ci.id INTO v_instance_id
    FROM "CurveInstance" ci
    WHERE ci."curve_definition_id" = p_definition_id
      AND ci."deliveryPeriodStart" <= p_delivery_date
      AND ci."deliveryPeriodEnd" >= p_delivery_date
      AND ci."freshnessStartDate" <= p_as_of_date
      AND (ci."freshnessEndDate" IS NULL OR ci."freshnessEndDate" > p_as_of_date)
      AND ci.status = 'ACTIVE'
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1;
    
    RETURN v_instance_id;
END;
$$;

-- Function to create a new curve instance version
CREATE OR REPLACE FUNCTION create_curve_instance_version(
    p_definition_id INTEGER,
    p_delivery_start TIMESTAMP,
    p_delivery_end TIMESTAMP,
    p_granularity VARCHAR,
    p_created_by VARCHAR,
    p_run_type "RunType" DEFAULT 'MANUAL',
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
    SELECT ci.id INTO v_previous_instance_id
    FROM "CurveInstance" ci
    WHERE ci."curve_definition_id" = p_definition_id
      AND ci."deliveryPeriodStart" = p_delivery_start
      AND ci."granularity" = p_granularity
      AND ci.status = 'ACTIVE'
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1;
    
    -- Calculate version number
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(ci."instanceVersion" FROM 'v([0-9]+)$') AS INTEGER)
    ), 0) + 1 INTO v_version_number
    FROM "CurveInstance" ci
    WHERE ci."curve_definition_id" = p_definition_id
      AND ci."deliveryPeriodStart" = p_delivery_start
      AND ci."granularity" = p_granularity;
    
    v_new_version := CONCAT(
        TO_CHAR(p_delivery_start, 'YYYY_MM'), '_',
        LOWER(p_granularity), '_v',
        v_version_number
    );
    
    -- Expire previous instance if exists
    IF v_previous_instance_id IS NOT NULL THEN
        UPDATE "CurveInstance"
        SET "freshnessEndDate" = CURRENT_TIMESTAMP,
            status = 'SUPERSEDED'::"InstanceStatus",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = v_previous_instance_id;
    END IF;
    
    -- Create new instance
    INSERT INTO "CurveInstance" (
        "curve_definition_id",
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
        'ACTIVE'::"InstanceStatus",
        p_run_type,
        p_created_by,
        p_notes
    )
    RETURNING id INTO v_new_instance_id;
    
    -- Create version history entry
    IF v_previous_instance_id IS NOT NULL THEN
        INSERT INTO "VersionHistory" (
            "curve_instance_id",
            "previous_instance_id",
            "changeType",
            "changeReason",
            "changedBy"
        ) VALUES (
            v_new_instance_id,
            v_previous_instance_id,
            'UPDATE'::"ChangeType",
            COALESCE(p_notes, 'New version created'),
            p_created_by
        );
    END IF;
    
    RETURN v_new_instance_id;
END;
$$;

-- ========== STEP 6: CREATE WORKFLOW SUPPORT VIEWS ==========

-- View for scheduled curves needing updates
CREATE OR REPLACE VIEW curves_needing_update AS
SELECT 
    cs.id as schedule_id,
    cd.id as definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cs."frequency",
    cs."freshnessHours",
    cs."responsibleTeam",
    latest."forecastRunDate" as last_updated,
    CASE 
        WHEN latest."forecastRunDate" IS NULL THEN CURRENT_TIMESTAMP
        WHEN cs."frequency" = 'HOURLY' THEN latest."forecastRunDate" + INTERVAL '1 hour'
        WHEN cs."frequency" = 'DAILY' THEN latest."forecastRunDate" + INTERVAL '1 day'
        WHEN cs."frequency" = 'WEEKLY' THEN latest."forecastRunDate" + INTERVAL '1 week'
        WHEN cs."frequency" = 'MONTHLY' THEN latest."forecastRunDate" + INTERVAL '1 month'
        ELSE latest."forecastRunDate" + INTERVAL '30 days'
    END as next_update_due,
    CASE 
        WHEN latest."forecastRunDate" IS NULL THEN true
        WHEN latest."forecastRunDate" + (cs."freshnessHours" || ' hours')::INTERVAL < CURRENT_TIMESTAMP THEN true
        ELSE false
    END as is_stale
FROM "CurveSchedule" cs
JOIN "CurveDefinition" cd ON cd.id = cs."curve_definition_id"
LEFT JOIN LATERAL (
    SELECT * FROM "CurveInstance" ci
    WHERE ci."curve_definition_id" = cs."curve_definition_id"
      AND ci.status = 'ACTIVE'
    ORDER BY ci."forecastRunDate" DESC
    LIMIT 1
) latest ON true
WHERE cs."isActive" = true
  AND cd."isActive" = true
  AND (cs."validUntil" IS NULL OR cs."validUntil" > CURRENT_TIMESTAMP);

-- View for backward compatibility
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
    ci."granularity",
    cd."metadata"->'legacy_metadata'->>'curve_creator' as curve_creator,
    cd."metadata"->'legacy_metadata'->>'value_type' as value_type,
    ci."createdAt" as created_at
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
JOIN "LegacyCurveMapping" lcm ON lcm."newCurveInstanceId" = ci.id;

-- ========== STEP 7: VERIFICATION ==========

DO $$
DECLARE
    v_definitions INTEGER;
    v_instances INTEGER;
    v_schedules INTEGER;
    v_curves_needing_update INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_definitions FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_schedules FROM "CurveSchedule";
    SELECT COUNT(*) INTO v_curves_needing_update FROM curves_needing_update WHERE is_stale;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== WORKFLOW MIGRATION COMPLETE =====';
    RAISE NOTICE 'Curve Definitions: %', v_definitions;
    RAISE NOTICE 'Curve Instances: %', v_instances;
    RAISE NOTICE 'Curve Schedules: %', v_schedules;
    RAISE NOTICE 'Curves needing update: %', v_curves_needing_update;
END $$;

-- Display schedule summary
SELECT 
    cs."frequency",
    COUNT(*) as schedule_count,
    COUNT(*) FILTER (WHERE cn.is_stale) as stale_count,
    STRING_AGG(
        CASE WHEN cn.is_stale 
        THEN cd."curveName" 
        END, ', ' 
        ORDER BY cd."curveName"
    ) as stale_curves
FROM "CurveSchedule" cs
JOIN "CurveDefinition" cd ON cd.id = cs."curve_definition_id"
LEFT JOIN curves_needing_update cn ON cn.schedule_id = cs.id
WHERE cs."isActive" = true
GROUP BY cs."frequency"
ORDER BY cs."frequency";

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '===== WORKFLOW FULLY OPERATIONAL =====';
RAISE NOTICE '';
RAISE NOTICE 'Key capabilities now available:';
RAISE NOTICE '1. Upload Curves: Use upload_page_curves view to see definitions';
RAISE NOTICE '2. Create Instances: Use create_curve_instance_version() function';
RAISE NOTICE '3. Check Updates: Use curves_needing_update view';
RAISE NOTICE '4. Inventory: Use inventory_page_instances view';
RAISE NOTICE '5. Scheduling: All curves have intelligent schedules based on their characteristics'; 