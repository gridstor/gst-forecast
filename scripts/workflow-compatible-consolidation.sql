-- Workflow-Compatible Curve Consolidation Script
-- Supports both scheduled delivery fulfillment and ad hoc curve creation
-- Creates ONE CurveDefinition per conceptual curve with MULTIPLE CurveInstances

BEGIN;

-- ========== STEP 0: PRE-FLIGHT CHECKS ==========

DO $$
DECLARE
    v_curve_count INTEGER;
    v_unique_concepts INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_curve_count FROM "Forecasts".curve_definitions;
    
    WITH concepts AS (
        SELECT DISTINCT market, mark_type, location
        FROM "Forecasts".curve_definitions
    )
    SELECT COUNT(*) INTO v_unique_concepts FROM concepts;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== PRE-CONSOLIDATION STATUS =====';
    RAISE NOTICE 'Total curve_definitions records: %', v_curve_count;
    RAISE NOTICE 'True unique conceptual curves: %', v_unique_concepts;
    RAISE NOTICE 'Records to consolidate: %', v_curve_count - v_unique_concepts;
    RAISE NOTICE '';
    
    IF v_curve_count = 0 THEN
        RAISE EXCEPTION 'No curves found to consolidate';
    END IF;
END $$;

-- ========== STEP 1: CREATE CONSOLIDATION STRATEGY ==========

CREATE TEMP TABLE consolidation_strategy AS
WITH curve_analysis AS (
    SELECT 
        cd.*,
        -- Conceptual identity based on market, type, and location
        UPPER(CONCAT(
            COALESCE(cd.market, 'UNKNOWN'), '_',
            COALESCE(cd.mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(cd.location, 'LOC'), ' ', '_')
        )) as conceptual_identity,
        -- Price data stats
        COALESCE(pf_stats.price_count, 0) as price_count,
        pf_stats.min_date as data_start,
        pf_stats.max_date as data_end,
        pf_stats.date_range_days,
        -- Ranking for primary selection
        ROW_NUMBER() OVER (
            PARTITION BY cd.market, cd.mark_type, cd.location
            ORDER BY 
                COALESCE(pf_stats.price_count, 0) DESC,  -- Most data wins
                cd.created_at ASC                         -- Then oldest
        ) as primary_rank,
        -- Instance versioning within concept
        ROW_NUMBER() OVER (
            PARTITION BY cd.market, cd.mark_type, cd.location
            ORDER BY cd.created_at ASC
        ) as instance_sequence
    FROM "Forecasts".curve_definitions cd
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as price_count,
            MIN(flow_date_start) as min_date,
            MAX(flow_date_start) as max_date,
            EXTRACT(DAY FROM MAX(flow_date_start) - MIN(flow_date_start)) as date_range_days
        FROM "Forecasts".price_forecasts
        WHERE curve_id = cd.curve_id
    ) pf_stats ON true
)
SELECT 
    *,
    CASE WHEN primary_rank = 1 THEN 'PRIMARY' ELSE 'INSTANCE' END as role,
    -- Generate instance version based on what makes it unique
    CONCAT(
        'legacy_',
        LOWER(COALESCE(granularity, 'unknown')),
        '_v', instance_sequence
    ) as instance_version
FROM curve_analysis;

-- Show consolidation plan summary
DO $$
DECLARE
    v_primary_count INTEGER;
    v_instance_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_primary_count FROM consolidation_strategy WHERE role = 'PRIMARY';
    SELECT COUNT(*) INTO v_instance_count FROM consolidation_strategy WHERE role = 'INSTANCE';
    
    RAISE NOTICE 'Consolidation plan created:';
    RAISE NOTICE '  Primary definitions: %', v_primary_count;
    RAISE NOTICE '  Additional instances: %', v_instance_count;
END $$;

-- ========== STEP 2: CREATE NEW SCHEMA OBJECTS ==========

-- Create ENUMs
DO $$
BEGIN
    CREATE TYPE "InstanceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'EXPIRED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "RunType" AS ENUM ('SCHEDULED', 'MANUAL', 'TRIGGERED', 'BACKFILL', 'CORRECTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

-- Create CurveDefinition table
CREATE TABLE IF NOT EXISTS "CurveDefinition" (
    "id" SERIAL PRIMARY KEY,
    "curveName" VARCHAR(255) UNIQUE NOT NULL,
    "market" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "product" VARCHAR(50) NOT NULL,
    "commodity" VARCHAR(50) NOT NULL DEFAULT 'Energy',
    "units" VARCHAR(50) NOT NULL DEFAULT '$/MWh',
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_curve_def_market_location_product ON "CurveDefinition"("market", "location", "product");
CREATE INDEX IF NOT EXISTS idx_curve_def_name ON "CurveDefinition"("curveName");

-- Create CurveInstance table
CREATE TABLE IF NOT EXISTS "CurveInstance" (
    "id" SERIAL PRIMARY KEY,
    "curve_definition_id" INTEGER NOT NULL REFERENCES "CurveDefinition"("id"),
    "instanceVersion" VARCHAR(50) NOT NULL,
    "granularity" VARCHAR(20) NOT NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_curve_instance_unique ON "CurveInstance"("curve_definition_id", "instanceVersion");
CREATE INDEX IF NOT EXISTS idx_curve_instance_freshness ON "CurveInstance"("curve_definition_id", "freshnessStartDate", "freshnessEndDate");
CREATE INDEX IF NOT EXISTS idx_curve_instance_delivery ON "CurveInstance"("deliveryPeriodStart", "deliveryPeriodEnd");
CREATE INDEX IF NOT EXISTS idx_curve_instance_granularity ON "CurveInstance"("curve_definition_id", "granularity");

-- Rename existing price_forecasts if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'Forecasts' AND table_name = 'price_forecasts') THEN
        ALTER TABLE "Forecasts".price_forecasts RENAME TO price_forecasts_legacy;
    END IF;
END $$;

-- Create new PriceForecast table
CREATE TABLE IF NOT EXISTS "PriceForecast" (
    "id" SERIAL PRIMARY KEY,
    "curve_instance_id" INTEGER NOT NULL REFERENCES "CurveInstance"("id") ON DELETE CASCADE,
    "timestamp" TIMESTAMP NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "valueHigh" DOUBLE PRECISION,
    "valueLow" DOUBLE PRECISION,
    "flags" TEXT[]
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_forecast_unique ON "PriceForecast"("curve_instance_id", "timestamp");
CREATE INDEX IF NOT EXISTS idx_price_forecast_instance ON "PriceForecast"("curve_instance_id");
CREATE INDEX IF NOT EXISTS idx_price_forecast_timestamp ON "PriceForecast"("timestamp");

-- Create mapping table
CREATE TABLE IF NOT EXISTS "LegacyCurveMapping" (
    "id" SERIAL PRIMARY KEY,
    "oldCurveId" INTEGER UNIQUE NOT NULL,
    "newCurveDefinitionId" INTEGER NOT NULL,
    "newCurveInstanceId" INTEGER NOT NULL,
    "migrationNotes" TEXT,
    "migratedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lineage table
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

-- ========== STEP 3: MIGRATE CURVE DEFINITIONS ==========

-- Insert primary curves as CurveDefinitions
INSERT INTO "CurveDefinition" (
    "curveName",
    "market",
    "location",
    "product",
    "commodity",
    "units",
    "timezone",
    "description",
    "isActive",
    "metadata"
)
SELECT DISTINCT ON (cs.conceptual_identity)
    cs.conceptual_identity as "curveName",
    cs.market,
    cs.location,
    COALESCE(cs.mark_type, 'UNKNOWN') as "product",
    'Energy' as "commodity",
    '$/MWh' as "units",
    CASE 
        WHEN cs.market = 'CAISO' THEN 'America/Los_Angeles'
        WHEN cs.market = 'ERCOT' THEN 'America/Chicago'
        ELSE 'UTC'
    END as "timezone",
    CONCAT('Market curve: ', cs.mark_type, ' at ', cs.location) as "description",
    true as "isActive",
    jsonb_build_object(
        'primary_legacy_id', cs.curve_id,
        'consolidation_date', CURRENT_TIMESTAMP,
        'legacy_metadata', jsonb_build_object(
            'mark_case', cs.mark_case,
            'curve_creator', cs.curve_creator,
            'value_type', cs.value_type,
            'mark_model_type_desc', cs.mark_model_type_desc
        )
    ) as "metadata"
FROM consolidation_strategy cs
WHERE cs.role = 'PRIMARY'
ORDER BY cs.conceptual_identity, cs.primary_rank;

-- ========== STEP 4: CREATE CURVE INSTANCES ==========

-- Create instances for ALL curves (including primary as first instance)
INSERT INTO "CurveInstance" (
    "curve_definition_id",
    "instanceVersion",
    "granularity",
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
SELECT 
    cd.id as "curve_definition_id",
    cs.instance_version as "instanceVersion",
    COALESCE(cs.granularity, 'UNKNOWN') as "granularity",
    COALESCE(cs.data_start, cs.created_at::date) as "deliveryPeriodStart",
    COALESCE(cs.data_end, (cs.created_at + INTERVAL '1 year')::date) as "deliveryPeriodEnd",
    COALESCE(cs.mark_date, cs.created_at) as "forecastRunDate",
    COALESCE(cs.mark_date, cs.created_at) as "freshnessStartDate",
    NULL as "freshnessEndDate", -- All active initially
    'ACTIVE'::"InstanceStatus" as "status",
    COALESCE(cs.mark_model_type_desc, 'Historical') as "modelType",
    'BACKFILL'::"RunType" as "runType",
    'consolidation_script' as "createdBy",
    CONCAT(
        'Migrated from legacy curve_id: ', cs.curve_id,
        ' (', cs.role, ', ', cs.granularity, ')'
    ) as "notes",
    jsonb_build_object(
        'legacy_curve_id', cs.curve_id,
        'legacy_granularity', cs.granularity,
        'legacy_mark_case', cs.mark_case,
        'legacy_role', cs.role,
        'price_count', cs.price_count,
        'date_range_days', cs.date_range_days
    ) as "metadata"
FROM consolidation_strategy cs
JOIN "CurveDefinition" cd ON cd."curveName" = cs.conceptual_identity;

-- ========== STEP 5: CREATE LEGACY MAPPINGS ==========

INSERT INTO "LegacyCurveMapping" (
    "oldCurveId",
    "newCurveDefinitionId",
    "newCurveInstanceId",
    "migrationNotes"
)
SELECT 
    cs.curve_id,
    cd.id,
    ci.id,
    CONCAT('Role: ', cs.role, ', Granularity: ', cs.granularity, ', Prices: ', cs.price_count)
FROM consolidation_strategy cs
JOIN "CurveDefinition" cd ON cd."curveName" = cs.conceptual_identity
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
    AND ci."metadata"->>'legacy_curve_id' = cs.curve_id::text;

-- ========== STEP 6: MIGRATE PRICE DATA ==========

INSERT INTO "PriceForecast" (
    "curve_instance_id",
    "timestamp",
    "value"
)
SELECT 
    lcm."newCurveInstanceId",
    pf.flow_date_start,
    pf.value
FROM "Forecasts".price_forecasts_legacy pf
JOIN "LegacyCurveMapping" lcm ON lcm."oldCurveId" = pf.curve_id;

-- ========== STEP 7: ADD LINEAGE FOR MIGRATED DATA ==========

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
    'Pre-migration system',
    CONCAT('legacy_curve_', ci."metadata"->>'legacy_curve_id'),
    ci."forecastRunDate",
    'PRIMARY'::"UsageType",
    jsonb_build_object(
        'migration_type', 'workflow_compatible_consolidation',
        'migration_date', CURRENT_TIMESTAMP,
        'original_granularity', ci."metadata"->>'legacy_granularity',
        'original_role', ci."metadata"->>'legacy_role'
    )
FROM "CurveInstance" ci;

-- ========== STEP 8: VERIFICATION ==========

DO $$
DECLARE
    v_definitions INTEGER;
    v_instances INTEGER;
    v_prices_old INTEGER;
    v_prices_new INTEGER;
    v_mappings INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_definitions FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_prices_old FROM "Forecasts".price_forecasts_legacy;
    SELECT COUNT(*) INTO v_prices_new FROM "PriceForecast";
    SELECT COUNT(*) INTO v_mappings FROM "LegacyCurveMapping";
    
    RAISE NOTICE '';
    RAISE NOTICE '===== CONSOLIDATION COMPLETE =====';
    RAISE NOTICE 'CurveDefinitions created: %', v_definitions;
    RAISE NOTICE 'CurveInstances created: %', v_instances;
    RAISE NOTICE 'Legacy mappings: %', v_mappings;
    RAISE NOTICE 'Price records migrated: % of %', v_prices_new, v_prices_old;
    
    IF v_prices_new != v_prices_old THEN
        RAISE WARNING 'Price count mismatch! Investigate missing records.';
    END IF;
END $$;

-- Show sample results
RAISE NOTICE '';
RAISE NOTICE 'Sample consolidated curves:';

SELECT 
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    COUNT(DISTINCT ci.id) as instances,
    STRING_AGG(
        DISTINCT ci."granularity" || ' (' || ci."instanceVersion" || ')', 
        ', ' 
        ORDER BY ci."granularity" || ' (' || ci."instanceVersion" || ')'
    ) as instance_details,
    SUM((ci."metadata"->>'price_count')::int) as total_prices
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."curveName", cd."market", cd."location", cd."product"
HAVING COUNT(DISTINCT ci.id) > 1
ORDER BY COUNT(DISTINCT ci.id) DESC
LIMIT 10;

-- ========== STEP 9: CREATE WORKFLOW VIEWS ==========

-- View for Upload Curves page - shows definitions with latest instance info
CREATE OR REPLACE VIEW upload_page_curves AS
SELECT 
    cd.id as definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cd."units",
    latest."instanceVersion" as latest_version,
    latest."granularity" as latest_granularity,
    latest."deliveryPeriodEnd" as latest_period_end,
    latest."forecastRunDate" as last_updated,
    COUNT(DISTINCT ci.id) as total_instances
FROM "CurveDefinition" cd
LEFT JOIN LATERAL (
    SELECT * FROM "CurveInstance" 
    WHERE "curve_definition_id" = cd.id 
    AND status = 'ACTIVE'
    ORDER BY "forecastRunDate" DESC 
    LIMIT 1
) latest ON true
LEFT JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
WHERE cd."isActive" = true
GROUP BY cd.id, cd."curveName", cd."market", cd."location", cd."product", cd."units",
         latest."instanceVersion", latest."granularity", latest."deliveryPeriodEnd", latest."forecastRunDate";

-- View for Inventory page - shows all instances with their details
CREATE OR REPLACE VIEW inventory_page_instances AS
SELECT 
    ci.id as instance_id,
    cd.id as definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    ci."instanceVersion",
    ci."granularity",
    ci."deliveryPeriodStart",
    ci."deliveryPeriodEnd",
    ci."forecastRunDate",
    ci."status",
    pf_count.price_count,
    ci."metadata"
FROM "CurveInstance" ci
JOIN "CurveDefinition" cd ON cd.id = ci."curve_definition_id"
LEFT JOIN LATERAL (
    SELECT COUNT(*) as price_count
    FROM "PriceForecast"
    WHERE "curve_instance_id" = ci.id
) pf_count ON true;

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '===== WORKFLOW SUPPORT READY =====';
RAISE NOTICE 'Upload page view: upload_page_curves';
RAISE NOTICE 'Inventory page view: inventory_page_instances';
RAISE NOTICE '';
RAISE NOTICE 'Your workflow is now supported:';
RAISE NOTICE '1. Upload Curves: Can create new definitions or add instances to existing ones';
RAISE NOTICE '2. Curve Inventory: Can view, edit, download all instances and definitions';
RAISE NOTICE '3. Scheduling: Works with definitions (not instances)';
RAISE NOTICE '4. Price Data: Properly linked to specific instances'; 