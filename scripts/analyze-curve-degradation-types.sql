-- Comprehensive Analysis of Curve Definitions including Degradation and Curve Types
-- This reveals the actual structure and data patterns in your curve_definitions table

-- ========== STEP 1: SHOW TABLE STRUCTURE ==========
-- First, let's see what columns actually exist in your table

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'Forecasts' 
  AND table_name = 'curve_definitions'
ORDER BY ordinal_position;

-- ========== STEP 2: SAMPLE DATA EXPLORATION ==========
-- Show sample records to understand the data structure

SELECT *
FROM "Forecasts".curve_definitions
LIMIT 5;

-- ========== STEP 3: ANALYZE UNIQUE FIELD VALUES ==========
-- Check for degradation-related fields

-- Look for any columns that might contain degradation info
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT mark_case) as unique_mark_cases,
    COUNT(DISTINCT value_type) as unique_value_types,
    COUNT(DISTINCT mark_model_type_desc) as unique_model_types
FROM "Forecasts".curve_definitions;

-- Analyze mark_case patterns (might contain degradation info)
SELECT 
    mark_case,
    COUNT(*) as count,
    STRING_AGG(DISTINCT CONCAT(market, '-', location, '-', mark_type), ', ') as curves
FROM "Forecasts".curve_definitions
GROUP BY mark_case
ORDER BY COUNT(*) DESC;

-- Analyze value_type patterns (might indicate curve types)
SELECT 
    value_type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT mark_type, ', ') as associated_mark_types
FROM "Forecasts".curve_definitions
GROUP BY value_type
ORDER BY COUNT(*) DESC;

-- ========== STEP 4: DEEP PATTERN ANALYSIS ==========
-- Look for degradation patterns in mark_case or other fields

-- Check if mark_case contains degradation years
SELECT 
    mark_case,
    CASE 
        WHEN mark_case LIKE '%2024%' THEN '2024'
        WHEN mark_case LIKE '%2025%' THEN '2025'
        WHEN mark_case LIKE '%2026%' THEN '2026'
        WHEN mark_case LIKE '%2027%' THEN '2027'
        WHEN mark_case LIKE '%2028%' THEN '2028'
        WHEN mark_case LIKE '%2029%' THEN '2029'
        WHEN mark_case LIKE '%2030%' THEN '2030'
        WHEN mark_case LIKE '%degradation%' OR mark_case LIKE '%deg%' THEN 'Has Degradation'
        WHEN mark_case LIKE '%undegraded%' OR mark_case LIKE '%no deg%' THEN 'No Degradation'
        ELSE 'Unknown Pattern'
    END as degradation_indicator,
    COUNT(*) as count
FROM "Forecasts".curve_definitions
GROUP BY mark_case
ORDER BY mark_case;

-- Check for curve type patterns in mark_type
SELECT 
    mark_type,
    CASE 
        WHEN mark_type ILIKE '%revenue%' THEN 'Revenue'
        WHEN mark_type ILIKE '%energy%' THEN 'Energy'
        WHEN mark_type ILIKE '%arb%' THEN 'Energy Arb'
        WHEN mark_type ILIKE '%AS%' OR mark_type ILIKE '%ancillary%' THEN 'Ancillary Services'
        WHEN mark_type ILIKE '%TB2%' THEN 'TB2'
        WHEN mark_type ILIKE '%TB4%' THEN 'TB4'
        WHEN mark_type ILIKE '%RA%' OR mark_type ILIKE '%resource%adequacy%' THEN 'Resource Adequacy'
        ELSE 'Other'
    END as curve_type_category,
    COUNT(*) as count,
    STRING_AGG(DISTINCT location, ', ') as locations
FROM "Forecasts".curve_definitions
GROUP BY mark_type
ORDER BY curve_type_category, mark_type;

-- ========== STEP 5: COMPREHENSIVE GROUPING ANALYSIS ==========
-- Show actual data distribution with all relevant fields

SELECT 
    market,
    mark_type,
    location,
    mark_case,
    value_type,
    granularity,
    COUNT(*) as count,
    -- Extract potential degradation info from mark_case
    CASE 
        WHEN mark_case LIKE '%2024%' THEN 'Deg_2024'
        WHEN mark_case LIKE '%2025%' THEN 'Deg_2025'
        WHEN mark_case LIKE '%2026%' THEN 'Deg_2026'
        WHEN mark_case LIKE '%2027%' THEN 'Deg_2027'
        WHEN mark_case LIKE '%2028%' THEN 'Deg_2028'
        WHEN mark_case LIKE '%2029%' THEN 'Deg_2029'
        WHEN mark_case LIKE '%2030%' THEN 'Deg_2030'
        WHEN LOWER(mark_case) LIKE '%undeg%' OR LOWER(mark_case) LIKE '%no deg%' THEN 'Undegraded'
        WHEN LOWER(mark_case) LIKE '%deg%' THEN 'Has_Degradation'
        ELSE 'No_Deg_Info'
    END as degradation_scenario,
    -- Extract curve type from mark_type
    CASE 
        WHEN mark_type ILIKE '%revenue%' THEN 'Revenue'
        WHEN mark_type ILIKE '%energy%arb%' THEN 'Energy_Arb'
        WHEN mark_type ILIKE '%energy%' THEN 'Energy'
        WHEN mark_type ILIKE '%AS%' OR mark_type ILIKE '%ancillary%' THEN 'AS'
        WHEN mark_type ILIKE '%TB2%' THEN 'TB2'
        WHEN mark_type ILIKE '%TB4%' THEN 'TB4'
        WHEN mark_type ILIKE '%RA%' THEN 'RA'
        ELSE 'Other'
    END as curve_type
FROM "Forecasts".curve_definitions
GROUP BY market, mark_type, location, mark_case, value_type, granularity
ORDER BY market, location, mark_type, mark_case;

-- ========== STEP 6: CONCEPTUAL CURVE IDENTITY ANALYSIS ==========
-- Determine what should constitute a unique CurveDefinition

WITH conceptual_analysis AS (
    SELECT 
        market,
        location,
        -- Clean up mark_type for conceptual grouping
        CASE 
            WHEN mark_type ILIKE '%revenue%' THEN 'REVENUE'
            WHEN mark_type ILIKE '%energy%arb%' THEN 'ENERGY_ARB'
            WHEN mark_type ILIKE '%energy%' THEN 'ENERGY'
            WHEN mark_type ILIKE '%AS%' OR mark_type ILIKE '%ancillary%' THEN 'AS'
            WHEN mark_type ILIKE '%TB2%' THEN 'TB2'
            WHEN mark_type ILIKE '%TB4%' THEN 'TB4'
            WHEN mark_type ILIKE '%RA%' THEN 'RA'
            ELSE UPPER(mark_type)
        END as curve_type,
        -- Extract degradation scenario
        CASE 
            WHEN mark_case LIKE '%2024%' THEN 'DEG_2024'
            WHEN mark_case LIKE '%2025%' THEN 'DEG_2025'
            WHEN mark_case LIKE '%2026%' THEN 'DEG_2026'
            WHEN mark_case LIKE '%2027%' THEN 'DEG_2027'
            WHEN mark_case LIKE '%2028%' THEN 'DEG_2028'
            WHEN mark_case LIKE '%2029%' THEN 'DEG_2029'
            WHEN mark_case LIKE '%2030%' THEN 'DEG_2030'
            WHEN LOWER(mark_case) LIKE '%undeg%' OR LOWER(mark_case) LIKE '%no deg%' THEN 'UNDEGRADED'
            WHEN LOWER(mark_case) LIKE '%deg%' THEN 'DEGRADED'
            ELSE 'DEFAULT'
        END as degradation_scenario,
        COUNT(*) as instance_count,
        COUNT(DISTINCT granularity) as granularity_count,
        STRING_AGG(DISTINCT granularity, ', ') as granularities,
        MIN(created_at) as first_created,
        MAX(created_at) as last_created
    FROM "Forecasts".curve_definitions
    GROUP BY market, location, curve_type, degradation_scenario
)
SELECT 
    market,
    location,
    curve_type,
    degradation_scenario,
    instance_count,
    granularity_count,
    granularities,
    -- This would be the conceptual curve name
    CONCAT(market, '_', location, '_', curve_type, '_', degradation_scenario) as proposed_curve_name
FROM conceptual_analysis
ORDER BY market, location, curve_type, degradation_scenario;

-- ========== STEP 7: FINAL CONSOLIDATION SUMMARY ==========

DO $$
DECLARE
    v_total_records INTEGER;
    v_unique_base_curves INTEGER;
    v_unique_with_degradation INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_records FROM "Forecasts".curve_definitions;
    
    -- Count unique base curves (market + location + mark_type)
    WITH base_curves AS (
        SELECT DISTINCT market, location, mark_type
        FROM "Forecasts".curve_definitions
    )
    SELECT COUNT(*) INTO v_unique_base_curves FROM base_curves;
    
    -- Count unique curves including degradation scenarios
    WITH full_curves AS (
        SELECT DISTINCT 
            market, 
            location,
            CASE 
                WHEN mark_type ILIKE '%revenue%' THEN 'REVENUE'
                WHEN mark_type ILIKE '%energy%arb%' THEN 'ENERGY_ARB'
                WHEN mark_type ILIKE '%energy%' THEN 'ENERGY'
                WHEN mark_type ILIKE '%AS%' THEN 'AS'
                WHEN mark_type ILIKE '%TB2%' THEN 'TB2'
                WHEN mark_type ILIKE '%TB4%' THEN 'TB4'
                WHEN mark_type ILIKE '%RA%' THEN 'RA'
                ELSE UPPER(mark_type)
            END as curve_type,
            CASE 
                WHEN mark_case LIKE '%202%' THEN SUBSTRING(mark_case FROM '(202[0-9])')
                WHEN LOWER(mark_case) LIKE '%undeg%' THEN 'UNDEGRADED'
                WHEN LOWER(mark_case) LIKE '%deg%' THEN 'DEGRADED'
                ELSE 'DEFAULT'
            END as degradation_scenario
        FROM "Forecasts".curve_definitions
    )
    SELECT COUNT(*) INTO v_unique_with_degradation FROM full_curves;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== CONSOLIDATION ANALYSIS SUMMARY =====';
    RAISE NOTICE 'Total curve_definitions records: %', v_total_records;
    RAISE NOTICE 'Unique base curves (market/location/type): %', v_unique_base_curves;
    RAISE NOTICE 'Unique curves with degradation scenarios: %', v_unique_with_degradation;
    RAISE NOTICE '';
    RAISE NOTICE 'This means:';
    RAISE NOTICE '- You have % total records that will become CurveInstances', v_total_records;
    RAISE NOTICE '- You need ~% CurveDefinitions when considering degradation', v_unique_with_degradation;
END $$; 