# Fix Duplicate Curves - Step by Step

## The Problem
Your migration failed because multiple curves would generate the same name. For example:
- `ERCOT_HOUSTON_AURORA_HOUSTON` appears more than once

## Quick Fix Steps

### 1. First, Analyze Your Duplicates
Run this in pgAdmin to see what duplicates you have:

```sql
-- Copy and paste from: scripts/analyze-duplicates-only.sql
```

This will show you:
- Which curve names are duplicated
- The curve IDs involved
- How many need renaming

### 2. Run the Fix Script
After reviewing the duplicates, run the complete fix:

```sql
-- Copy and paste from: scripts/fix-duplicate-curves.sql
```

This script will:
1. Analyze all duplicates
2. Create a backup table
3. Add a `unique_name` column
4. Rename duplicates by adding `_V2`, `_V3`, etc.
5. Verify all names are unique

### 3. Verify the Fix Worked
Check that unique names were created:

```sql
SELECT 
    curve_id,
    market || ' - ' || mark_type || ' - ' || location as original,
    unique_name as new_unique_name
FROM "Forecasts".curve_definitions
WHERE unique_name LIKE '%_V%'
ORDER BY unique_name;
```

### 4. Re-run the Migration
Now run the updated migration script:

```sql
-- Copy and paste from: prisma/migrations/002_energy_forecast_migration_real_data.sql
```

The migration now:
- Checks for the `unique_name` column
- Uses `unique_name` instead of generating names
- Will not have duplicate key errors

## Example Output

After running the fix script, you'll see something like:

```
Original: ERCOT - HOUSTON_AURORA - Houston
New Names:
- ERCOT_HOUSTON_AURORA_HOUSTON (first one, unchanged)
- ERCOT_HOUSTON_AURORA_HOUSTON_V2 (second one, renamed)
- ERCOT_HOUSTON_AURORA_HOUSTON_V3 (third one, if exists)
```

## If You Need to Rollback

The fix script created a backup table. To rollback:

```sql
BEGIN;

-- Restore original curves
DELETE FROM "Forecasts".curve_definitions 
WHERE curve_id IN (
    SELECT curve_id FROM "Forecasts".curve_definitions_backup_duplicates
);

INSERT INTO "Forecasts".curve_definitions
SELECT * FROM "Forecasts".curve_definitions_backup_duplicates;

-- Remove the unique_name column
ALTER TABLE "Forecasts".curve_definitions DROP COLUMN IF EXISTS unique_name;

-- Clean up
DROP TABLE IF EXISTS "Forecasts".curve_definitions_backup_duplicates;

COMMIT;
```

## Alternative: Manual Review

If you prefer to manually handle specific duplicates:

```sql
-- See specific duplicates for ERCOT HOUSTON AURORA
SELECT 
    curve_id,
    market,
    mark_type,
    location,
    mark_case,
    created_at
FROM "Forecasts".curve_definitions
WHERE market = 'ERCOT' 
  AND mark_type = 'HOUSTON_AURORA'
  AND location = 'Houston'
ORDER BY created_at;

-- Then manually update specific ones
UPDATE "Forecasts".curve_definitions
SET unique_name = 'ERCOT_HOUSTON_AURORA_HOUSTON_LEGACY'
WHERE curve_id = 123; -- Replace with actual ID
```

## Summary

1. **Analyze** - See what duplicates exist
2. **Fix** - Run the fix script to add unique names
3. **Verify** - Check all names are unique
4. **Migrate** - Run the migration again

The fix preserves all your data while ensuring unique names for the new architecture. 