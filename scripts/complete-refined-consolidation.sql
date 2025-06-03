-- Complete Refined Workflow-Compatible Curve Consolidation Script
-- Handles degradation scenarios and curve types as part of curve identity
-- Creates ONE CurveDefinition per market + location + curve_type + degradation_scenario

BEGIN;

-- ========== STEP 0: PRE-FLIGHT ANALYSIS ==========

DO $$
DECLARE
    v_curve_count INTEGER;
    v_unique_concepts INTEGER;
    v_mark_case_has_years BOOLEAN;
    v_mark_type_has_curve_types BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO v_curve_count FROM "Forecasts".curve_definitions;
    
    -- Check if mark_case contains year information (degradation)
    SELECT EXISTS(
        SELECT 1 FROM "Forecasts".curve_definitions 
        WHERE mark_case ~ '202[0-9]'
    ) INTO v_mark_case_has_years;
    
    -- Check if mark_type contains curve type information
    SELECT EXISTS(
        SELECT 1 FROM "Forecasts".curve_definitions 
        WHERE mark_type ILIKE ANY(ARRAY['%revenue%', '%energy%', '%AS%', '%TB2%', '%TB4%', '%RA%'])
    ) INTO v_mark_type_has_curve_types;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== PRE-CONSOLIDATION ANALYSIS =====';
    RAISE NOTICE 'Total curve_definitions records: %', v_curve_count;
    RAISE NOTICE 'Mark_case contains degradation years: %', v_mark_case_has_years;
    RAISE NOTICE 'Mark_type contains curve types: %', v_mark_type_has_curve_types;
    RAISE NOTICE '';
    
    IF v_curve_count = 0 THEN
        RAISE EXCEPTION 'No curves found to consolidate';
    END IF;
END $$;

-- ========== STEP 1: CREATE REFINED CONSOLIDATION STRATEGY ==========

CREATE TEMP TABLE refined_consolidation_strategy AS
WITH curve_analysis AS (
    SELECT 
        cd.*,
        -- Extract curve type from mark_type
        CASE 
            WHEN mark_type ILIKE '%revenue%' THEN 'REVENUE'
            WHEN mark_type ILIKE '%energy%arb%' THEN 'ENERGY_ARB'
            WHEN mark_type ILIKE '%energy%' AND mark_type NOT ILIKE '%arb%' THEN 'ENERGY'
            WHEN mark_type ILIKE '%AS%' OR mark_type ILIKE '%ancillary%' THEN 'AS'
            WHEN mark_type ILIKE '%TB2%' THEN 'TB2'
            WHEN mark_type ILIKE '%TB4%' THEN 'TB4'
            WHEN mark_type ILIKE '%RA%' OR mark_type ILIKE '%resource%adequacy%' THEN 'RA'
            WHEN mark_type ILIKE '%DA%' THEN 'DA'
            WHEN mark_type ILIKE '%RT%' THEN 'RT'
            ELSE UPPER(REPLACE(mark_type, ' ', '_'))
        END as curve_type,
        -- Extract degradation scenario from mark_case
        CASE 
            -- Look for specific years
            WHEN mark_case ~ '2024' THEN 'DEG_2024'
            WHEN mark_case ~ '2025' THEN 'DEG_2025'
            WHEN mark_case ~ '2026' THEN 'DEG_2026'
            WHEN mark_case ~ '2027' THEN 'DEG_2027'
            WHEN mark_case ~ '2028' THEN 'DEG_2028'
            WHEN mark_case ~ '2029' THEN 'DEG_2029'
            WHEN mark_case ~ '2030' THEN 'DEG_2030'
            -- Look for undegraded patterns
            WHEN LOWER(mark_case) LIKE '%undeg%' THEN 'UNDEGRADED'
            WHEN LOWER(mark_case) LIKE '%no deg%' THEN 'UNDEGRADED'
            WHEN LOWER(mark_case) LIKE '%no_deg%' THEN 'UNDEGRADED'
            -- Look for degraded patterns
            WHEN LOWER(mark_case) LIKE '%deg%' AND mark_case !~ '202[0-9]' THEN 'DEGRADED'
            -- Default case
            ELSE 'BASE'
        END as degradation_scenario,
        -- Conceptual identity includes curve type and degradation
        UPPER(CONCAT(
            REPLACE(COALESCE(market, 'UNKNOWN'), ' ', '_'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_'), '_',
            CASE 
                WHEN mark_type ILIKE '%revenue%' THEN 'REVENUE'
                WHEN mark_type ILIKE '%energy%arb%' THEN 'ENERGY_ARB'
                WHEN mark_type ILIKE '%energy%' AND mark_type NOT ILIKE '%arb%' THEN 'ENERGY'
                WHEN mark_type ILIKE '%AS%' OR mark_type ILIKE '%ancillary%' THEN 'AS'
                WHEN mark_type ILIKE '%TB2%' THEN 'TB2'
                WHEN mark_type ILIKE '%TB4%' THEN 'TB4'
                WHEN mark_type ILIKE '%RA%' THEN 'RA'
                WHEN mark_type ILIKE '%DA%' THEN 'DA'
                WHEN mark_type ILIKE '%RT%' THEN 'RT'
                ELSE UPPER(REPLACE(mark_type, ' ', '_'))
            END, '_',
            CASE 
                WHEN mark_case ~ '202[0-9]' THEN SUBSTRING(mark_case FROM '(202[0-9])')
                WHEN LOWER(mark_case) LIKE '%undeg%' THEN 'UNDEG'
                WHEN LOWER(mark_case) LIKE '%deg%' THEN 'DEG'
                ELSE 'BASE'
            END
        )) as refined_conceptual_identity
    FROM "Forecasts".curve_definitions cd
),
price_data_stats AS (
    SELECT 
        ca.*,
        COALESCE(pf_stats.price_count, 0) as price_count,
        pf_stats.min_date as data_start,
        pf_stats.max_date as data_end,
        pf_stats.date_range_days,
        -- Ranking for primary selection within each conceptual group
        ROW_NUMBER() OVER (
            PARTITION BY ca.refined_conceptual_identity
            ORDER BY 
                COALESCE(pf_stats.price_count, 0) DESC,  -- Most data wins
                ca.created_at ASC                         -- Then oldest
        ) as primary_rank,
        -- Instance versioning within concept
        ROW_NUMBER() OVER (
            PARTITION BY ca.refined_conceptual_identity
            ORDER BY ca.created_at ASC
        ) as instance_sequence
    FROM curve_analysis ca
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as price_count,
            MIN(flow_date_start) as min_date,
            MAX(flow_date_start) as max_date,
            EXTRACT(DAY FROM MAX(flow_date_start) - MIN(flow_date_start)) as date_range_days
        FROM "Forecasts".price_forecasts
        WHERE curve_id = ca.curve_id
    ) pf_stats ON true
)
SELECT 
    *,
    CASE WHEN primary_rank = 1 THEN 'PRIMARY' ELSE 'INSTANCE' END as role,
    -- Generate instance version based on granularity and sequence
    CONCAT(
        'legacy_',
        LOWER(COALESCE(granularity, 'unknown')),
        '_v', instance_sequence
    ) as instance_version
FROM price_data_stats;

-- Show consolidation plan summary
DO $$
DECLARE
    v_unique_refined_concepts INTEGER;
    v_total_instances INTEGER;
BEGIN
    SELECT COUNT(DISTINCT refined_conceptual_identity) INTO v_unique_refined_concepts 
    FROM refined_consolidation_strategy;
    
    SELECT COUNT(*) INTO v_total_instances FROM refined_consolidation_strategy;
    
    RAISE NOTICE 'Refined consolidation plan:';
    RAISE NOTICE '  Unique CurveDefinitions (with degradation/type): %', v_unique_refined_concepts;
    RAISE NOTICE '  Total CurveInstances: %', v_total_instances;
END $$;

-- ========== STEP 2: CREATE NEW SCHEMA OBJECTS ==========

-- Create ENUMs if not exists
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

-- Add new ENUM for curve types
DO $$
BEGIN
    CREATE TYPE "CurveType" AS ENUM ('REVENUE', 'ENERGY', 'ENERGY_ARB', 'AS', 'TB2', 'TB4', 'RA', 'DA', 'RT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new ENUM for degradation types
DO $$
BEGIN
    CREATE TYPE "DegradationType" AS ENUM ('UNDEGRADED', 'DEG_2024', 'DEG_2025', 'DEG_2026', 'DEG_2027', 'DEG_2028', 'DEG_2029', 'DEG_2030', 'DEGRADED', 'BASE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create CurveDefinition table with additional fields
CREATE TABLE IF NOT EXISTS "CurveDefinition" (
    "id" SERIAL PRIMARY KEY,
    "curveName" VARCHAR(255) UNIQUE NOT NULL,
    "market" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "product" VARCHAR(50) NOT NULL,
    "curveType" "CurveType" NOT NULL,
    "degradationType" "DegradationType" NOT NULL DEFAULT 'UNDEGRADED',
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
CREATE INDEX IF NOT EXISTS idx_curve_def_type_degradation ON "CurveDefinition"("curveType", "degradationType");
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

-- ========== STEP 3: MIGRATE CURVE DEFINITIONS WITH DEGRADATION/TYPE ==========

INSERT INTO "CurveDefinition" (
    "curveName",
    "market",
    "location",
    "product",
    "curveType",
    "degradationType",
    "commodity",
    "units",
    "timezone",
    "description",
    "isActive",
    "metadata"
)
SELECT DISTINCT ON (rcs.refined_conceptual_identity)
    rcs.refined_conceptual_identity as "curveName",
    rcs.market,
    rcs.location,
    COALESCE(rcs.mark_type, 'UNKNOWN') as "product",
    -- Map curve type
    CASE 
        WHEN rcs.curve_type = 'REVENUE' THEN 'REVENUE'::"CurveType"
        WHEN rcs.curve_type = 'ENERGY_ARB' THEN 'ENERGY_ARB'::"CurveType"
        WHEN rcs.curve_type = 'ENERGY' THEN 'ENERGY'::"CurveType"
        WHEN rcs.curve_type = 'AS' THEN 'AS'::"CurveType"
        WHEN rcs.curve_type = 'TB2' THEN 'TB2'::"CurveType"
        WHEN rcs.curve_type = 'TB4' THEN 'TB4'::"CurveType"
        WHEN rcs.curve_type = 'RA' THEN 'RA'::"CurveType"
        WHEN rcs.curve_type = 'DA' THEN 'DA'::"CurveType"
        WHEN rcs.curve_type = 'RT' THEN 'RT'::"CurveType"
        ELSE 'OTHER'::"CurveType"
    END as "curveType",
    -- Map degradation type
    CASE 
        WHEN rcs.degradation_scenario = 'UNDEGRADED' THEN 'UNDEGRADED'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEG_2024' THEN 'DEG_2024'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEG_2025' THEN 'DEG_2025'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEG_2026' THEN 'DEG_2026'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEG_2027' THEN 'DEG_2027'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEG_2028' THEN 'DEG_2028'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEG_2029' THEN 'DEG_2029'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEG_2030' THEN 'DEG_2030'::"DegradationType"
        WHEN rcs.degradation_scenario = 'DEGRADED' THEN 'DEGRADED'::"DegradationType"
        WHEN rcs.degradation_scenario = 'BASE' THEN 'BASE'::"DegradationType"
        ELSE 'OTHER'::"DegradationType"
    END as "degradationType",
    'Energy' as "commodity",
    CASE 
        WHEN rcs.value_type = 'price' THEN '$/MWh'
        WHEN rcs.value_type = 'revenue' THEN '$'
        WHEN rcs.value_type = 'capacity' THEN 'MW'
        ELSE '$/MWh'
    END as "units",
    CASE 
        WHEN rcs.market = 'CAISO' THEN 'America/Los_Angeles'
        WHEN rcs.market = 'ERCOT' THEN 'America/Chicago'
        ELSE 'UTC'
    END as "timezone",
    CONCAT(
        'Market curve: ', rcs.mark_type, 
        ' at ', rcs.location,
        ' (', rcs.curve_type, ')',
        CASE WHEN rcs.degradation_scenario != 'BASE' 
        THEN ' - ' || rcs.degradation_scenario 
        ELSE '' END
    ) as "description",
    true as "isActive",
    jsonb_build_object(
        'primary_legacy_id', rcs.curve_id,
        'consolidation_date', CURRENT_TIMESTAMP,
        'curve_type', rcs.curve_type,
        'degradation_scenario', rcs.degradation_scenario,
        'legacy_metadata', jsonb_build_object(
            'mark_case', rcs.mark_case,
            'curve_creator', rcs.curve_creator,
            'value_type', rcs.value_type,
            'mark_model_type_desc', rcs.mark_model_type_desc
        )
    ) as "metadata"
FROM refined_consolidation_strategy rcs
WHERE rcs.role = 'PRIMARY'
ORDER BY rcs.refined_conceptual_identity, rcs.primary_rank;

-- ========== STEP 4: CREATE CURVE INSTANCES ==========

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
    rcs.instance_version as "instanceVersion",
    COALESCE(rcs.granularity, 'UNKNOWN') as "granularity",
    COALESCE(rcs.data_start, rcs.created_at::date) as "deliveryPeriodStart",
    COALESCE(rcs.data_end, (rcs.created_at + INTERVAL '1 year')::date) as "deliveryPeriodEnd",
    COALESCE(rcs.mark_date, rcs.created_at) as "forecastRunDate",
    COALESCE(rcs.mark_date, rcs.created_at) as "freshnessStartDate",
    NULL as "freshnessEndDate", -- All active initially
    'ACTIVE'::"InstanceStatus" as "status",
    COALESCE(rcs.mark_model_type_desc, 'Historical') as "modelType",
    'BACKFILL'::"RunType" as "runType",
    'consolidation_script' as "createdBy",
    CONCAT(
        'Migrated from legacy curve_id: ', rcs.curve_id,
        ' (', rcs.role, ', ', rcs.granularity, ', ', rcs.curve_type, ', ', rcs.degradation_scenario, ')'
    ) as "notes",
    jsonb_build_object(
        'legacy_curve_id', rcs.curve_id,
        'legacy_granularity', rcs.granularity,
        'legacy_mark_case', rcs.mark_case,
        'legacy_role', rcs.role,
        'price_count', rcs.price_count,
        'date_range_days', rcs.date_range_days,
        'curve_type', rcs.curve_type,
        'degradation_scenario', rcs.degradation_scenario
    ) as "metadata"
FROM refined_consolidation_strategy rcs
JOIN "CurveDefinition" cd ON cd."curveName" = rcs.refined_conceptual_identity;

-- ========== STEP 5: CREATE LEGACY MAPPINGS ==========

INSERT INTO "LegacyCurveMapping" (
    "oldCurveId",
    "newCurveDefinitionId",
    "newCurveInstanceId",
    "migrationNotes"
)
SELECT 
    rcs.curve_id,
    cd.id,
    ci.id,
    CONCAT('Role: ', rcs.role, ', Type: ', rcs.curve_type, ', Degradation: ', rcs.degradation_scenario, ', Granularity: ', rcs.granularity, ', Prices: ', rcs.price_count)
FROM refined_consolidation_strategy rcs
JOIN "CurveDefinition" cd ON cd."curveName" = rcs.refined_conceptual_identity
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
    AND ci."metadata"->>'legacy_curve_id' = rcs.curve_id::text;

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
        'migration_type', 'refined_workflow_consolidation',
        'migration_date', CURRENT_TIMESTAMP,
        'original_granularity', ci."metadata"->>'legacy_granularity',
        'original_role', ci."metadata"->>'legacy_role',
        'curve_type', ci."metadata"->>'curve_type',
        'degradation_scenario', ci."metadata"->>'degradation_scenario'
    )
FROM "CurveInstance" ci;

-- ========== STEP 8: CREATE ENHANCED WORKFLOW VIEWS ==========

-- Enhanced upload page view showing curve types and degradation
CREATE OR REPLACE VIEW upload_page_curves_enhanced AS
SELECT 
    cd.id as definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cd."curveType",
    cd."degradationType",
    cd."units",
    latest."instanceVersion" as latest_version,
    latest."granularity" as latest_granularity,
    latest."deliveryPeriodEnd" as latest_period_end,
    latest."forecastRunDate" as last_updated,
    COUNT(DISTINCT ci.id) as total_instances,
    SUM(pf_count.price_count) as total_price_points
FROM "CurveDefinition" cd
LEFT JOIN LATERAL (
    SELECT * FROM "CurveInstance" 
    WHERE "curve_definition_id" = cd.id 
    AND status = 'ACTIVE'
    ORDER BY "forecastRunDate" DESC 
    LIMIT 1
) latest ON true
LEFT JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
LEFT JOIN LATERAL (
    SELECT COUNT(*) as price_count
    FROM "PriceForecast"
    WHERE "curve_instance_id" = ci.id
) pf_count ON true
WHERE cd."isActive" = true
GROUP BY cd.id, cd."curveName", cd."market", cd."location", cd."product", 
         cd."curveType", cd."degradationType", cd."units",
         latest."instanceVersion", latest."granularity", 
         latest."deliveryPeriodEnd", latest."forecastRunDate";

-- View to find curves by type and degradation
CREATE OR REPLACE VIEW curves_by_type_and_degradation AS
SELECT 
    cd."curveType",
    cd."degradationType",
    cd."market",
    cd."location",
    COUNT(DISTINCT cd.id) as definition_count,
    COUNT(DISTINCT ci.id) as instance_count,
    STRING_AGG(DISTINCT cd."curveName", ', ' ORDER BY cd."curveName") as curve_names
FROM "CurveDefinition" cd
LEFT JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."curveType", cd."degradationType", cd."market", cd."location"
ORDER BY cd."curveType", cd."degradationType", cd."market", cd."location";

-- Enhanced inventory view with curve type and degradation
CREATE OR REPLACE VIEW inventory_page_instances_enhanced AS
SELECT 
    ci.id as instance_id,
    cd.id as definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cd."curveType",
    cd."degradationType",
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

-- ========== STEP 9: VERIFICATION ==========

DO $$
DECLARE
    v_definitions INTEGER;
    v_instances INTEGER;
    v_prices_old INTEGER;
    v_prices_new INTEGER;
    v_mappings INTEGER;
    v_curve_types INTEGER;
    v_degradation_types INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_definitions FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_prices_old FROM "Forecasts".price_forecasts_legacy;
    SELECT COUNT(*) INTO v_prices_new FROM "PriceForecast";
    SELECT COUNT(*) INTO v_mappings FROM "LegacyCurveMapping";
    SELECT COUNT(DISTINCT "curveType") INTO v_curve_types FROM "CurveDefinition";
    SELECT COUNT(DISTINCT "degradationType") INTO v_degradation_types FROM "CurveDefinition";
    
    RAISE NOTICE '';
    RAISE NOTICE '===== REFINED CONSOLIDATION COMPLETE =====';
    RAISE NOTICE 'CurveDefinitions created: %', v_definitions;
    RAISE NOTICE 'Unique curve types: %', v_curve_types;
    RAISE NOTICE 'Unique degradation types: %', v_degradation_types;
    RAISE NOTICE 'CurveInstances created: %', v_instances;
    RAISE NOTICE 'Legacy mappings: %', v_mappings;
    RAISE NOTICE 'Price records migrated: % of %', v_prices_new, v_prices_old;
    
    IF v_prices_new != v_prices_old THEN
        RAISE WARNING 'Price count mismatch! Investigate missing records.';
    END IF;
END $$;

-- Show sample results by curve type and degradation
RAISE NOTICE '';
RAISE NOTICE 'Sample consolidated curves by type and degradation:';

SELECT 
    cd."curveType",
    cd."degradationType",
    COUNT(DISTINCT cd.id) as definitions,
    COUNT(DISTINCT ci.id) as instances,
    SUM((ci."metadata"->>'price_count')::int) as total_prices
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."curveType", cd."degradationType"
ORDER BY cd."curveType", cd."degradationType"
LIMIT 15;

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '===== REFINED WORKFLOW FULLY OPERATIONAL =====';
RAISE NOTICE '';
RAISE NOTICE 'Key capabilities now available:';
RAISE NOTICE '1. Upload Curves: Use upload_page_curves_enhanced view to see definitions with types';
RAISE NOTICE '2. Curve Types: Filter by REVENUE, ENERGY, AS, TB2, TB4, RA, etc.';
RAISE NOTICE '3. Degradation: Track UNDEGRADED vs DEG_2024, DEG_2025, etc.';
RAISE NOTICE '4. Inventory: Use inventory_page_instances_enhanced view';
RAISE NOTICE '5. Analysis: Use curves_by_type_and_degradation view';
RAISE NOTICE '';
RAISE NOTICE 'Next: Run prisma/migrations/004_complete_workflow_migration.sql for scheduling'; 