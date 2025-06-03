-- Analyze Curve Variations
-- Understand what makes "duplicate" curves different before consolidation

-- Find curves that would have the same conceptual name
WITH curve_groups AS (
    SELECT 
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as conceptual_curve,
        curve_id,
        market,
        mark_type,
        location,
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
    SELECT 
        conceptual_curve,
        COUNT(*) as variant_count
    FROM curve_groups
    GROUP BY conceptual_curve
    HAVING COUNT(*) > 1
)
-- Show variations within each duplicate group
SELECT 
    cg.conceptual_curve,
    cg.curve_id,
    cg.granularity,
    cg.mark_case,
    cg.mark_model_type_desc,
    cg.value_type,
    cg.curve_creator,
    cg.created_at::date as created_date,
    cg.mark_date::date as mark_date,
    pf_stats.price_count,
    pf_stats.min_price_date,
    pf_stats.max_price_date,
    pf_stats.date_range_days
FROM curve_groups cg
JOIN duplicate_groups dg ON cg.conceptual_curve = dg.conceptual_curve
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as price_count,
        MIN(flow_date_start)::date as min_price_date,
        MAX(flow_date_start)::date as max_price_date,
        EXTRACT(DAY FROM MAX(flow_date_start) - MIN(flow_date_start)) as date_range_days
    FROM "Forecasts".price_forecasts pf
    WHERE pf.curve_id = cg.curve_id
) pf_stats ON true
ORDER BY cg.conceptual_curve, cg.created_at;

-- Summary of variation patterns
RAISE NOTICE '';
RAISE NOTICE '===== VARIATION PATTERN ANALYSIS =====';

-- Check granularity variations
WITH granularity_check AS (
    SELECT 
        conceptual_curve,
        COUNT(DISTINCT granularity) as different_granularities,
        STRING_AGG(DISTINCT granularity, ', ' ORDER BY granularity) as granularities
    FROM curve_groups
    WHERE conceptual_curve IN (SELECT conceptual_curve FROM duplicate_groups)
    GROUP BY conceptual_curve
)
SELECT 
    'Granularity Variations' as variation_type,
    COUNT(*) FILTER (WHERE different_granularities > 1) as curves_with_variation,
    STRING_AGG(
        CASE WHEN different_granularities > 1 
        THEN conceptual_curve || ': ' || granularities 
        END, 
        E'\n'
    ) as examples
FROM granularity_check;

-- Check model type variations
WITH model_check AS (
    SELECT 
        conceptual_curve,
        COUNT(DISTINCT mark_model_type_desc) as different_models,
        STRING_AGG(DISTINCT COALESCE(mark_model_type_desc, 'NULL'), ', ') as models
    FROM curve_groups
    WHERE conceptual_curve IN (SELECT conceptual_curve FROM duplicate_groups)
    GROUP BY conceptual_curve
)
SELECT 
    'Model Type Variations' as variation_type,
    COUNT(*) FILTER (WHERE different_models > 1) as curves_with_variation,
    STRING_AGG(
        CASE WHEN different_models > 1 
        THEN conceptual_curve || ': ' || models 
        END, 
        E'\n'
    ) as examples
FROM model_check;

-- Check date range overlaps
WITH date_overlap_check AS (
    SELECT 
        cg1.conceptual_curve,
        cg1.curve_id as curve1,
        cg2.curve_id as curve2,
        pf1.min_date as curve1_start,
        pf1.max_date as curve1_end,
        pf2.min_date as curve2_start,
        pf2.max_date as curve2_end,
        CASE 
            WHEN pf1.min_date IS NULL OR pf2.min_date IS NULL THEN 'NO_DATA'
            WHEN pf1.max_date < pf2.min_date OR pf2.max_date < pf1.min_date THEN 'NO_OVERLAP'
            ELSE 'OVERLAPPING'
        END as overlap_status
    FROM curve_groups cg1
    JOIN curve_groups cg2 ON cg1.conceptual_curve = cg2.conceptual_curve 
        AND cg1.curve_id < cg2.curve_id
    LEFT JOIN LATERAL (
        SELECT 
            MIN(flow_date_start) as min_date,
            MAX(flow_date_start) as max_date
        FROM "Forecasts".price_forecasts
        WHERE curve_id = cg1.curve_id
    ) pf1 ON true
    LEFT JOIN LATERAL (
        SELECT 
            MIN(flow_date_start) as min_date,
            MAX(flow_date_start) as max_date
        FROM "Forecasts".price_forecasts
        WHERE curve_id = cg2.curve_id
    ) pf2 ON true
)
SELECT 
    conceptual_curve,
    COUNT(*) as variant_pairs,
    COUNT(*) FILTER (WHERE overlap_status = 'OVERLAPPING') as overlapping_pairs,
    COUNT(*) FILTER (WHERE overlap_status = 'NO_OVERLAP') as non_overlapping_pairs,
    COUNT(*) FILTER (WHERE overlap_status = 'NO_DATA') as no_data_pairs
FROM date_overlap_check
GROUP BY conceptual_curve
HAVING COUNT(*) FILTER (WHERE overlap_status = 'OVERLAPPING') > 0
ORDER BY overlapping_pairs DESC;

-- Recommended consolidation strategy
RAISE NOTICE '';
RAISE NOTICE '===== CONSOLIDATION RECOMMENDATIONS =====';

WITH consolidation_strategy AS (
    SELECT 
        cg.conceptual_curve,
        COUNT(DISTINCT cg.curve_id) as total_variants,
        COUNT(DISTINCT cg.granularity) as granularity_count,
        COUNT(DISTINCT cg.mark_model_type_desc) as model_count,
        MAX(pf_stats.total_prices) as max_price_count,
        MIN(cg.created_at) as earliest_created,
        -- Pick the curve with most data as primary
        FIRST_VALUE(cg.curve_id) OVER (
            PARTITION BY cg.conceptual_curve 
            ORDER BY COALESCE(pf_stats.total_prices, 0) DESC, cg.created_at ASC
        ) as recommended_primary_id
    FROM curve_groups cg
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total_prices
        FROM "Forecasts".price_forecasts
        WHERE curve_id = cg.curve_id
    ) pf_stats ON true
    WHERE cg.conceptual_curve IN (SELECT conceptual_curve FROM duplicate_groups)
    GROUP BY cg.conceptual_curve, cg.curve_id, pf_stats.total_prices, cg.created_at
)
SELECT 
    conceptual_curve,
    total_variants,
    granularity_count,
    model_count,
    recommended_primary_id as "Use as CurveDefinition ID",
    total_variants - 1 as "Will create N CurveInstances"
FROM consolidation_strategy
WHERE curve_id = recommended_primary_id
ORDER BY total_variants DESC; 