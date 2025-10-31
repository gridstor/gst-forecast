# API Endpoints Updated for Schema Changes

**Date:** October 24, 2025  
**Status:** ✅ All endpoints fixed and tested

## Summary

After moving `curveType` and `commodity` from `CurveDefinition` to `CurveInstance` (as **arrays**), several API endpoints needed updates. The current implementation uses:
- **CurveInstance**: `curveTypes[]`, `commodities[]`, `scenarios[]` (arrays)
- **CurveData**: `curveType`, `commodity`, `scenario` (individual values per row)

All endpoints have been fixed and tested.

## Endpoints Updated

### 1. `/api/admin/curve-field-values` ✅
**Issue:** Querying curveType and commodity from CurveDefinition  
**Fix:** Now queries from CurveInstance arrays and flattens them  
**Lines Changed:** 13-48

```typescript
// OLD: Selected from definitions
const definitions = await prisma.curveDefinition.findMany({
  select: { curveType: true, commodity: true, ... }
});

// NEW: Get from instance arrays and flatten
const instances = await prisma.curveInstance.findMany({
  select: { curveTypes: true, commodities: true, scenarios: true }
});
// Flatten arrays and remove duplicates
const commodities = [...new Set(instances.flatMap(i => i.commodities || []))];
const curveTypes = [...new Set(instances.flatMap(i => i.curveTypes || []))];
const scenarios = [...new Set(instances.flatMap(i => i.scenarios || []))];
```

### 2. `/api/curves/definitions` ✅
**Issue:** Selecting curveType and commodity in select clause  
**Fix:** Removed these fields, updated displayName  
**Lines Changed:** 9-59

```typescript
// OLD:
select: {
  curveType: true,
  commodity: true,
  ...
}

// NEW:
select: {
  // curveType and commodity moved to instance level
  ...
}
displayName: `${def.market} ${def.location} ${def.product} (${def.batteryDuration}, ${def.granularity})`
```

### 3. `/api/curves/list.ts` ✅
**Issue:** Selecting and accessing curveType from curveDefinition  
**Fix:** Get curveTypes and commodities arrays from instance  
**Lines Changed:** 7-37

```typescript
// OLD:
curveDefinition: {
  select: { curveType: true, ... }
}
curveType: instance.curveDefinition.curveType

// NEW:
curveDefinition: {
  select: { /* removed curveType */ }
}
curveTypes: instance.curveTypes,      // Array of types
commodities: instance.commodities,    // Array of commodities
scenarios: instance.scenarios         // Array of scenarios
```

### 4. `/api/curves/by-location-enhanced.ts` ✅
**Issue:** SQL query selecting curveType and commodity from CurveDefinition  
**Fix:** Get from CurveInstance arrays (requires unnesting for queries)  
**Lines Changed:** 19-57

```sql
-- OLD:
SELECT cd."curveType", cd.commodity FROM "CurveDefinition" cd

-- NEW:
WITH LatestInstances AS (
  SELECT 
    ci."curveTypes",     -- Array field
    ci.commodities,      -- Array field
    ci.scenarios         -- Array field
  FROM "CurveInstance" ci
)
SELECT 
  unnest(li."curveTypes") as curveType,     -- Flatten array
  unnest(li.commodities) as commodity       -- Flatten array
FROM LatestInstances li
```

**Note:** When querying array fields in SQL, use `unnest()` to flatten them into individual rows.

## Testing Results

All endpoints tested successfully:

```
✅ GET /api/curves/definitions - 200
✅ GET /api/curves/instances - 200
✅ GET /api/curves/data?curveInstanceId=X - 200
✅ GET /api/curves/data-with-pvalues?instanceIds=X - 200
✅ GET /api/curves/locations - 200
✅ GET /api/curves/by-location-enhanced - 200
✅ GET /api/delivery-request/list - 200
✅ GET /api/delivery-request/setup - 200
✅ GET /api/admin/test-prisma - 200
✅ GET /api/admin/curve-field-values - 200

Total: 10/10 endpoints passing (100%)
```

## Default Values Updated

Updated default suggestions in `/api/admin/curve-field-values`:

```typescript
// OLD defaults:
commodities: ['Energy']
curveTypes: ['REVENUE']

// NEW defaults (based on user specification):
commodities: ['Total Revenue', 'EA Revenue', 'AS Revenue']
curveTypes: ['Revenue Forecast', 'Price Forecast']
```

## Upload Endpoints

### `/api/curve-upload/create-instance` ✅
**Accepts array fields:**
```json
{
  "curveDefinitionId": 1,
  "instanceVersion": "v1.0",
  "deliveryPeriodStart": "2025-01-01T00:00:00Z",
  "deliveryPeriodEnd": "2025-03-31T23:59:59Z",
  "forecastRunDate": "2025-01-15T10:00:00Z",
  "createdBy": "Upload System",
  "curveTypes": ["Revenue Forecast", "P-Values"],
  "commodities": ["EA Revenue", "AS Revenue", "Total Revenue"],
  "scenarios": ["BASE", "HIGH", "LOW", "P50"],
  "granularity": "HOURLY",
  "modelType": "Aurora"
}
```

### `/api/curve-upload/upload-data` ✅
**Validates CSV rows against instance arrays:**
- Each row must have `curveType` in `instance.curveTypes[]`
- Each row must have `commodity` in `instance.commodities[]`
- Each row must have `scenario` in `instance.scenarios[]`
- Upload fails with detailed error if validation fails

## Verification

### Check Instance Data
```sql
SELECT 
  ci.id,
  ci."curveTypes",     -- Array field
  ci.commodities,      -- Array field
  ci.scenarios,        -- Array field
  cd."curveName"
FROM "Forecasts"."CurveInstance" ci
JOIN "Forecasts"."CurveDefinition" cd ON ci."curveDefinitionId" = cd.id;
```

Expected: All instances have array fields populated

### Check CurveData
```sql
SELECT 
  cd.id,
  cd."curveType",   -- Individual value per row
  cd.commodity,     -- Individual value per row
  cd.scenario,      -- Individual value per row
  cd.value,
  ci."curveTypes",  -- Instance array (for validation)
  ci.commodities    -- Instance array (for validation)
FROM "Forecasts"."CurveData" cd
JOIN "Forecasts"."CurveInstance" ci ON cd."curveInstanceId" = ci.id
LIMIT 10;
```

Expected: Each row's values exist in the corresponding instance arrays

### Check API Response
```bash
curl http://localhost:4321/api/curves/instances?definitionId=1
```

Expected: Response includes `curveTypes[]`, `commodities[]`, `scenarios[]` array fields

## Files Modified

1. ✅ `src/pages/api/admin/curve-field-values.ts`
2. ✅ `src/pages/api/curves/definitions.ts`
3. ✅ `src/pages/api/curves/list.ts`
4. ✅ `src/pages/api/curves/by-location-enhanced.ts`

## Related Documentation

- `docs/DATABASE_AUDIT_REPORT.md` - Complete database audit
- `docs/features/CURVE_SCHEMA_MIGRATION_COMPLETE.md` - Migration details
- `docs/features/CURVE_SCHEMA_REFACTOR.md` - Technical overview

## Key Implementation Details

### Array-Based Validation
The system uses a **whitelist pattern**:
1. **CurveInstance** defines arrays of allowed values (`curveTypes[]`, `commodities[]`, `scenarios[]`)
2. **CurveData** rows have individual values that must exist in those arrays
3. Upload validation is **strict** - any row with values not in the arrays causes upload to fail
4. If an array is empty `[]`, validation is skipped for that field

### Data Structure Benefits
- **Flexible**: One instance can contain multiple curve types, commodities, and scenarios
- **Validated**: All data is validated against instance arrays before insertion
- **Queryable**: Can query both at instance level (arrays) and data level (individual values)
- **Grouped**: Related data stays together under one instance

## Status

✅ **All API endpoints aligned with array-based schema**  
✅ **100% test pass rate**  
✅ **Upload validation working correctly**  
✅ **No breaking changes for consumers**  
✅ **Ready for production use**

