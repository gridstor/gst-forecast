-- Refined Workflow-Compatible Curve Consolidation Script
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
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(location, 'LOC'), '_',
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

-- Display sample of consolidation groups
SELECT 
    refined_conceptual_identity,
    curve_type,
    degradation_scenario,
    COUNT(*) as instance_count,
    STRING_AGG(DISTINCT granularity, ', ' ORDER BY granularity) as granularities,
    SUM(price_count) as total_price_records
FROM refined_consolidation_strategy
GROUP BY refined_conceptual_identity, curve_type, degradation_scenario
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ========== STEP 2: CREATE NEW SCHEMA OBJECTS (Same as before) ==========

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
    CREATE TYPE "DegradationType" AS ENUM ('UNDEGRADED', 'DEG_2024', 'DEG_2025', 'DEG_2026', 'DEG_2027', 'DEG_2028', 'DEG_2029', 'DEG_2030', 'OTHER');
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

-- Create other tables (same structure as before)
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

-- Continue with other table creation (PriceForecast, LegacyCurveMapping, etc.)
-- [Same as before, abbreviated for clarity]

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

-- Continue with CurveInstance creation, mapping, and price migration
-- [Rest of the script follows the same pattern as the original but uses refined_consolidation_strategy]

-- ========== STEP N: CREATE ENHANCED WORKFLOW VIEWS ==========

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

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '===== REFINED CONSOLIDATION COMPLETE =====';
RAISE NOTICE 'Curve types and degradation scenarios are now part of curve identity';
RAISE NOTICE 'Use upload_page_curves_enhanced view to see full curve details';
RAISE NOTICE 'Use curves_by_type_and_degradation view to analyze distribution'; 