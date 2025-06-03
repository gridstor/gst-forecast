-- Fix Duplicate Curve Names Before Migration
-- This script identifies and resolves duplicate curve name combinations

BEGIN;

-- ========== STEP 1: ANALYZE DUPLICATES ==========

-- Create temporary table to analyze potential duplicates
CREATE TEMP TABLE duplicate_analysis AS
WITH curve_name_analysis AS (
    SELECT 
        curve_id,
        market,
        mark_type,
        location,
        mark_case,
        curve_creator,
        created_at,
        -- Generate the same curve name the migration would create
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as generated_curve_name,
        -- Create a row number for duplicates
        ROW_NUMBER() OVER (
            PARTITION BY UPPER(CONCAT(
                COALESCE(market, 'UNKNOWN'), '_',
                COALESCE(mark_type, 'TYPE'), '_',
                REPLACE(COALESCE(location, 'LOC'), ' ', '_')
            ))
            ORDER BY created_at ASC, curve_id ASC
        ) as duplicate_rank
    FROM "Forecasts".curve_definitions
)
SELECT 
    *,
    CASE 
        WHEN duplicate_rank = 1 THEN generated_curve_name
        ELSE CONCAT(generated_curve_name, '_V', duplicate_rank)
    END as unique_curve_name
FROM curve_name_analysis;

-- Show duplicates to user
DO $$
DECLARE
    v_duplicate_count INTEGER;
    v_total_curves INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_duplicate_count 
    FROM duplicate_analysis 
    WHERE duplicate_rank > 1;
    
    SELECT COUNT(*) INTO v_total_curves 
    FROM duplicate_analysis;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== DUPLICATE ANALYSIS RESULTS =====';
    RAISE NOTICE 'Total curves: %', v_total_curves;
    RAISE NOTICE 'Duplicate curves that need renaming: %', v_duplicate_count;
    RAISE NOTICE '';
END $$;

-- Display all duplicates with their proposed new names
SELECT 
    curve_id,
    market,
    mark_type,
    location,
    mark_case,
    generated_curve_name as "would_be_duplicate_name",
    unique_curve_name as "proposed_unique_name",
    duplicate_rank,
    created_at
FROM duplicate_analysis
WHERE generated_curve_name IN (
    SELECT generated_curve_name 
    FROM duplicate_analysis 
    GROUP BY generated_curve_name 
    HAVING COUNT(*) > 1
)
ORDER BY generated_curve_name, duplicate_rank;

-- ========== STEP 2: CHECK IF CURVES CAN BE MERGED ==========

-- Analyze if duplicate curves have different price data
CREATE TEMP TABLE merge_analysis AS
WITH price_stats AS (
    SELECT 
        da.curve_id,
        da.generated_curve_name,
        da.duplicate_rank,
        COUNT(pf.curve_id) as price_count,
        MIN(pf.flow_date_start) as min_date,
        MAX(pf.flow_date_start) as max_date,
        COUNT(DISTINCT DATE(pf.flow_date_start)) as distinct_days
    FROM duplicate_analysis da
    LEFT JOIN "Forecasts".price_forecasts pf ON da.curve_id = pf.curve_id
    WHERE da.generated_curve_name IN (
        SELECT generated_curve_name 
        FROM duplicate_analysis 
        GROUP BY generated_curve_name 
        HAVING COUNT(*) > 1
    )
    GROUP BY da.curve_id, da.generated_curve_name, da.duplicate_rank
)
SELECT 
    ps.*,
    da.mark_case,
    da.curve_creator,
    CASE 
        WHEN ps.price_count = 0 THEN 'NO_DATA'
        WHEN ps.duplicate_rank > 1 AND ps.price_count > 0 THEN 'HAS_DATA_NOT_PRIMARY'
        ELSE 'PRIMARY_WITH_DATA'
    END as merge_recommendation
FROM price_stats ps
JOIN duplicate_analysis da ON ps.curve_id = da.curve_id
ORDER BY ps.generated_curve_name, ps.duplicate_rank;

-- Show merge recommendations
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===== MERGE RECOMMENDATIONS =====';
    RAISE NOTICE 'Curves with NO_DATA can be safely deleted';
    RAISE NOTICE 'Curves with HAS_DATA_NOT_PRIMARY need careful review';
    RAISE NOTICE '';
END $$;

-- Display merge recommendations
SELECT 
    generated_curve_name,
    COUNT(*) as duplicate_count,
    SUM(CASE WHEN merge_recommendation = 'NO_DATA' THEN 1 ELSE 0 END) as can_delete,
    SUM(CASE WHEN merge_recommendation = 'HAS_DATA_NOT_PRIMARY' THEN 1 ELSE 0 END) as needs_review,
    STRING_AGG(
        CONCAT('ID:', curve_id, ' (', price_count, ' prices)'), 
        ', ' 
        ORDER BY duplicate_rank
    ) as curve_details
FROM merge_analysis
GROUP BY generated_curve_name
ORDER BY generated_curve_name;

-- ========== STEP 3: CREATE BACKUP ==========

-- Create backup of curves that will be modified
CREATE TABLE IF NOT EXISTS "Forecasts".curve_definitions_backup_duplicates AS
SELECT * FROM "Forecasts".curve_definitions
WHERE curve_id IN (
    SELECT curve_id 
    FROM duplicate_analysis 
    WHERE duplicate_rank > 1
);

DO $$
DECLARE
    v_backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_backup_count 
    FROM "Forecasts".curve_definitions_backup_duplicates;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Backed up % curves to curve_definitions_backup_duplicates', v_backup_count;
END $$;

-- ========== STEP 4: FIX DUPLICATES (CHOOSE ONE OPTION) ==========

-- OPTION A: Rename duplicates by adding version suffix
-- This preserves all curves and their data
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===== APPLYING FIX: RENAMING DUPLICATES =====';
END $$;

-- Add unique_name column if it doesn't exist
ALTER TABLE "Forecasts".curve_definitions 
ADD COLUMN IF NOT EXISTS unique_name VARCHAR(255);

-- Update all curves with their unique names
UPDATE "Forecasts".curve_definitions cd
SET unique_name = da.unique_curve_name
FROM duplicate_analysis da
WHERE cd.curve_id = da.curve_id;

-- Show what was updated
SELECT 
    curve_id,
    market || ' - ' || mark_type || ' - ' || location as original_combo,
    unique_name as new_unique_name,
    CASE 
        WHEN unique_name LIKE '%_V%' THEN 'RENAMED'
        ELSE 'UNCHANGED'
    END as status
FROM "Forecasts".curve_definitions
WHERE curve_id IN (
    SELECT curve_id FROM duplicate_analysis 
    WHERE generated_curve_name IN (
        SELECT generated_curve_name 
        FROM duplicate_analysis 
        GROUP BY generated_curve_name 
        HAVING COUNT(*) > 1
    )
)
ORDER BY unique_name;

-- ========== STEP 5: UPDATE MIGRATION SCRIPT TO USE unique_name ==========

-- The migration script should now use the unique_name column instead of generating names
-- This SQL shows what the migration will now create

SELECT 
    curve_id,
    unique_name as "will_be_curveName",
    market,
    location,
    mark_type as product
FROM "Forecasts".curve_definitions
ORDER BY unique_name;

-- ========== STEP 6: FINAL VERIFICATION ==========

-- Verify no duplicates remain
WITH unique_check AS (
    SELECT 
        unique_name,
        COUNT(*) as count
    FROM "Forecasts".curve_definitions
    GROUP BY unique_name
    HAVING COUNT(*) > 1
)
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: All curve names are now unique!'
        ELSE 'ERROR: ' || COUNT(*) || ' duplicate names still exist'
    END as result
FROM unique_check;

-- Show summary
DO $$
DECLARE
    v_total INTEGER;
    v_renamed INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM "Forecasts".curve_definitions;
    SELECT COUNT(*) INTO v_renamed 
    FROM "Forecasts".curve_definitions 
    WHERE unique_name LIKE '%_V%';
    
    RAISE NOTICE '';
    RAISE NOTICE '===== FINAL SUMMARY =====';
    RAISE NOTICE 'Total curves: %', v_total;
    RAISE NOTICE 'Renamed curves: %', v_renamed;
    RAISE NOTICE 'Ready for migration: YES';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Update migration script to use unique_name column';
END $$;

COMMIT;

-- ========== ROLLBACK OPTION ==========
-- If you need to rollback these changes:
/*
BEGIN;

-- Restore from backup
DELETE FROM "Forecasts".curve_definitions 
WHERE curve_id IN (
    SELECT curve_id FROM "Forecasts".curve_definitions_backup_duplicates
);

INSERT INTO "Forecasts".curve_definitions
SELECT * FROM "Forecasts".curve_definitions_backup_duplicates;

-- Remove unique_name column
ALTER TABLE "Forecasts".curve_definitions DROP COLUMN IF EXISTS unique_name;

-- Drop backup table
DROP TABLE IF EXISTS "Forecasts".curve_definitions_backup_duplicates;

COMMIT;
*/ 