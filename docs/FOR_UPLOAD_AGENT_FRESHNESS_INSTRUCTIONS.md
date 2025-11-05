# Instructions for Curve Upload Agent - Freshness Tracking

## 🎯 Critical Context

**Freshness is now tracked at the CurveData level, NOT the CurveInstance level.**

This means each curve type + commodity combination can have its own freshness period within the same instance.

---

## 📊 Database Schema

### CurveData Table (Where Freshness Lives)

```typescript
model CurveData {
  id                 Int       @id @default(autoincrement())
  curveInstanceId    Int
  timestamp          DateTime
  value              Float
  curveType          String    // e.g., "Revenue Forecast", "Third-party", "P-Values"
  commodity          String    // e.g., "Total Revenue", "EA Revenue", "AS Revenue"
  scenario           String    // e.g., "P5", "P50", "P95", "BASE"
  units              String?
  
  // FRESHNESS FIELDS (NEW) - Set these when uploading!
  freshnessStartDate DateTime? // When this curve type + commodity became fresh
  freshnessEndDate   DateTime? // When superseded (NULL = currently fresh)
  
  createdAt          DateTime
  updatedAt          DateTime
}
```

### CurveInstance Table (Keep dates for compatibility)

```typescript
model CurveInstance {
  id                  Int
  curveDefinitionId   Int
  instanceVersion     String
  
  // Keep these as AGGREGATE/OVERALL dates
  freshnessStartDate  DateTime   // Earliest of all curve data groups
  freshnessEndDate    DateTime?  // Latest of all curve data groups
  
  // ... other fields
  curveData           CurveData[]
}
```

---

## 🚀 When Uploading New Curve Data

### Step 1: Create or Update CurveInstance

```typescript
const instance = await prisma.curveInstance.create({
  data: {
    curveDefinitionId: definitionId,
    instanceVersion: "Nov 2025 Revenue Monthly",
    // Set instance freshness as the OVERALL period
    freshnessStartDate: new Date(),  // When this run was made
    freshnessEndDate: null,           // Will be calculated from curve data
    // ... other fields
  }
});
```

### Step 2: Upload CurveData with Freshness

**IMPORTANT**: Set `freshnessStartDate` and `freshnessEndDate` for EACH curve data row!

```typescript
await prisma.curveData.createMany({
  data: rows.map(row => ({
    curveInstanceId: instance.id,
    timestamp: row.timestamp,
    value: row.value,
    curveType: row.curveType,      // e.g., "Revenue Forecast"
    commodity: row.commodity,       // e.g., "Total Revenue"
    scenario: row.scenario,
    units: row.units,
    
    // SET FRESHNESS HERE!
    freshnessStartDate: new Date(), // This curve type+commodity is fresh from now
    freshnessEndDate: null,         // No end date = currently fresh
  }))
});
```

### Step 3: Supersede Old Data (Important!)

Before setting new data as fresh, mark the old data as superseded:

```typescript
// Find and supersede old curve data of the same type/commodity
await prisma.curveData.updateMany({
  where: {
    curveInstance: {
      curveDefinitionId: definitionId
    },
    curveType: "Revenue Forecast",
    commodity: "Total Revenue",
    freshnessEndDate: null  // Currently fresh (need to supersede)
  },
  data: {
    freshnessEndDate: new Date()  // No longer fresh as of now
  }
});
```

---

## 📝 Complete Upload Example

```typescript
import { prisma } from '@/lib/prisma';
import { setFreshnessForNewCurveData, supersedeCurveData } from '@/lib/curveDataFreshness';

async function uploadCurveWithFreshness(
  definitionId: number,
  instanceVersion: string,
  curveDataRows: any[]
) {
  // Step 1: Create instance
  const instance = await prisma.curveInstance.create({
    data: {
      curveDefinitionId: definitionId,
      instanceVersion: instanceVersion,
      freshnessStartDate: new Date(),
      freshnessEndDate: null,
      status: 'ACTIVE',
      createdBy: 'GridStor Internal',
      // ... other required fields
    }
  });

  // Step 2: Get unique curve type + commodity combinations
  const uniqueCombinations = new Set(
    curveDataRows.map(row => `${row.curveType}::${row.commodity}`)
  );

  // Step 3: For each combination, supersede old data
  for (const combo of uniqueCombinations) {
    const [curveType, commodity] = combo.split('::');
    
    await supersedeCurveData(
      0, // Will update across all instances for this definition
      curveType,
      commodity,
      new Date()
    );
    
    // Better approach: Use direct Prisma query
    await prisma.curveData.updateMany({
      where: {
        curveInstance: {
          curveDefinitionId: definitionId
        },
        curveType: curveType,
        commodity: commodity,
        freshnessEndDate: null
      },
      data: {
        freshnessEndDate: new Date()
      }
    });
  }

  // Step 4: Insert new curve data with freshness
  await prisma.curveData.createMany({
    data: curveDataRows.map(row => ({
      curveInstanceId: instance.id,
      timestamp: row.timestamp,
      value: row.value,
      curveType: row.curveType,
      commodity: row.commodity,
      scenario: row.scenario,
      units: row.units,
      
      // SET FRESHNESS!
      freshnessStartDate: new Date(),
      freshnessEndDate: null,  // Currently fresh
      
      metadata: row.metadata,
      flags: row.flags || []
    }))
  });

  console.log(`✅ Uploaded ${curveDataRows.length} rows with freshness tracking`);
  console.log(`✅ ${uniqueCombinations.size} curve type+commodity combinations marked as fresh`);
  
  return instance;
}
```

---

## 🔧 Utility Functions Available

Import these from `src/lib/curveDataFreshness.ts`:

### 1. Set Freshness for New Data

```typescript
import { setFreshnessForNewCurveData } from '@/lib/curveDataFreshness';

await setFreshnessForNewCurveData(
  instanceId,
  "Revenue Forecast",
  "Total Revenue",
  new Date(),  // Fresh from now
  null         // No expiry
);
```

### 2. Supersede Old Data

```typescript
import { supersedeCurveData } from '@/lib/curveDataFreshness';

await supersedeCurveData(
  oldInstanceId,
  "Revenue Forecast",
  "Total Revenue",
  new Date()  // No longer fresh as of now
);
```

### 3. Update Freshness

```typescript
import { updateCurveDataFreshness } from '@/lib/curveDataFreshness';

await updateCurveDataFreshness({
  curveInstanceId: 123,
  curveType: "Revenue Forecast",
  commodity: "EA Revenue",
  freshnessStartDate: new Date('2025-10-25'),
  freshnessEndDate: new Date('2025-11-25')  // Or null for ongoing
});
```

---

## ⚠️ Important Rules

### Rule 1: Always Set Freshness on Upload
```typescript
// ❌ BAD - No freshness set
await prisma.curveData.create({
  data: { /* ... */ }
});

// ✅ GOOD - Freshness explicitly set
await prisma.curveData.create({
  data: { 
    /* ... */,
    freshnessStartDate: new Date(),
    freshnessEndDate: null
  }
});
```

### Rule 2: Supersede Before Uploading Same Type+Commodity
```typescript
// ❌ BAD - Multiple "fresh" versions of same curve
uploadData("Total Revenue");  // Old one still marked fresh!
uploadData("Total Revenue");  // Now two are fresh - confusing!

// ✅ GOOD - Supersede old first
await supersedeCurveData(oldId, "Revenue Forecast", "Total Revenue");
uploadData("Total Revenue");  // Only this one is fresh
```

### Rule 3: Group by curveType + commodity

Freshness applies to the **combination**, not individual rows:

```typescript
// All P5, P50, P95 for "Total Revenue" share same freshness
curveType: "Revenue Forecast"
commodity: "Total Revenue"
scenarios: ["P5", "P50", "P95"]  ← All share same freshness dates

// EA Revenue has different freshness
curveType: "Revenue Forecast"
commodity: "EA Revenue"
scenarios: ["P5", "P50", "P95"]  ← Different freshness dates
```

### Rule 4: NULL means "Currently Fresh"

```typescript
freshnessEndDate: null        // ✅ This curve is currently fresh
freshnessEndDate: new Date()  // ✅ Just superseded (archived now)
freshnessEndDate: undefined   // ❌ Don't use undefined, use null
```

---

## 📋 Pre-Upload Checklist

Before uploading curve data, ensure:

- [ ] CurveInstance created with `freshnessStartDate` and `freshnessEndDate`
- [ ] For each curveType + commodity combination:
  - [ ] Old data superseded (freshnessEndDate set)
  - [ ] New data has freshnessStartDate = upload date
  - [ ] New data has freshnessEndDate = null (or future date)
- [ ] All CurveData rows have freshness fields populated
- [ ] Verified no duplicate "fresh" data for same type+commodity

---

## 🧪 Testing Your Upload

After upload, verify freshness is correct:

```sql
-- Check what's currently fresh for a definition
SELECT 
  cd.curveType,
  cd.commodity,
  COUNT(*) as data_points,
  MIN(cd.freshnessStartDate) as fresh_from,
  MAX(cd.freshnessEndDate) as fresh_until,
  COUNT(*) FILTER (WHERE cd.freshnessEndDate IS NULL OR cd.freshnessEndDate > NOW()) as currently_fresh_rows
FROM "Forecasts"."CurveData" cd
JOIN "Forecasts"."CurveInstance" ci ON cd.curveInstanceId = ci.id
WHERE ci.curveDefinitionId = YOUR_DEFINITION_ID
GROUP BY cd.curveType, cd.commodity
ORDER BY cd.curveType, cd.commodity;
```

**Expected Result**: Each curveType+commodity should have only ONE "currently fresh" group.

---

## 💡 Common Patterns

### Pattern 1: Standard Monthly Update

```typescript
// Upload all revenue types (Total, EA, AS) at once
// All share same freshness period (monthly)

const curveTypes = ["Total Revenue", "EA Revenue", "AS Revenue"];

for (const commodity of curveTypes) {
  // Supersede old
  await supersedeCurveData(oldInstanceId, "Revenue Forecast", commodity);
  
  // Upload new with freshness
  await prisma.curveData.createMany({
    data: getDataForCommodity(commodity).map(row => ({
      ...row,
      freshnessStartDate: new Date(),
      freshnessEndDate: null
    }))
  });
}
```

### Pattern 2: Staggered Updates (Different Cadences)

```typescript
// Total Revenue - daily update
await prisma.curveData.createMany({
  data: totalRevenueRows.map(row => ({
    ...row,
    curveType: "Revenue Forecast",
    commodity: "Total Revenue",
    freshnessStartDate: new Date(),
    freshnessEndDate: addDays(new Date(), 1)  // Fresh for 1 day
  }))
});

// AS Revenue - weekly update
await prisma.curveData.createMany({
  data: asRevenueRows.map(row => ({
    ...row,
    curveType: "Third-party",
    commodity: "AS Revenue",
    freshnessStartDate: new Date(),
    freshnessEndDate: addDays(new Date(), 7)  // Fresh for 1 week
  }))
});

// P-values - quarterly update
await prisma.curveData.createMany({
  data: pValueRows.map(row => ({
    ...row,
    curveType: "P-Values",
    commodity: "Total Revenue",
    freshnessStartDate: new Date(),
    freshnessEndDate: addMonths(new Date(), 3)  // Fresh for 3 months
  }))
});
```

### Pattern 3: Partial Update (Only One Commodity)

```typescript
// Only updating EA Revenue, leaving Total and AS unchanged

// Supersede old EA only
await prisma.curveData.updateMany({
  where: {
    curveInstance: { curveDefinitionId: defId },
    curveType: "Revenue Forecast",
    commodity: "EA Revenue",  // Only EA
    freshnessEndDate: null
  },
  data: {
    freshnessEndDate: new Date()
  }
});

// Upload new EA
await prisma.curveData.createMany({
  data: eaRows.map(row => ({
    ...row,
    commodity: "EA Revenue",
    freshnessStartDate: new Date(),
    freshnessEndDate: null
  }))
});

// Total Revenue and AS Revenue keep their existing freshness!
```

---

## 🔑 Key Takeaways

1. **Set `freshnessStartDate` and `freshnessEndDate` on EVERY CurveData row you create**
2. **Supersede old data** of the same `curveType + commodity` before uploading new
3. **NULL `freshnessEndDate`** means "currently fresh"
4. **Different curve types** can have different freshness periods in the same instance
5. **Instance-level freshness** is kept for backward compatibility but is not the source of truth

---

## 📞 Quick Reference

```typescript
// When uploading new curve data:

// 1. Supersede old
await prisma.curveData.updateMany({
  where: {
    curveInstance: { curveDefinitionId: defId },
    curveType: "YOUR_CURVE_TYPE",
    commodity: "YOUR_COMMODITY",
    freshnessEndDate: null
  },
  data: { freshnessEndDate: new Date() }
});

// 2. Create new with freshness
await prisma.curveData.createMany({
  data: rows.map(row => ({
    ...row,
    freshnessStartDate: new Date(),
    freshnessEndDate: null  // or specific future date
  }))
});
```

---

## 📚 Related Files

- **Schema**: `prisma/schema.prisma` - CurveData model with freshness fields
- **Utilities**: `src/lib/curveDataFreshness.ts` - Helper functions
- **Migration**: `migrations/APPLY_THIS_add_freshness_to_curve_data.sql` - DB changes
- **Architecture Doc**: `docs/CURVE-FRESHNESS-ARCHITECTURE.md` - Full explanation

---

## ✅ Validation

After your upload, run this to verify:

```sql
-- Should show only ONE fresh group per curveType+commodity
SELECT 
  curveType,
  commodity,
  COUNT(*) FILTER (WHERE freshnessEndDate IS NULL) as fresh_count
FROM "Forecasts"."CurveData"
WHERE curveInstanceId = YOUR_INSTANCE_ID
GROUP BY curveType, commodity
HAVING COUNT(*) FILTER (WHERE freshnessEndDate IS NULL) > 1;

-- Should return ZERO rows (no duplicates)
```

---

**Questions? Check**: `docs/CURVE-FRESHNESS-ARCHITECTURE.md` for full details.

**TL;DR**: Set `freshnessStartDate` and `freshnessEndDate` on every CurveData row you create. Supersede old data before uploading new. NULL = currently fresh.

