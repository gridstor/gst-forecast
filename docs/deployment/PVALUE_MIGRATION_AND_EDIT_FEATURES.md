# P-Value Migration & Edit Features Implementation

## Overview
This document describes the major updates to the curve management system:
1. **P-Value Storage Migration**: From wide format to tall format for flexibility
2. **Full Edit Functionality**: Complete CRUD operations for CurveDefinition and CurveInstance

## Changes Made

### 1. Database Schema Changes

#### **From Wide Format to Tall Format**

**Before (Wide Format):**
```sql
CREATE TABLE "PriceForecast" (
  id INT PRIMARY KEY,
  curveInstanceId INT,
  timestamp TIMESTAMPTZ,
  valueP5 FLOAT,
  valueP25 FLOAT,
  valueP50 FLOAT,  -- Required
  valueP75 FLOAT,
  valueP95 FLOAT
);
```

**After (Tall Format):**
```sql
CREATE TABLE "PriceForecast" (
  id INT PRIMARY KEY,
  curveInstanceId INT,
  timestamp TIMESTAMPTZ,
  pValue INT,      -- 5, 25, 50, 75, 95, etc.
  value FLOAT,
  flags TEXT[],
  UNIQUE(curveInstanceId, timestamp, pValue)
);
```

#### **Benefits of Tall Format:**
- ✅ **Flexibility**: Store any p-value (P10, P30, P67, etc.) without schema changes
- ✅ **Efficiency**: Only store p-values you actually have
- ✅ **Simplicity**: No need for conditional logic for missing columns
- ✅ **Rapid uploads**: Can upload just P50 values quickly without worrying about other columns

### 2. Migration Script

**Location:** `scripts/migrate-pvalues-to-tall.sql`

**What it does:**
1. Creates new `PriceForecastTall` table
2. Migrates existing data from wide to tall format
3. Preserves both tables for verification
4. Includes optional commands to complete migration

**To run migration:**
```bash
# 1. Backup your database first!
pg_dump $DATABASE_URL > backup_before_pvalue_migration.sql

# 2. Run the migration (keeps both tables)
psql $DATABASE_URL < scripts/migrate-pvalues-to-tall.sql

# 3. Verify data
# Check row counts match expectations

# 4. Complete migration (after verification)
# Uncomment the DROP and RENAME commands in the script and re-run
```

### 3. Prisma Schema Updates

**Updated Models:**
- `PriceForecast`: Now uses tall format with `pValue` and `value` columns
- `CurveData`: Now uses tall format (consistent with PriceForecast)

**To apply Prisma changes:**
```bash
npx prisma generate
```

### 4. API Endpoints - Edit Functionality

#### **New Endpoints:**

##### **Edit CurveDefinition** (`/api/admin/edit-curve-definition`)
- **GET** `?id={id}` - Fetch definition for editing
- **PUT** - Update definition (all fields supported)
- **DELETE** - Delete definition and all instances (cascades)

**Editable Fields:**
- Basic: `curveName`, `market`, `location`, `product`, `commodity`
- Characteristics: `curveType`, `batteryDuration`, `scenario`, `degradationType`
- Data: `units`, `granularity`, `timezone`
- Meta: `description`, `isActive`

##### **Edit CurveInstance** (`/api/admin/edit-curve-instance`)
- **GET** `?id={id}` - Fetch instance for editing
- **PUT** - Update instance (all fields supported)
- **DELETE** - Delete instance and all data (cascades)

**Editable Fields:**
- Basic: `instanceVersion`, `status`, `runType`, `createdBy`
- Dates: `deliveryPeriodStart`, `deliveryPeriodEnd`, `forecastRunDate`, `freshnessStartDate`, `freshnessEndDate`
- Model: `modelType`, `modelVersion`
- Approval: `approvedBy`, `approvedAt`
- Notes: `notes`

### 5. UI Updates - Inventory Page

**Location:** `/admin/inventory` (`src/pages/admin/inventory.astro`)

**New Features:**
- ✅ **Full edit modals** with all fields
- ✅ **Validation** with required field indicators
- ✅ **Real-time updates** after save
- ✅ **Error handling** with user-friendly messages
- ✅ **Organized sections** for better UX

**How to Use:**
1. Navigate to `http://localhost:4321/admin/inventory`
2. Select a definition from left panel
3. Click "Edit Definition" button
4. Modify any fields
5. Click "Save Changes"
6. Similar process for instances

### 6. Upload/Ingestion Updates

**Location:** `src/pages/api/curve-upload/upload-data.ts`

**What Changed:**
- Now saves data in tall format (one row per p-value)
- Uses `createMany` for better performance
- Supports any p-value, not just predefined ones

**CSV Format (unchanged):**
```csv
timestamp,value,pvalue,units
2024-01-01T00:00:00Z,25.5,50,$/MWh
2024-01-01T00:00:00Z,22.0,5,$/MWh
2024-01-01T00:00:00Z,28.0,95,$/MWh
```

**Quick Upload Examples:**
```csv
# Just P50 values (fast)
timestamp,value,pvalue,units
2024-01-01,25.5,50,$/MWh
2024-02-01,26.0,50,$/MWh

# Multiple p-values
timestamp,value,pvalue,units
2024-01-01,25.5,50,$/MWh
2024-01-01,22.0,25,$/MWh
2024-01-01,28.0,75,$/MWh
```

### 7. Data Retrieval Updates

**Location:** `src/pages/api/curves/data.ts`

**What Changed:**
- Queries pivot tall data to wide format for backward compatibility
- Uses PostgreSQL `FILTER` clause for efficient pivoting
- Front-end code doesn't need to change

**Example Query (internal):**
```sql
SELECT 
  timestamp,
  MAX(value) FILTER (WHERE pValue = 5) as valueP5,
  MAX(value) FILTER (WHERE pValue = 50) as valueP50,
  MAX(value) FILTER (WHERE pValue = 95) as valueP95
FROM CurveData
WHERE curveInstanceId = $1
GROUP BY timestamp
ORDER BY timestamp
```

## Testing Checklist

### Edit Functionality
- [ ] Edit CurveDefinition name
- [ ] Change market, location, product
- [ ] Update curve type and characteristics
- [ ] Modify description and status
- [ ] Delete definition (verify cascade)
- [ ] Edit CurveInstance version
- [ ] Change status and dates
- [ ] Update model information
- [ ] Add/edit notes
- [ ] Delete instance (verify cascade)

### P-Value Upload
- [ ] Upload just P50 values
- [ ] Upload multiple p-values (5, 25, 50, 75, 95)
- [ ] Upload custom p-values (e.g., P10, P30)
- [ ] Verify data displays correctly
- [ ] Download and verify CSV export

### Data Retrieval
- [ ] View curves in chart (should show P50 by default)
- [ ] View instance detail (should show all p-values)
- [ ] Download CSV (should export all p-values)
- [ ] Verify no errors in console

## Migration Steps (Production)

1. **Backup Everything**
   ```bash
   pg_dump $DATABASE_URL > backup_before_migration.sql
   ```

2. **Run Migration Script**
   ```bash
   psql $DATABASE_URL < scripts/migrate-pvalues-to-tall.sql
   ```

3. **Verify Data**
   - Check row counts
   - Spot-check some curves
   - Verify all p-values migrated

4. **Update Application Code**
   ```bash
   npx prisma generate
   npm run build
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

6. **Verify in Production**
   - Test edit functionality
   - Test upload with P50 only
   - Test upload with multiple p-values
   - Test data retrieval and display

7. **Complete Migration** (After Verification)
   - Drop old `PriceForecast` table
   - Rename `PriceForecastTall` to `PriceForecast`

## Common Use Cases

### Use Case 1: Quick P50 Upload
```csv
timestamp,value,pvalue
2024-01-01,25.5,50
2024-02-01,26.0,50
```
✅ No need to provide empty columns for other p-values

### Use Case 2: Fix Typo in Curve Name
1. Go to `/admin/inventory`
2. Select curve
3. Click "Edit Definition"
4. Fix `curveName`
5. Save
✅ Database updated, all instances still linked

### Use Case 3: Change Revenue Type
1. Go to `/admin/inventory`
2. Select curve
3. Click "Edit Definition"
4. Change `curveType` to correct value
5. Change `product` if needed
6. Save
✅ Curve categorization corrected

### Use Case 4: Upload Custom P-Values
```csv
timestamp,value,pvalue
2024-01-01,20.0,10
2024-01-01,25.5,50
2024-01-01,30.0,90
```
✅ Supports any p-value, not limited to 5, 25, 50, 75, 95

## Performance Notes

- **Tall format queries**: Use indexes on `pValue` for fast filtering
- **Wide format pivots**: Use GROUP BY with FILTER for efficient pivoting
- **Upload performance**: `createMany` is faster than individual inserts
- **Delete operations**: CASCADE ensures data consistency

## Rollback Plan

If issues occur:
1. Restore from backup: `psql $DATABASE_URL < backup_before_migration.sql`
2. Revert code changes: `git revert <commit-hash>`
3. Redeploy: `netlify deploy --prod`

## Questions?

- Check console logs for detailed error messages
- Verify Prisma schema matches database
- Ensure migrations ran successfully
- Check network tab for API errors

## Related Files

- Migration: `scripts/migrate-pvalues-to-tall.sql`
- Prisma Schema: `prisma/schema.prisma`
- Edit APIs: `src/pages/api/admin/edit-curve-*.ts`
- Inventory Page: `src/pages/admin/inventory.astro`
- Upload API: `src/pages/api/curve-upload/upload-data.ts`
- Data API: `src/pages/api/curves/data.ts`

