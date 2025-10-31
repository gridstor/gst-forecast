# Documentation Update Summary

**Date:** October 30, 2025  
**Status:** ✅ Complete

## Overview

Updated all documentation to accurately reflect the current **array-based validation system** for curve definitions, instances, and data.

## Key System Architecture (Current State)

### Three-Tier Structure

```
CurveDefinition (Metadata)
  ↓
CurveInstance (Validation Arrays)
  - curveTypes: String[]
  - commodities: String[]
  - scenarios: String[]
  ↓
CurveData (Individual Rows)
  - curveType: String (must be in instance.curveTypes)
  - commodity: String (must be in instance.commodities)
  - scenario: String (must be in instance.scenarios)
  - value: Float
```

### How It Works

1. **CurveDefinition** - Contains market/location/battery metadata
   - One definition can have multiple instances

2. **CurveInstance** - Contains **validation whitelist arrays**
   - `curveTypes[]` - Array of allowed curve types
   - `commodities[]` - Array of allowed commodities
   - `scenarios[]` - Array of allowed scenarios
   - If array is empty `[]`, validation is skipped
   - If array has values, CSV rows must match

3. **CurveData** - Individual data rows
   - Each row has ONE curveType, ONE commodity, ONE scenario
   - Values must exist in the instance's arrays
   - Upload fails if any row has values not in arrays

## Files Updated

### 1. `docs/database/CURRENT_DATABASE_SCHEMA.md` ✅

**Changes:**
- Updated CurveInstance fields to show arrays (`curveTypes[]`, `commodities[]`, `scenarios[]`)
- Updated CurveData fields to show row-level values
- Added notes about validation whitelist pattern
- Updated CSV format examples to show multi-dimensional data
- Fixed upload workflow to reflect array requirements
- Corrected notes section to explain array validation

**Key Sections:**
- CurveInstance structure with array fields
- CurveData structure with individual values
- CSV format with curveType, commodity, scenario columns
- Upload workflow with array population requirements

### 2. `docs/CURVE_FORMAT_INSTRUCTIONS.md` ✅

**Changes:**
- Emphasized that arrays are **VALIDATION WHITELISTS** (critical!)
- Updated Multi-Value Array Fields section with detailed validation rules
- Added examples showing required instance arrays for CSV data
- Enhanced CSV validation rules with array matching requirements
- Updated Common Issues section with detailed error examples
- Added "CRITICAL" flags to array field documentation
- Clarified that upload fails if rows don't match arrays

**Key Sections:**
- Multi-value array fields marked as "CRITICAL!"
- CSV format example with matching instance arrays
- Detailed validation rules for each field
- Common issues with specific error messages and fixes
- Complete workflow with array emphasis

### 3. `docs/features/CURVE_SCHEMA_MIGRATION_COMPLETE.md` ✅

**Changes:**
- Updated "What Changed" section to show array-based structure
- Added CurveData row examples showing individual values
- Updated database schema section to mention array columns
- Updated Prisma schema section to show array fields
- Added "Example Values and Data Structure" section
- Clarified that instances have arrays, data has individual values
- Updated "Next Time You Upload Curves" section

**Key Sections:**
- Before/After comparison showing array structure
- Database schema changes (array columns)
- Example CurveInstance arrays
- Example CurveData rows
- Upload process with array validation

### 4. `docs/API_ENDPOINTS_UPDATED.md` ✅

**Changes:**
- Updated summary to mention array-based implementation
- Fixed endpoint examples to show array operations
- Added `flatMap()` operations for flattening arrays
- Updated SQL examples to show `unnest()` for array queries
- Added "Upload Endpoints" section
- Added verification queries for both instance and data tables
- Added "Key Implementation Details" section
- Updated status to reflect array-based schema

**Key Sections:**
- Array-based validation explanation
- Upload endpoint examples with array fields
- SQL queries using unnest() for arrays
- Verification queries for instance arrays and data rows
- Key implementation details about whitelist pattern

## What Was Wrong (Before Update)

The documentation incorrectly described:

1. **Single values on CurveInstance**
   - ❌ Documentation: `curveType: String`, `commodity: String`
   - ✅ Reality: `curveTypes: String[]`, `commodities: String[]`, `scenarios: String[]`

2. **P-value based system on CurveData**
   - ❌ Documentation: `valueP5`, `valueP25`, `valueP50`, `valueP75`, `valueP95`
   - ✅ Reality: `curveType`, `commodity`, `scenario`, `value` (one row per combination)

3. **No mention of validation**
   - ❌ Documentation: Didn't explain that arrays are validation whitelists
   - ✅ Reality: Upload strictly validates each row against instance arrays

4. **Unclear multi-dimensional structure**
   - ❌ Documentation: Suggested one curveType per instance
   - ✅ Reality: One instance can contain multiple types/commodities/scenarios

## What Is Correct Now

All documentation now accurately reflects:

1. **Array-based validation system**
   - CurveInstance has arrays that define allowed values
   - CurveData rows must match those arrays
   - Upload fails with detailed errors if validation fails

2. **Multi-dimensional data structure**
   - One instance can contain multiple curve types
   - One instance can contain multiple commodities
   - One instance can contain multiple scenarios
   - All related data grouped together

3. **Row-level categorization**
   - Each CurveData row has individual curveType/commodity/scenario
   - Multiple rows per timestamp for different combinations
   - Flexible and queryable structure

4. **Complete upload workflow**
   - Step 1: Create definition (metadata)
   - Step 2: Create instance with validation arrays
   - Step 3: Upload CSV with rows matching arrays
   - Clear validation rules and error messages

## Validation Rules (Documented Clearly)

1. **CurveInstance Arrays** (Whitelists)
   - Define which values are allowed in CSV
   - Can be empty `[]` to skip validation
   - Must contain ALL unique values from CSV if populated

2. **CurveData Rows** (Individual Values)
   - Each row must have values in instance arrays
   - Upload validates EVERY row before insertion
   - Fails with detailed errors showing:
     - Which row failed
     - Which value was invalid
     - What values are allowed

3. **Upload Behavior**
   - Deletes existing data before inserting new data
   - Validates all rows before any insertion
   - Sets instance status to ACTIVE on success
   - Returns detailed error info on failure

## Example Workflows Now Documented

### Complete Upload Example

```json
// 1. Create Definition
POST /api/curve-upload/create-definition
{
  "curveName": "ERCOT_Houston_2H_Revenue",
  "market": "ERCOT",
  "location": "Houston",
  "batteryDuration": "TWO_H"
}

// 2. Create Instance with Validation Arrays
POST /api/curve-upload/create-instance
{
  "curveDefinitionId": 1,
  "instanceVersion": "2025-01-15_v1",
  "deliveryPeriodStart": "2025-01-01T00:00:00Z",
  "deliveryPeriodEnd": "2025-03-31T23:59:59Z",
  "forecastRunDate": "2025-01-15T10:00:00Z",
  "createdBy": "Upload System",
  "curveTypes": ["Revenue Forecast"],
  "commodities": ["EA Revenue", "AS Revenue", "Total Revenue"],
  "scenarios": ["BASE", "HIGH", "LOW"]
}

// 3. Upload CSV Data
POST /api/curve-upload/upload-data
{
  "curveInstanceId": 1,
  "priceData": [
    {
      "timestamp": "2025-01-01T00:00:00Z",
      "value": 45.50,
      "curveType": "Revenue Forecast",
      "commodity": "EA Revenue",
      "scenario": "BASE"
    },
    {
      "timestamp": "2025-01-01T00:00:00Z",
      "value": 38.75,
      "curveType": "Revenue Forecast",
      "commodity": "AS Revenue",
      "scenario": "BASE"
    }
    // ... more rows
  ]
}
```

## Benefits of Current System

1. **Flexible** - One instance holds multiple types/commodities/scenarios
2. **Validated** - Strict validation ensures data quality
3. **Grouped** - Related data stays together under one instance
4. **Queryable** - Can filter by curveType/commodity/scenario
5. **Clear Errors** - Detailed validation error messages
6. **Multi-dimensional** - Complex data structures easily represented

## Testing Verification

All documentation has been verified against:

✅ Prisma schema (`prisma/schema.prisma`)
✅ API endpoints (`src/pages/api/curve-upload/*.ts`)
✅ Upload validation logic (`upload-data.ts`)
✅ Instance creation logic (`create-instance.ts`)

## Related Files

- `docs/database/CURRENT_DATABASE_SCHEMA.md` - Main schema reference
- `docs/CURVE_FORMAT_INSTRUCTIONS.md` - User-facing upload guide
- `docs/features/CURVE_SCHEMA_MIGRATION_COMPLETE.md` - Migration details
- `docs/API_ENDPOINTS_UPDATED.md` - API endpoint reference
- `prisma/schema.prisma` - Source of truth for schema

## Status

✅ **All documentation is now accurate and up-to-date**  
✅ **Array-based validation system fully documented**  
✅ **Upload workflows clearly explained**  
✅ **Validation rules and error messages documented**  
✅ **Examples reflect current implementation**  
✅ **Ready for user reference**

