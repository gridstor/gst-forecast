# Curve Data Query Fix - Database Schema Alignment

**Date:** October 24, 2025  
**Status:** ✅ Fixed

## Problem

The forecast grapher was failing with this error:

```
Database query error: error: column cd.value does not exist
hint: 'Perhaps you meant to reference the column "cd.valueP5".'
```

## Root Cause

**Schema Mismatch**: The code was assuming the `CurveData` table stored data in **tall format** (with `pValue` and `value` columns), but the actual database has been migrated to **wide format** with pre-pivoted columns.

### Expected (by code):
```sql
-- TALL FORMAT
| id | curveInstanceId | timestamp | pValue | value |
|----|-----------------|-----------|--------|-------|
| 1  | 1               | 2024-01   | 5      | 10.5  |
| 2  | 1               | 2024-01   | 50     | 12.3  |
| 3  | 1               | 2024-01   | 95     | 15.7  |
```

### Actual (in database):
```sql
-- WIDE FORMAT (Pivoted)
| id | curveInstanceId | timestamp | valueP5 | valueP25 | valueP50 | valueP75 | valueP95 |
|----|-----------------|-----------|---------|----------|----------|----------|----------|
| 1  | 1               | 2024-01   | 10.5    | 11.2     | 12.3     | 14.1     | 15.7     |
```

## Solution

Updated queries to use the actual pivoted column names instead of trying to pivot with SQL FILTER.

### Files Modified

#### 1. `/api/curves/data-with-pvalues.ts`

**Before:**
```typescript
// ❌ Tried to pivot with FILTER
MAX(cd.value) FILTER (WHERE cd."pValue" = 5) as "valueP5",
MAX(cd.value) FILTER (WHERE cd."pValue" = 25) as "valueP25",
// ... GROUP BY required
```

**After:**
```typescript
// ✅ Use actual pivoted columns
cd."valueP5",
cd."valueP25",
cd."valueP50",
cd."valueP75",
cd."valueP95"
// No GROUP BY needed - data already pivoted
```

#### 2. `/api/curves/data.ts`

Same fix applied to the `curveInstanceId` query path.

**Changes:**
- Removed FILTER clauses and MAX aggregations
- Removed GROUP BY clause (no longer needed)
- Directly select pivoted columns
- Simplified query structure

## Key Learnings

### Database Structure

**CurveData Table** (`Forecasts.CurveData`):
- ✅ Stores data in **WIDE FORMAT** with pivoted columns
- Columns: `valueP5`, `valueP25`, `valueP50`, `valueP75`, `valueP95`
- One row per timestamp per instance (already pivoted)

**PriceForecast Table** (`Forecasts.PriceForecast`):
- ✅ Stores data in **TALL FORMAT** with separate p-value rows
- Columns: `pValue`, `value`
- Multiple rows per timestamp (one for each p-value)

### How to Verify Schema

Found the correct structure by examining the working endpoint at:
```
src/pages/api/curves/instance/[id]/preview.ts
```

This endpoint successfully queries CurveData using:
```sql
SELECT 
  cd."timestamp",
  cd."valueP5",
  cd."valueP25", 
  cd."valueP50",
  cd."valueP75",
  cd."valueP95"
FROM "Forecasts"."CurveData" cd
```

## Impact

### Before Fix
- ❌ Forecast grapher completely broken
- ❌ API health check failing
- ❌ 500 errors on data endpoints

### After Fix
- ✅ Forecast grapher working
- ✅ API health check passing
- ✅ All curve data endpoints functional

## Testing

To verify the fix works:

1. Navigate to forecast grapher (e.g., `/revenue-forecasts`)
2. Select curves and view data
3. Check that p-values display correctly
4. Run API health check at `/admin/api-health`

## Notes

- The Prisma schema in `prisma/schema.prisma` shows CurveData with `pValue` and `value` columns (tall format)
- This doesn't match the actual database which has pivoted columns
- **TODO**: Consider updating Prisma schema to match actual database structure
- Both table formats work fine - just need to query them correctly!

## Related Files

- ✅ `src/pages/api/curves/data-with-pvalues.ts` - Fixed
- ✅ `src/pages/api/curves/data.ts` - Fixed
- 📋 `src/pages/api/curves/instance/[id]/preview.ts` - Reference (already correct)
- ⚠️ `prisma/schema.prisma` - Schema documentation needs update





