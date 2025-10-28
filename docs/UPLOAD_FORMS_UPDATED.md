# Upload Forms Updated for Schema Refactoring

**Date:** October 24, 2025  
**Status:** ✅ **COMPLETE - FORMS UPDATED**

## Summary

Updated the curve upload forms to properly separate definition fields from instance fields after the schema refactoring.

## Changes Made

### CurveDefinition Form (Simplified)

**REMOVED Fields** (moved to instance):
- ❌ Product
- ❌ Curve Type
- ❌ Commodity
- ❌ Granularity
- ❌ Scenario
- ❌ Degradation Type

**KEPT Fields** (general definition):
- ✅ Curve Name (unique identifier)
- ✅ Market (CAISO, ERCOT, PJM, etc.)
- ✅ Location (SP15, Houston, etc.)
- ✅ Battery Duration (2H, 4H, 8H)
- ✅ Units ($/MWh, $/kW-month, etc.)
- ✅ Timezone (UTC, America/Los_Angeles, etc.)
- ✅ Description (optional)

### CurveInstance Form (Enhanced)

**ADDED Fields** (moved from definition):
- ✅ Curve Type* (Revenue Forecast, Price Forecast)
- ✅ Commodity* (Total Revenue, EA Revenue, AS Revenue)
- ✅ Granularity* (MONTHLY, QUARTERLY, ANNUAL, HOURLY, DAILY)
- ✅ Scenario (BASE, HIGH, LOW, P50, P90)
- ✅ Degradation Type (NONE, YEAR_1, YEAR_5, YEAR_10, YEAR_15, YEAR_20)

**EXISTING Fields** (unchanged):
- ✅ Instance Version
- ✅ Delivery Period Start/End
- ✅ Model Type
- ✅ Created By
- ✅ Notes

## Updated Files

### API Endpoints
1. ✅ `src/pages/api/curve-upload/create-definition.ts`
   - Removed: product, curveType, commodity, granularity, scenario, degradationType
   - Simplified validation (only requires: curveName, market, location)
   - Lookup by curveName (unique) instead of compound key

2. ✅ `src/pages/api/curve-upload/create-instance.ts`
   - Added: curveType, commodity, granularity, scenario, degradationType parameters
   - Saves these fields to CurveInstance

### UI Forms
1. ✅ `src/pages/admin/upload.astro`
   - **Definition Modal**: Removed 6 fields, added description
   - **Instance Modal**: Added 5 instance-specific fields
   - **JavaScript**: Updated form data collection and clearing functions

## Form Workflow

### Before (Complicated)
```
Step 1: Create Definition
  - Fill in 11+ fields including:
    * Curve Name: "SP15 Total Revenue Monthly BASE Yr1"
    * Market, Location, Product
    * Curve Type, Commodity
    * Granularity, Scenario, Degradation
    
Step 2: Create Instance
  - Just version and dates

Problem: Long, specific names; hard to group related curves
```

### After (Simplified)
```
Step 1: Create Definition (Quick!)
  - Fill in 4 required fields:
    * Curve Name: "SP15 Battery Revenue"
    * Market: CAISO
    * Location: SP15
    * Battery Duration: 4H
    
Step 2: Create Instance (Detailed)
  - Version and dates
  - Curve Type: "Revenue Forecast"
  - Commodity: "Total Revenue" or "EA Revenue" or "AS Revenue"
  - Granularity: MONTHLY or QUARTERLY or ANNUAL
  - Scenario: BASE or HIGH or LOW
  - Degradation: NONE or YEAR_5 or YEAR_10

Benefits: Short, general names; easy to create multiple variants
```

## Example Usage

### Create One Definition
```
Curve Name: "SP15 Battery Revenue"
Market: CAISO
Location: SP15
Battery Duration: 4H
Units: $/MWh
```

### Create Multiple Instances
```
Instance 1:
  - Curve Type: Revenue Forecast
  - Commodity: Total Revenue
  - Granularity: MONTHLY
  - Scenario: BASE
  - Degradation: NONE
  
Instance 2:
  - Curve Type: Revenue Forecast
  - Commodity: EA Revenue
  - Granularity: MONTHLY
  - Scenario: BASE
  - Degradation: NONE
  
Instance 3:
  - Curve Type: Revenue Forecast
  - Commodity: AS Revenue
  - Granularity: MONTHLY
  - Scenario: BASE
  - Degradation: NONE
  
Instance 4:
  - Curve Type: Revenue Forecast
  - Commodity: Total Revenue
  - Granularity: QUARTERLY
  - Scenario: HIGH
  - Degradation: YEAR_5
```

All under one clean definition name!

## Field Options

### Curve Type (on instance)
- Revenue Forecast
- Price Forecast

### Commodity (on instance)
- Total Revenue
- EA Revenue
- AS Revenue

### Granularity (on instance)
- MONTHLY
- QUARTERLY
- ANNUAL
- HOURLY
- DAILY

### Scenario (on instance)
- BASE
- HIGH
- LOW
- P50
- P90

### Degradation Type (on instance)
- NONE
- YEAR_1
- YEAR_5
- YEAR_10
- YEAR_15
- YEAR_20

## Testing

### API Tests
Run after restarting server:
```bash
npx tsx scripts/test-api-endpoints.ts
```

Expected: All endpoints return 200

### Visual Tests
1. Go to `/admin/upload`
2. Click "Add Definition"
   - Should see simplified form (no product, curveType, etc.)
   - Only 7 fields total
3. Create a definition
4. Click "Add Instance"
   - Should see enhanced form with curveType, commodity, etc.
   - 11 fields total
5. Create instance
6. Upload data

### Expected Behavior
- ✅ Can create definition with just name, market, location
- ✅ Instance form includes all variant-specific fields
- ✅ Can create multiple instances with different types/commodities
- ✅ All instances grouped under one definition

## Migration Status

```
Database: ✅ Migrated (3/3 instances)
Prisma Schema: ✅ Updated
API Endpoints: ✅ Updated (6 files)
UI Forms: ✅ Updated (upload.astro)
Form JavaScript: ✅ Updated (handlers and helpers)
```

## Files Modified

1. ✅ `src/pages/api/curve-upload/create-definition.ts`
2. ✅ `src/pages/api/curve-upload/create-instance.ts`
3. ✅ `src/pages/admin/upload.astro`

**Note:** Other upload forms (`upload-v2.astro`, `upload-clean.astro`) can be updated later or deprecated.

## Restart Required

**After restarting the dev server**, the upload forms will work correctly with the new schema:
- Definition form: Simplified (7 fields)
- Instance form: Enhanced (11 fields)
- All instance-specific properties properly organized

---

**🎉 Upload forms are now aligned with the new schema structure!**

**Action Required:** Restart dev server with `npm run dev`

