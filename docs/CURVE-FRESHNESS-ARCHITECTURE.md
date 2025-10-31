# Curve Data Freshness Architecture

## Overview

Freshness tracking has been moved from the **CurveInstance level** to the **CurveData level** to support different update cadences for different curve types and commodities within the same forecast run.

---

## Why This Change?

### The Problem

**Old Architecture (Instance-level freshness):**
```
CurveInstance: "GridStor Oct 25 Revenue Monthly"
  freshnessStartDate: 2025-10-25
  freshnessEndDate: NULL  ← Applied to EVERYTHING below
  └─ CurveData rows:
      ├─ Third-party AS curves   (updates weekly)
      ├─ Internal AS curves      (updates monthly)
      ├─ Total Revenue curves    (updates daily)
      └─ P-values                (updates quarterly)
```

**Problem**: All curve types share the same freshness period, but they update at different cadences!

### The Solution

**New Architecture (CurveData-level freshness):**
```
CurveInstance: "GridStor Oct 25 Revenue Monthly"
  └─ CurveData rows:
      ├─ Third-party AS curves
      │   freshnessStartDate: 2025-10-25
      │   freshnessEndDate: 2025-11-01  ← Superseded after 1 week
      ├─ Internal AS curves
      │   freshnessStartDate: 2025-10-25
      │   freshnessEndDate: NULL        ← Still current (monthly update)
      ├─ Total Revenue curves
      │   freshnessStartDate: 2025-10-25
      │   freshnessEndDate: 2025-10-26  ← Superseded next day
      └─ P-values
          freshnessStartDate: 2025-10-01
          freshnessEndDate: NULL        ← Current for 3 months
```

**Solution**: Each curve type/commodity can have its own freshness period!

---

## Schema Changes

### CurveData Table (NEW)

```prisma
model CurveData {
  // ... existing fields ...
  
  // NEW: Freshness at data level
  freshnessStartDate DateTime? @db.Timestamptz(6)
  freshnessEndDate   DateTime? @db.Timestamptz(6)
  
  @@index([freshnessStartDate, freshnessEndDate])
  @@index([curveType, commodity, freshnessStartDate, freshnessEndDate])
}
```

### CurveInstance Table (KEEP for compatibility)

```prisma
model CurveInstance {
  // ... existing fields ...
  
  // KEEP: Overall instance freshness (calculated/aggregate)
  freshnessStartDate  DateTime  @db.Timestamptz(6)
  freshnessEndDate    DateTime? @db.Timestamptz(6)
}
```

**Note**: Instance-level freshness is kept as the **earliest start** and **latest end** of all its curve data groups.

---

## Freshness Grouping

### Grouping Key

Freshness is tracked per:
```
curveType + commodity
```

**Examples:**
- `"Revenue Forecast" + "Total Revenue"` = One freshness period
- `"Revenue Forecast" + "EA Revenue"` = Separate freshness period
- `"Third-party" + "AS Revenue"` = Separate freshness period

### Why Not Per Row?

Too granular - we don't need freshness per individual scenario (P5, P50, P95).
All scenarios for a curve type + commodity share the same freshness.

---

## Use Cases

### Use Case 1: Different Vendor Update Schedules

**Scenario**: You use multiple data sources with different update frequencies

```typescript
// Third-party vendor updates AS curves every week
await updateCurveDataFreshness({
  curveInstanceId: 123,
  curveType: "Third-party",
  commodity: "AS Revenue",
  freshnessStartDate: new Date('2025-10-25'),
  freshnessEndDate: new Date('2025-11-01')  // Expires in 1 week
});

// Internal model updates Total Revenue daily
await updateCurveDataFreshness({
  curveInstanceId: 123,
  curveType: "Revenue Forecast",
  commodity: "Total Revenue",
  freshnessStartDate: new Date('2025-10-25'),
  freshnessEndDate: new Date('2025-10-26')  // Expires next day
});

// Internal P-values update quarterly
await updateCurveDataFreshness({
  curveInstanceId: 123,
  curveType: "P-Values",
  commodity: "Total Revenue",
  freshnessStartDate: new Date('2025-10-01'),
  freshnessEndDate: null  // Current for 3 months
});
```

### Use Case 2: Partial Updates

**Scenario**: You update some commodities but not others

```typescript
// Update only EA Revenue, leave AS and Total unchanged
await setFreshnessForNewCurveData(
  newInstanceId,
  "Revenue Forecast",
  "EA Revenue",
  new Date(),  // Fresh from now
  null         // No end date (current)
);

// AS and Total Revenue keep their existing freshness from older instances
```

### Use Case 3: Staggered Rollouts

**Scenario**: You deploy new forecasts gradually

```
Oct 25: Release Total Revenue (marks fresh)
Oct 27: Release EA Revenue (marks fresh)
Oct 29: Release AS Revenue (marks fresh)

Each commodity has different freshnessStartDate reflecting its actual release date!
```

---

## API Patterns

### Setting Freshness on Upload

```typescript
import { setFreshnessForNewCurveData } from '@/lib/curveDataFreshness';

// After uploading new curve data
await setFreshnessForNewCurveData(
  instanceId,
  "Revenue Forecast",
  "Total Revenue",
  new Date(),  // Becomes fresh now
  null         // No expiry (until superseded)
);
```

### Superseding Old Data

```typescript
import { supersedeCurveData } from '@/lib/curveDataFreshness';

// When new data arrives, mark old data as no longer fresh
await supersedeCurveData(
  oldInstanceId,
  "Revenue Forecast",
  "Total Revenue",
  new Date()  // No longer fresh as of now
);
```

### Querying Fresh Data

```typescript
import { getFreshCurveDataGroups } from '@/lib/curveDataFreshness';

// Get all currently fresh curve data groups for a definition
const freshGroups = await getFreshCurveDataGroups(definitionId);

// Result:
// [
//   {
//     curveType: "Revenue Forecast",
//     commodity: "Total Revenue",
//     scenarios: ["P5", "P50", "P95"],
//     isCurrent: true,
//     freshnessStartDate: "2025-10-25",
//     freshnessEndDate: null
//   },
//   {
//     curveType: "Third-party",
//     commodity: "AS Revenue",
//     isCurrent: false,  // Already superseded
//     freshnessStartDate: "2025-10-20",
//     freshnessEndDate: "2025-10-27"
//   }
// ]
```

---

## Migration Strategy

### Step 1: Run Migration

```sql
-- Add columns
ALTER TABLE "Forecasts"."CurveData"
ADD COLUMN "freshnessStartDate" TIMESTAMPTZ,
ADD COLUMN "freshnessEndDate" TIMESTAMPTZ;

-- Copy instance-level freshness to all curve data rows
UPDATE "Forecasts"."CurveData" cd
SET 
  "freshnessStartDate" = ci."freshnessStartDate",
  "freshnessEndDate" = ci."freshnessEndDate"
FROM "Forecasts"."CurveInstance" ci
WHERE cd."curveInstanceId" = ci.id
  AND cd."freshnessStartDate" IS NULL;
```

### Step 2: Update Application Code

All queries now check `CurveData.freshnessStartDate/freshnessEndDate` instead of instance-level dates.

### Step 3: Keep Instance Dates (Optional)

You can keep instance-level freshness as **calculated values** representing the aggregate:

```typescript
// Calculate instance freshness from curve data
const instanceFreshness = {
  freshnessStartDate: MIN(curveData.freshnessStartDate),  // Earliest
  freshnessEndDate: MAX(curveData.freshnessEndDate)       // Latest
};
```

---

## UI Impact

### Before (Instance-level)

```
CAISO SP15 4h
  Oct 25 Revenue Monthly (Current - Fresh until ???)
    - Contains: Total, EA, AS, P-values
    - All share same freshness
```

### After (CurveData-level)

```
CAISO SP15 4h - Oct 25 Revenue Monthly
  ├─ [✓] Total Revenue (Current - Fresh until Nov 25)
  ├─ [✓] EA Revenue (Current - Fresh until Nov 25)  
  ├─ [✓] AS Revenue (Archived - Superseded Nov 1)    ← Different!
  └─ [ ] P-values (Current - Fresh until Jan 25)     ← Different!
```

**Now it's clear** which parts are still fresh vs superseded!

---

## Best Practices

### 1. Set Freshness on Upload

Always set freshness when uploading new curve data:

```typescript
// Bad
await prisma.curveData.createMany({ data: rows });

// Good
await prisma.curveData.createMany({ data: rows });
await setFreshnessForNewCurveData(
  instanceId,
  curveType,
  commodity,
  new Date()
);
```

### 2. Supersede Before Uploading

Before uploading new data, supersede the old:

```typescript
// Step 1: Mark old as no longer fresh
await supersedeCurveData(
  oldInstanceId,
  "Revenue Forecast",
  "Total Revenue"
);

// Step 2: Upload and mark new as fresh
await uploadNewCurveData(...);
await setFreshnessForNewCurveData(...);
```

### 3. Query by Freshness

Always filter by current freshness in queries:

```typescript
const freshData = await prisma.curveData.findMany({
  where: {
    curveType: "Revenue Forecast",
    commodity: "Total Revenue",
    OR: [
      { freshnessEndDate: null },
      { freshnessEndDate: { gt: new Date() } }
    ]
  }
});
```

### 4. Handle NULL Dates

- `freshnessStartDate = NULL`: Freshness not yet set (legacy data)
- `freshnessEndDate = NULL`: Currently fresh (not superseded)
- `freshnessEndDate > NOW()`: Future expiry (scheduled supersession)

---

## Benefits

✅ **Flexibility**: Different curve types update at different frequencies  
✅ **Accuracy**: Reflects real-world data update patterns  
✅ **Transparency**: Users see exactly what's current vs stale  
✅ **Granularity**: Track freshness per commodity, not entire instance  
✅ **Partial Updates**: Update one commodity without touching others  
✅ **Vendor Independence**: Third-party and internal data on different schedules  

---

## Example Scenarios

### Scenario A: Weekly Third-Party, Monthly Internal

```
Instance: "Oct 25 Revenue Pack"

Third-party AS (updates weekly):
  - Fresh: Oct 25 → Nov 1
  - Fresh: Nov 1 → Nov 8
  - Fresh: Nov 8 → Nov 15

Internal Total Revenue (updates monthly):
  - Fresh: Oct 25 → Nov 25 (ongoing)

User sees:
  [✓] Internal Total Revenue (Current)
  [ ] Third-party AS (Archived - superseded Nov 15)
```

### Scenario B: Staggered GridStor Releases

```
Oct 20: Release P-values → Fresh from Oct 20
Oct 25: Release Total Revenue → Fresh from Oct 25
Oct 27: Release EA Revenue → Fresh from Oct 27
Nov 1: Release AS Revenue → Fresh from Nov 1

All stay fresh until individually superseded.
```

---

## Migration Script

File: `migrations/APPLY_THIS_add_freshness_to_curve_data.sql`

Run with:
```bash
psql $DATABASE_URL -f migrations/APPLY_THIS_add_freshness_to_curve_data.sql
```

Or use Prisma:
```bash
npx prisma db push
```

---

## Testing

After migration, verify:

```sql
-- Check that freshness was migrated
SELECT 
  curveType,
  commodity,
  COUNT(*) as rows,
  COUNT(freshnessStartDate) as with_start,
  COUNT(freshnessEndDate) as with_end,
  COUNT(*) FILTER (WHERE freshnessEndDate IS NULL) as currently_fresh
FROM "Forecasts"."CurveData"
GROUP BY curveType, commodity
ORDER BY curveType, commodity;
```

Expected: All rows should have `freshnessStartDate`, some have `freshnessEndDate`.

---

## Next Steps

1. ✅ Run migration: `APPLY_THIS_add_freshness_to_curve_data.sql`
2. ✅ Regenerate Prisma client: `npx prisma generate`
3. ✅ Update curve upload logic to set freshness per curve type
4. ✅ Update browser API to show freshness per curve data group
5. ✅ Update UI to display freshness status clearly

---

*Architecture v2.0 - Curve Data Level Freshness*  
*October 31, 2025*

