# Upload Page - Complete Feature Guide 🎯

## 🎨 New Layout with Global Filters & Detail Panel

```
┌────────────────────────────────────────────────────────────────┐
│                  Curve Management & Upload                      │
├────────────────────────────────────────────────────────────────┤
│  🔍 GLOBAL FILTERS (applies to all sections)                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐     │
│  │ Market ▼ │ Location │ Product  │ Type ▼   │ Gran. ▼  │     │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘     │
│  [Clear All]                          [X filters active]       │
├────────────────────────────────────────────────────────────────┤
│  📋 DETAIL PANEL (shows all fields of selected item)           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Definition Details                            [Badge]  │   │
│  │ • ID: 12                    • Market: CAISO            │   │
│  │ • Curve Name: NP15_Rev_4H   • Location: NP15          │   │
│  │ • Product: Revenue          • Type: REVENUE            │   │
│  │ • Battery: 4H               • Granularity: MONTHLY     │   │
│  │ • Units: $/MWh              • Created: 10/7/2025       │   │
│  └────────────────────────────────────────────────────────┘   │
├──────────────┬─────────────────┬──────────────────────────────┤
│ DEFINITIONS  │   INSTANCES     │         DATA                 │
│ [Search]     │   [Search]      │                              │
│ [Sort ▼]     │   [Sort ▼]      │  Existing Data:              │
│              │                 │  • 120 points                │
│ • Def 1      │   • Inst v1.0   │  • 2025-01 to 2025-12        │
│ • Def 2      │   • Inst v1.1   │                              │
│   ...        │     ...         │  [📥 Download Template]      │
│              │                 │  [📤 Upload New Data]        │
│ [+ Add New]  │   [+ Add New]   │                              │
└──────────────┴─────────────────┴──────────────────────────────┘
```

---

## ✨ Key Features

### 🔍 **Global Filters (Top Section)**

**Purpose:** Filter ALL sections at once by common criteria

**Filters Available:**
- **Market** (dropdown): CAISO, ERCOT, PJM, NYISO, ISO-NE, MISO
- **Location** (text): Type to filter by location
- **Product** (text): Type to filter by product
- **Curve Type** (dropdown): REVENUE, ENERGY, AS, RA
- **Granularity** (dropdown): HOURLY, DAILY, MONTHLY, QUARTERLY, ANNUAL

**How It Works:**
1. Select "ERCOT" in Market filter
2. **→** Column 1 shows only ERCOT definitions
3. **→** Column 2 shows only instances from ERCOT definitions
4. **→** All filtered automatically!

**Benefits:**
- ✅ Quick filtering across all data
- ✅ No need to search in each column separately
- ✅ See active filter count
- ✅ Clear all with one click

---

### 📋 **Detail Panel (Below Global Filters)**

**Purpose:** Show ALL fields of selected definition or instance so you know exactly what you're working with

**Appears When:**
- Click any definition in Column 1 → Shows definition details
- Click any instance in Column 2 → Shows instance + definition details

**Definition Details Shown:**
```
┌─────────────────────────────────────────────────────┐
│ Definition Details                     [Definition] │
├─────────────────────────────────────────────────────┤
│ ID: 12                    Market: CAISO             │
│ Curve Name: NP15_Rev_4H   Location: NP15            │
│ Product: Opt Revenue      Curve Type: REVENUE       │
│ Battery Duration: FOUR_H  Granularity: MONTHLY      │
│ Units: $/MWh              Scenario: P50             │
│ Degradation: NONE         Created: 10/7/2025 3:45PM │
└─────────────────────────────────────────────────────┘
```

**Instance Details Shown:**
```
┌─────────────────────────────────────────────────────┐
│ Instance Details                       [Instance]   │
├─────────────────────────────────────────────────────┤
│ Definition: NP15_Rev_4H (CAISO • NP15 • MONTHLY)    │
├─────────────────────────────────────────────────────┤
│ Instance ID: 5            Version: v2025-Q1         │
│ Status: ACTIVE            Model Type: Aurora        │
│ Delivery Start: 2025-01-01  Delivery End: 2025-12-31│
│ Created By: John Doe      Created At: 10/5/2025     │
│ Notes: Q1 2025 forecast run with updated params     │
└─────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ See ALL fields at a glance
- ✅ Verify you're uploading to the right curve
- ✅ Check delivery periods before uploading
- ✅ See creation info and notes
- ✅ Color-coded badge (Blue = Definition, Green = Instance)

---

## 🎯 Complete Workflow Example

### Scenario: Upload Q1 2025 Revenue Data for ERCOT Houston

**Step 1: Apply Global Filters**
```
1. Click Market dropdown → Select "ERCOT"
2. Type "Houston" in Location filter
3. Type "Revenue" in Product filter
```

**Result:**
- Definitions list shows only: ERCOT + Houston + Revenue curves
- Filter count shows: "3 filters active"

**Step 2: Select Definition**
```
1. Browse filtered list (only 2-3 items now)
2. Click "ERCOT_Houston_Revenue_4H_Monthly"
```

**Result:**
- Detail panel appears showing ALL definition fields:
  - ID, Curve Name, Market, Location
  - Product, Type, Battery Duration
  - Granularity, Units, Scenario, etc.
- Column 2 loads instances for this definition
- You can verify: "Yes, this is the right definition!"

**Step 3: Select Instance**
```
1. Browse instances (pre-filtered to this definition)
2. Search "Q1" if you have many instances
3. Click "v2025-Q1" instance
```

**Result:**
- Detail panel updates showing ALL instance fields:
  - Instance ID, Version, Status
  - Delivery Start/End dates
  - Model Type, Created By, Notes
  - Plus definition info at top
- Column 3 shows existing data preview
- You can verify: "Yes, this is the right period and version!"

**Step 4: Upload Data**
```
1. See existing data: "120 points from 2025-01 to 2025-12"
2. Click "Download Template" (dates pre-filled)
3. Select P-values: P25, P50, P75
4. Generate template
5. Fill in your values in Excel
6. Click "Upload New Data"
7. Select your CSV
8. Preview shows: "360 rows loaded" (3 pvalues × 120 months)
9. Confirm upload
```

**Result:**
- Upload completes
- Toast: "Successfully uploaded 360 data points"
- Data preview updates
- You uploaded to exactly the right place!

---

## 🎨 Visual Design Details

### Color Coding
- **Blue** = Definitions (cards, badges, borders)
- **Green** = Instances (cards, badges, borders)
- **Purple** = Data/Upload (buttons, headers)
- **Gradient** = Detail panel (blue → green → purple)

### Interactive States

**Cards:**
- Normal: White background, gray border
- Hover: Shadow increases, border lightens
- Selected: Colored background, thick colored border, shadow

**Detail Panel:**
- Border changes color based on content:
  - Blue border when showing definition
  - Green border when showing instance
- Gradient background for visual appeal
- Close button (X) in top right

**Global Filters:**
- Active filter count updates live
- "Clear All Filters" button
- Filters persist until cleared

---

## 💡 Pro Tips

### Filter Strategy
```
1. Start Broad → Narrow Down:
   - Filter by Market first (ERCOT)
   - Then by Location (Houston)
   - Then by Type (Revenue)

2. Result: 50 definitions → 3 definitions
   - Much easier to find what you need!
```

### Verification Workflow
```
1. Apply filters to narrow down
2. Click definition → Read detail panel
3. Verify: Market, Location, Product, Granularity
4. Click instance → Read detail panel
5. Verify: Delivery period, Version, Status, Notes
6. Check existing data count
7. Upload with confidence!
```

### Quick Upload Pattern
```
For recurring uploads:

1. Set global filters once (CAISO, NP15, Revenue)
2. Keep filters active
3. Click familiar definition
4. Click latest instance
5. Upload updated data
6. Done in 30 seconds!
```

---

## 🔍 Detail Panel Use Cases

### Use Case 1: Verify Before Upload
**Problem:** "I don't want to upload to the wrong curve!"

**Solution:**
1. Click definition → Detail panel shows ALL fields
2. Check: Market ✅, Location ✅, Product ✅, Granularity ✅
3. Click instance → Detail panel shows delivery period
4. Check: Start date ✅, End date ✅, Version ✅
5. Upload with confidence!

### Use Case 2: Compare Instances
**Problem:** "Which instance should I use?"

**Solution:**
1. Click Instance A → Read detail panel
   - Version: v1.0, Delivery: Jan-Dec 2025, Model: Aurora
2. Click Instance B → Read detail panel
   - Version: v1.1, Delivery: Jan-Dec 2025, Model: Manual
3. Choose based on notes and model type

### Use Case 3: Audit Trail
**Problem:** "Who created this and when?"

**Solution:**
- Click any item → Detail panel shows:
  - Created By
  - Created At (full timestamp)
  - Notes (if any)
  - All metadata fields

---

## 📊 Field Reference

### Definition Fields (12 fields shown)
| Field | Description | Example |
|-------|-------------|---------|
| ID | Unique identifier | 12 |
| Curve Name | Full curve name | NP15_Revenue_4H_P50_2024 |
| Market | ISO/Market | CAISO |
| Location | Node/Location | NP15 |
| Product | Product type | Optimized Revenue |
| Curve Type | Type enum | REVENUE |
| Battery Duration | Duration | FOUR_H |
| Granularity | Time granularity | MONTHLY |
| Units | Value units | $/MWh |
| Scenario | Scenario/case | P50 |
| Degradation | Degradation type | NONE |
| Created | Timestamp | 10/7/2025 3:45:23 PM |

### Instance Fields (9+ fields shown)
| Field | Description | Example |
|-------|-------------|---------|
| Definition Info | Parent definition | NP15_Rev_4H (CAISO • NP15) |
| Instance ID | Unique identifier | 5 |
| Version | Version string | v2025-Q1 |
| Status | Current status | ACTIVE |
| Model Type | Model used | Aurora |
| Delivery Start | Period start | 2025-01-01 |
| Delivery End | Period end | 2025-12-31 |
| Created By | Creator | Jane Smith |
| Created At | Timestamp | 10/5/2025 2:30:15 PM |
| Notes | Free text | Q1 forecast with updated params |

---

## 🚀 Quick Reference

### Global Filters
- **Purpose:** Filter all sections at once
- **Location:** Top of page, always visible
- **Effect:** Applies to definitions and instances
- **Clear:** One-click "Clear All Filters" button

### Detail Panel
- **Purpose:** Show all fields of selected item
- **Location:** Below global filters, above columns
- **Shows:** All database fields in organized grid
- **Close:** Click X button or select different item

### Column Search/Sort
- **Purpose:** Fine-tune within filtered results
- **Location:** Top of each column
- **Scope:** Only that column
- **Use:** After global filters for precision

### Visual Indicators
- **Blue highlight** = Selected definition
- **Green highlight** = Selected instance  
- **Filter count** = "X filters active"
- **Status badge** = ACTIVE (green) or other (gray)

---

## ✅ Benefits of New Design

### Before (Old Page)
- ❌ Hard to verify what you're uploading to
- ❌ Had to click through modals to see fields
- ❌ Filtering mixed with selection
- ❌ Couldn't see all info at once

### After (New Page)
- ✅ Detail panel shows ALL fields instantly
- ✅ Global filters apply to everything
- ✅ See definition + instance info together
- ✅ Verify before upload with confidence
- ✅ Professional, organized layout

---

## 🎯 Perfect For

### Data Analyst
"I need to verify I'm uploading to the right forecast version."
- ✅ Detail panel shows exact delivery period
- ✅ See instance version and notes
- ✅ Confirm before upload

### System Administrator
"I need to find all ERCOT monthly revenue curves."
- ✅ Global filters: ERCOT + Revenue + Monthly
- ✅ Instantly see filtered list
- ✅ Detail panel confirms all fields

### Power User
"I upload to the same curves weekly."
- ✅ Set filters once (CAISO, NP15)
- ✅ List stays filtered
- ✅ Quick click-click-upload workflow

---

## 🎉 You're All Set!

Visit: `http://localhost:4321/admin/upload`

**New Features:**
- ✅ Global filters at top
- ✅ Detail panel shows ALL fields
- ✅ Click any item to see full details
- ✅ Filter cascades through all sections
- ✅ Professional, clean, organized

**No more guessing what you're uploading to!** Every field is visible. 🚀

