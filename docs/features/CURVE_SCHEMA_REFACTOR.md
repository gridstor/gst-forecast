# Curve Schema Refactor: Move curveType and commodity to Instance Level

**Date:** October 24, 2025  
**Status:** ✅ Schema Updated, 🚧 Migration Ready, ✅ Inventory Updated

## Problem Statement

Previously, `curveType` and `commodity` were fields on `CurveDefinition`, forcing users to create separate definitions for related curves that are commonly used together.

### Example: Before
```
CurveDefinition: "SP15 Gridstor Optimized Total Revenue"
  - curveType: "REVENUE"
  - commodity: "Energy"

CurveDefinition: "SP15 Gridstor Optimized Energy Arbitrage"
  - curveType: "ENERGY_ARB"
  - commodity: "Energy"

CurveDefinition: "SP15 Gridstor Optimized Ancillary Services"
  - curveType: "AS"
  - commodity: "Ancillary Services"
```

This required creating 3 separate definitions for what is essentially the same project revenue forecast.

## Solution

Move `curveType` and `commodity` from `CurveDefinition` to `CurveInstance`, allowing a single definition to have multiple instances with different types and commodities.

### Example: After
```
CurveDefinition: "SP15 Gridstor Optimized Revenue"
  - market: "CAISO"
  - location: "SP15"
  - product: "Gridstor Optimized"
  
  Instances:
    - Instance 1:
        curveType: "REVENUE"
        commodity: "Total Revenue"
        instanceVersion: "v1.0"
    
    - Instance 2:
        curveType: "ENERGY_ARB"
        commodity: "Energy"
        instanceVersion: "v1.0"
    
    - Instance 3:
        curveType: "AS"
        commodity: "Ancillary Services"
        instanceVersion: "v1.0"
```

## Benefits

1. **Simplified Organization**: One definition for related curves
2. **Better Semantics**: Definition describes the general curve, instance specifies the specific type
3. **Flexible Uploads**: Upload multiple related curves in a single session
4. **Easier Project Finance**: Keep all project revenue components together
5. **Better Discussion**: Natural grouping for conversations about project revenue

## Schema Changes

### CurveDefinition

**Removed Fields:**
- `curveType` (VARCHAR(100))
- `commodity` (VARCHAR(50))

**Updated Index:**
- ❌ Removed: `idx_curveType_batteryDuration_scenario`
- ✅ Added: `idx_batteryDuration_scenario`

### CurveInstance

**Added Fields:**
- `curveType` (VARCHAR(100), nullable) - e.g., "REVENUE", "ENERGY_ARB", "AS"
- `commodity` (VARCHAR(50), nullable) - e.g., "Energy", "Capacity", "Ancillary Services"

**Added Index:**
- ✅ New: `idx_curveType_commodity` - for efficient filtering

## Migration Process

### Step 1: Run Migration SQL

File: `prisma/migrations/20251024_move_curvetype_commodity_to_instance.sql`

```sql
-- Add columns to CurveInstance
ALTER TABLE "Forecasts"."CurveInstance"
  ADD COLUMN IF NOT EXISTS "curveType" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "commodity" VARCHAR(50);

-- Migrate existing data
UPDATE "Forecasts"."CurveInstance" ci
SET 
  "curveType" = cd."curveType",
  "commodity" = cd."commodity"
FROM "Forecasts"."CurveDefinition" cd
WHERE ci."curveDefinitionId" = cd.id
  AND ci."curveType" IS NULL;

-- Create new index
CREATE INDEX IF NOT EXISTS "CurveInstance_curveType_commodity_idx" 
  ON "Forecasts"."CurveInstance"("curveType", "commodity");
```

**Note:** The old columns on `CurveDefinition` are NOT automatically dropped for safety. Drop them manually after verifying the migration.

### Step 2: Update Prisma Client

```bash
npx prisma generate
```

### Step 3: Restart Application

```bash
npm run dev
```

## Updated Components

### ✅ Prisma Schema (`prisma/schema.prisma`)

**CurveDefinition:**
- Removed `curveType` and `commodity` fields
- Updated comments to document the change
- Updated index to remove `curveType`

**CurveInstance:**
- Added `curveType` and `commodity` fields (nullable)
- Added new index on these fields
- Added documentation comments

### ✅ Curve Inventory Page (`src/pages/curve-tracker/inventory.astro`)

**Major Changes:**
1. **Data Loading**: Now fetches definitions + instances
2. **Filters**: Changed from "Mark Type/Case" to "Curve Type/Commodity"
3. **Table Display**: Shows curve types and commodities as badges
4. **Stats**: Updated to show instance counts instead of price points

**New Features:**
- Visual badges for curve types (blue) and commodities (green)
- Filter by curve type or commodity
- Shows instance count per definition
- Groups related curves under one definition

### 🚧 Curve Uploader (Pending)

**TODO**: Update uploader form to:
1. Select or create definition (without curveType/commodity)
2. Set curveType and commodity for each instance being uploaded
3. Support uploading multiple instances (different types) in one session

### 🚧 API Endpoints (Pending)

**Endpoints to Update:**
- `/api/curves/definitions` - Already works (no curveType in response)
- `/api/curves/instances` - Need to add curveType and commodity to response
- `/api/curve-upload/create-definition` - Remove curveType and commodity params
- `/api/curve-upload/create-instance` - Add curveType and commodity params
- Any other endpoints that query or filter by curveType

## Database Compatibility

### Backwards Compatibility

The migration is designed to be **non-breaking**:

1. ✅ Existing data is migrated automatically
2. ✅ Old columns remain until manually dropped
3. ✅ New columns are nullable, so existing code continues to work
4. ✅ Indexes are added, not replaced (old index remains)

### Rollback Plan

If you need to rollback:

1. The old `curveType` and `commodity` columns still exist on `CurveDefinition`
2. Simply revert the Prisma schema changes
3. Drop the new columns from `CurveInstance`:
   ```sql
   ALTER TABLE "Forecasts"."CurveInstance" 
     DROP COLUMN IF EXISTS "curveType",
     DROP COLUMN IF EXISTS "commodity";
   ```

## Testing

### Manual Test Steps

1. **View Inventory**:
   - Navigate to `/curve-tracker/inventory`
   - Verify curve definitions display correctly
   - Check that instance types show as badges
   - Test filtering by curve type and commodity

2. **Create New Curve**:
   - Go to `/curve-tracker/upload`
   - Create a new definition (e.g., "Test Revenue Bundle")
   - Upload instances with different curveTypes
   - Verify they appear under the same definition

3. **API Testing**:
   - Check `/api/curves/definitions` returns correct data
   - Check `/api/curves/instances?definitionId=X` includes curveType and commodity
   - Verify filters work correctly

### Expected Results

✅ **Inventory Page**:
- Definitions group related curves
- Badge display for types and commodities
- Filters work correctly
- Stats show correct counts

✅ **Database**:
- New columns exist on CurveInstance
- Data migrated from CurveDefinition
- Indexes created successfully

## Next Steps

### Immediate (Required)

1. **Run Migration SQL** - Execute the migration script
2. **Update Uploader** - Modify upload flow to set curveType/commodity on instance
3. **Update Upload API** - Adjust create-definition and create-instance endpoints
4. **Test Thoroughly** - Verify no regressions

### Future (Optional)

1. **Drop Old Columns** - After confirming everything works:
   ```sql
   ALTER TABLE "Forecasts"."CurveDefinition" 
     DROP COLUMN IF EXISTS "curveType",
     DROP COLUMN IF EXISTS "commodity";
   ```

2. **Batch Upload UI** - Create interface for uploading multiple instance types at once

3. **Instance Comparison** - Add UI to compare different instances (total revenue vs energy arb)

## Use Cases

### Project Finance Analysis

**Before**: Had to look at 3+ separate curve definitions  
**After**: All project revenue components under one definition

```
Definition: "Moss Landing BESS Revenue - Q4 2024"
  Instances:
    - Total Revenue (REVENUE)
    - Energy Arbitrage (ENERGY_ARB) 
    - Frequency Regulation (AS - Frequency)
    - Spinning Reserve (AS - Spinning)
```

### Multi-Commodity Projects

```
Definition: "CAISO Hybrid Solar+Storage"
  Instances:
    - Energy Revenue (ENERGY)
    - Capacity Revenue (CAPACITY)
    - Ancillary Services (AS)
    - REC Revenue (REC)
```

### Scenario Planning

```
Definition: "ERCOT Hub Average - 2025 Forecast"
  Instances:
    - Base Case Revenue (BASE)
    - High Case Revenue (HIGH)
    - Low Case Revenue (LOW)
```

## Files Modified

- ✅ `prisma/schema.prisma`
- ✅ `prisma/migrations/20251024_move_curvetype_commodity_to_instance.sql`
- ✅ `src/pages/curve-tracker/inventory.astro`
- 🚧 `src/pages/curve-tracker/upload.astro` (pending)
- 🚧 `src/pages/api/curve-upload/*.ts` (pending)
- 📄 `docs/features/CURVE_SCHEMA_REFACTOR.md` (this document)

## Notes

- This is a **structural improvement** that makes the data model more flexible
- It aligns with how project finance teams think about revenue curves
- The migration is designed to be **safe and reversible**
- Existing queries will continue to work during the transition
- Full backwards compatibility maintained until old columns are manually dropped

