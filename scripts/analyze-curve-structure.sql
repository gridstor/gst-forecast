-- Comprehensive Curve Structure Analysis
-- Identifies true conceptual curves and their variations

-- ========== STEP 1: ANALYZE CONCEPTUAL CURVE GROUPINGS ==========

-- Find all unique conceptual curves (market + mark_type + location)
WITH conceptual_curves AS (
    SELECT 
        market,
        mark_type,
        location,
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as conceptual_identity,
        COUNT(*) as variation_count,
        COUNT(DISTINCT granularity) as granularity_variations,
        COUNT(DISTINCT mark_model_type_desc) as model_variations,
        COUNT(DISTINCT curve_creator) as creator_variations,
        MIN(created_at) as first_created,
        MAX(created_at) as last_created
    FROM "Forecasts".curve_definitions
    GROUP BY market, mark_type, location
)
SELECT 
    conceptual_identity,
    market,
    mark_type,
    location,
    variation_count,
    granularity_variations,
    model_variations,
    CASE 
        WHEN variation_count = 1 THEN 'UNIQUE'
        WHEN variation_count > 1 THEN 'DUPLICATE'
    END as status
FROM conceptual_curves
ORDER BY variation_count DESC, conceptual_identity;

-- ========== STEP 2: DETAILED VARIATION ANALYSIS ==========

RAISE NOTICE '';
RAISE NOTICE '===== CURVE CONSOLIDATION SUMMARY =====';

DO $$
DECLARE
    v_total_records INTEGER;
    v_unique_concepts INTEGER;
    v_duplicates INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_records FROM "Forecasts".curve_definitions;
    
    WITH concepts AS (
        SELECT DISTINCT market, mark_type, location
        FROM "Forecasts".curve_definitions
    )
    SELECT COUNT(*) INTO v_unique_concepts FROM concepts;
    
    SELECT v_total_records - v_unique_concepts INTO v_duplicates;
    
    RAISE NOTICE 'Current curve_definitions records: %', v_total_records;
    RAISE NOTICE 'True unique conceptual curves: %', v_unique_concepts;
    RAISE NOTICE 'Duplicate variations to consolidate: %', v_duplicates;
END $$;

-- ========== STEP 3: SHOW VARIATIONS FOR DUPLICATE GROUPS ==========

-- Show what makes duplicates different
WITH curve_details AS (
    SELECT 
        curve_id,
        market,
        mark_type,
        location,
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as conceptual_identity,
        granularity,
        mark_case,
        mark_model_type_desc,
        value_type,
        curve_creator,
        created_at,
        mark_date
    FROM "Forecasts".curve_definitions
),
duplicate_groups AS (
    SELECT conceptual_identity
    FROM curve_details
    GROUP BY conceptual_identity
    HAVING COUNT(*) > 1
)
SELECT 
    cd.conceptual_identity,
    cd.curve_id,
    cd.granularity,
    cd.mark_case,
    cd.mark_model_type_desc,
    cd.created_at::date as created_date,
    pf_stats.price_count,
    pf_stats.date_range,
    ROW_NUMBER() OVER (
        PARTITION BY cd.conceptual_identity 
        ORDER BY COALESCE(pf_stats.price_count, 0) DESC, cd.created_at ASC
    ) as priority_rank
FROM curve_details cd
JOIN duplicate_groups dg ON cd.conceptual_identity = dg.conceptual_identity
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as price_count,
        CONCAT(
            MIN(flow_date_start)::date, ' to ', 
            MAX(flow_date_start)::date
        ) as date_range
    FROM "Forecasts".price_forecasts
    WHERE curve_id = cd.curve_id
) pf_stats ON true
ORDER BY cd.conceptual_identity, priority_rank;

-- ========== STEP 4: CONSOLIDATION RECOMMENDATIONS ==========

-- Identify primary curve for each conceptual group
WITH ranked_curves AS (
    SELECT 
        cd.*,
        ROW_NUMBER() OVER (
            PARTITION BY cd.market, cd.mark_type, cd.location
            ORDER BY 
                COALESCE(pf.price_count, 0) DESC,  -- Most price data first
                cd.created_at ASC                    -- Oldest if tie
        ) as selection_rank
    FROM "Forecasts".curve_definitions cd
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as price_count
        FROM "Forecasts".price_forecasts
        WHERE curve_id = cd.curve_id
    ) pf ON true
)
SELECT 
    market,
    mark_type,
    location,
    COUNT(*) as total_variations,
    MIN(CASE WHEN selection_rank = 1 THEN curve_id END) as recommended_primary_id,
    STRING_AGG(
        CASE WHEN selection_rank = 1 
        THEN 'PRIMARY: ID ' || curve_id || ' (' || granularity || ')'
        ELSE 'Instance: ID ' || curve_id || ' (' || granularity || ')'
        END,
        E'\n  ' 
        ORDER BY selection_rank
    ) as consolidation_plan
FROM ranked_curves
GROUP BY market, mark_type, location
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ========== STEP 5: INSTANCE DIFFERENTIATION ANALYSIS ==========

-- Analyze what attributes should differentiate instances
WITH curve_pairs AS (
    SELECT 
        cd1.market,
        cd1.mark_type,
        cd1.location,
        cd1.curve_id as curve1_id,
        cd2.curve_id as curve2_id,
        cd1.granularity as gran1,
        cd2.granularity as gran2,
        pf1.min_date as start1,
        pf1.max_date as end1,
        pf2.min_date as start2,
        pf2.max_date as end2,
        cd1.mark_model_type_desc as model1,
        cd2.mark_model_type_desc as model2
    FROM "Forecasts".curve_definitions cd1
    JOIN "Forecasts".curve_definitions cd2 
        ON cd1.market = cd2.market 
        AND cd1.mark_type = cd2.mark_type 
        AND cd1.location = cd2.location
        AND cd1.curve_id < cd2.curve_id
    LEFT JOIN LATERAL (
        SELECT 
            MIN(flow_date_start)::date as min_date,
            MAX(flow_date_start)::date as max_date
        FROM "Forecasts".price_forecasts
        WHERE curve_id = cd1.curve_id
    ) pf1 ON true
    LEFT JOIN LATERAL (
        SELECT 
            MIN(flow_date_start)::date as min_date,
            MAX(flow_date_start)::date as max_date
        FROM "Forecasts".price_forecasts
        WHERE curve_id = cd2.curve_id
    ) pf2 ON true
)
SELECT 
    'Granularity differs' as difference_type,
    COUNT(*) FILTER (WHERE gran1 != gran2) as count
FROM curve_pairs
UNION ALL
SELECT 
    'Date ranges overlap' as difference_type,
    COUNT(*) FILTER (
        WHERE start1 IS NOT NULL AND start2 IS NOT NULL 
        AND NOT (end1 < start2 OR end2 < start1)
    ) as count
FROM curve_pairs
UNION ALL
SELECT 
    'Date ranges distinct' as difference_type,
    COUNT(*) FILTER (
        WHERE start1 IS NOT NULL AND start2 IS NOT NULL 
        AND (end1 < start2 OR end2 < start1)
    ) as count
FROM curve_pairs
UNION ALL
SELECT 
    'Model type differs' as difference_type,
    COUNT(*) FILTER (WHERE COALESCE(model1, '') != COALESCE(model2, '')) as count
FROM curve_pairs; 