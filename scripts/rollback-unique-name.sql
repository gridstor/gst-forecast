-- Rollback the unique_name changes
-- This undoes the incorrect duplicate handling approach

BEGIN;

-- Check if we have the backup table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'Forecasts' 
        AND table_name = 'curve_definitions_backup_duplicates'
    ) THEN
        RAISE NOTICE 'No backup table found - will just remove unique_name column';
    ELSE
        RAISE NOTICE 'Found backup table - will restore original data';
    END IF;
END $$;

-- If backup exists, restore from it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'Forecasts' 
        AND table_name = 'curve_definitions_backup_duplicates'
    ) THEN
        -- Delete modified records
        DELETE FROM "Forecasts".curve_definitions 
        WHERE curve_id IN (
            SELECT curve_id FROM "Forecasts".curve_definitions_backup_duplicates
        );
        
        -- Restore original records
        INSERT INTO "Forecasts".curve_definitions
        SELECT * FROM "Forecasts".curve_definitions_backup_duplicates;
        
        -- Drop backup table
        DROP TABLE "Forecasts".curve_definitions_backup_duplicates;
        
        RAISE NOTICE 'Restored original curve definitions from backup';
    END IF;
END $$;

-- Remove the unique_name column
ALTER TABLE "Forecasts".curve_definitions 
DROP COLUMN IF EXISTS unique_name;

-- Verify rollback
SELECT 
    'Rollback complete' as status,
    COUNT(*) as total_curves,
    COUNT(*) FILTER (WHERE market = 'ERCOT') as ercot_curves,
    COUNT(*) FILTER (WHERE market = 'CAISO') as caiso_curves
FROM "Forecasts".curve_definitions;

COMMIT;

RAISE NOTICE 'Rollback complete - ready for proper consolidation approach'; 