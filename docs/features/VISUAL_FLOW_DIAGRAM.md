# Upload Page - Visual Flow Diagram 📊

## 🎨 Complete Page Layout

```
╔════════════════════════════════════════════════════════════════════════╗
║                    Curve Management & Upload                           ║
║              Select a definition and instance, upload data             ║
╠════════════════════════════════════════════════════════════════════════╣
║  🔍 GLOBAL FILTERS                                                     ║
║  ┌──────────┬──────────┬──────────┬──────────┬──────────┐            ║
║  │ Market ▼ │ Location │ Product  │ Type ▼   │ Gran. ▼  │            ║
║  │ ERCOT    │ Houston  │ Revenue  │ REVENUE  │ MONTHLY  │            ║
║  └──────────┴──────────┴──────────┴──────────┴──────────┘            ║
║  [Clear All Filters]                    [5 filters active]            ║
╠════════════════════════════════════════════════════════════════════════╣
║  📋 DETAIL PANEL - Shows ALL fields when you click                    ║
║  ┌──────────────────────────────────────────────────────────┐  [X]   ║
║  │ ⚡ Instance Details                          [Instance]   │        ║
║  ├──────────────────────────────────────────────────────────┤        ║
║  │ Definition: ERCOT_Houston_Revenue_4H (ERCOT•Houston•MON) │        ║
║  ├──────────────────────────────────────────────────────────┤        ║
║  │ Instance ID: 23          Version: v2025-Q1               │        ║
║  │ Status: [ACTIVE]         Model: Aurora                   │        ║
║  │ Delivery Start: 2025-01-01  Delivery End: 2025-03-31    │        ║
║  │ Created By: Jane Smith   Created: 10/5/2025 2:30 PM     │        ║
║  │ Notes: Q1 forecast with new gas price assumptions        │        ║
║  └──────────────────────────────────────────────────────────┘        ║
╠═══════════════════╦═══════════════════╦═══════════════════════════════╣
║  📊 DEFINITIONS   ║  📈 INSTANCES     ║  💾 DATA                      ║
╠═══════════════════╬═══════════════════╬═══════════════════════════════╣
║ [Search defs...]  ║ [Search insts...] ║ Selected Instance Info:       ║
║ [Sort: Recent ▼]  ║ [Sort: Recent ▼]  ║ ERCOT_Houston_Revenue_4H      ║
║ ┌───────────────┐ ║ ┌───────────────┐ ║ v2025-Q1                      ║
║ │ ERCOT Houston │ ║ │ v2025-Q1   ●  │ ║ Period: 1/1/25 - 3/31/25      ║
║ │ Revenue 4H    │ ║ │ ACTIVE        │ ║ ─────────────────────────────║
║ │ MONTHLY       │ ║ │ 10/5/2025     │ ║ Existing Data:                ║
║ └───────────────┘ ║ └───────────────┘ ║ • 90 data points              ║
║ ┌───────────────┐ ║ ┌───────────────┐ ║ • 2025-01-01 to 2025-03-31    ║
║ │ ERCOT Houston │ ║ │ v2024-Q4      │ ║ • All P-values present        ║
║ │ AS 2H         │ ║ │ ARCHIVED      │ ║                               ║
║ │ HOURLY        │ ║ │ 9/15/2024     │ ║ Upload new data to replace    ║
║ └───────────────┘ ║ └───────────────┘ ║ existing, or download a       ║
║       ...         ║       ...         ║ template to get started.      ║
║                   ║                   ║                               ║
║ ┌───────────────┐ ║                   ║ ┌───────────────────────────┐║
║ │ + Add New     │ ║ ┌───────────────┐ ║ │ 📥 Download Template      │║
║ │  Definition   │ ║ │ + Add New     │ ║ └───────────────────────────┘║
║ └───────────────┘ ║ │  Instance     │ ║ ┌───────────────────────────┐║
║                   ║ └───────────────┘ ║ │ 📤 Upload New Data        │║
║                   ║                   ║ └───────────────────────────┘║
╚═══════════════════╩═══════════════════╩═══════════════════════════════╝
```

---

## 🔄 Interactive Flow

### Flow 1: Global Filter → Select → View Details → Upload

```
┌─────────────┐
│ START       │
└──────┬──────┘
       │
       ↓
┌─────────────────────────┐
│ 1. Apply Global Filters │ ← Market: ERCOT
│                         │ ← Location: Houston  
│                         │ ← Product: Revenue
└──────┬──────────────────┘
       │
       ↓ (Filters all sections automatically)
┌─────────────────────────┐
│ Column 1: Definitions   │ ← Now shows only 3 items
│ (Filtered to ERCOT      │   (was 50+ before)
│  Houston Revenue)       │
└──────┬──────────────────┘
       │
       ↓ Click definition
┌─────────────────────────┐
│ 📋 DETAIL PANEL         │ ← Shows ALL definition fields
│ ✓ Verify Market: ERCOT  │   • ID: 45
│ ✓ Verify Location: Hous │   • Curve Name: ...
│ ✓ Verify Granularity    │   • Battery: 4H
│   MONTHLY ✓             │   • Created: ...
└──────┬──────────────────┘   • Units: $/MWh
       │                       • All 12 fields visible!
       ↓
┌─────────────────────────┐
│ Column 2: Instances     │ ← Loads instances for selected def
│ (Auto-filtered)         │
└──────┬──────────────────┘
       │
       ↓ Click instance
┌─────────────────────────┐
│ 📋 DETAIL PANEL         │ ← Shows definition + instance
│ Definition: ERCOT_Hou...│   
│ ────────────────────────│
│ ✓ Instance: v2025-Q1    │   • All instance fields
│ ✓ Period: 1/1 - 12/31   │   • Delivery dates
│ ✓ Status: ACTIVE        │   • Creator info
│ ✓ Model: Aurora         │   • Notes
└──────┬──────────────────┘   • 9+ fields visible!
       │
       ↓
┌─────────────────────────┐
│ Column 3: Data          │ ← Shows existing data
│ • 360 points existing   │
│ • 2025-01 to 2025-12    │
└──────┬──────────────────┘
       │
       ↓ Download Template
┌─────────────────────────┐
│ Template Generator      │ ← Dates pre-filled from instance
│ Start: 2025-01-01       │   • Select P-values
│ End: 2025-12-31         │   • Generates MONTHLY timestamps
│ P-values: P25,P50,P75   │   • Based on granularity
└──────┬──────────────────┘
       │
       ↓ Fill values in Excel
┌─────────────────────────┐
│ Upload Data             │ ← Select filled CSV
│ • Preview 360 rows      │   • Validate format
│ • Confirm upload        │   • Upload to instance
└──────┬──────────────────┘
       │
       ↓
┌─────────────────────────┐
│ ✅ SUCCESS!             │ ← Toast notification
│ 360 points uploaded     │   Data replaces existing
│ Status: ACTIVE          │   Ready for viewing
└─────────────────────────┘
```

---

## 🎯 Filter Cascade Example

### Scenario: Find CAISO NP15 Monthly Revenue Curves

```
INITIAL STATE (No Filters)
═══════════════════════════════════════
Definitions: 127 total
Instances: 0 (none selected)
Data: 0 (none selected)


STEP 1: Filter by Market
═══════════════════════════════════════
Global Filter: Market = CAISO
         ↓
Definitions: 127 → 82 (filtered)
Instances: 0 (none selected)
Data: 0 (none selected)


STEP 2: Filter by Location  
═══════════════════════════════════════
Global Filter: Market = CAISO
               Location = NP15
         ↓
Definitions: 82 → 23 (filtered)
Instances: 0 (none selected)
Data: 0 (none selected)


STEP 3: Filter by Granularity
═══════════════════════════════════════
Global Filter: Market = CAISO
               Location = NP15
               Granularity = MONTHLY
         ↓
Definitions: 23 → 8 (filtered)
Instances: 0 (none selected)
Data: 0 (none selected)


STEP 4: Select Definition
═══════════════════════════════════════
Selected: NP15_Revenue_4H_Monthly
         ↓
Definitions: 8 items (1 selected - blue highlight)
Instances: 5 instances load automatically
Data: 0 (waiting for instance selection)
Detail Panel: Shows all 12 definition fields ✅


STEP 5: Select Instance
═══════════════════════════════════════
Selected: v2025-Q1
         ↓
Definitions: 8 items (1 selected)
Instances: 5 items (1 selected - green highlight)
Data: Existing data preview shows 360 points ✅
Detail Panel: Shows definition + instance fields ✅
```

**Result: 127 definitions → 8 filtered → 1 selected → Ready to upload!** 🎯

---

## 💡 Advanced Filtering Patterns

### Pattern 1: Market Deep Dive
```
Filter: Market = ERCOT
Result: See ALL ERCOT curves across locations
Use: Market-wide analysis or batch uploads
```

### Pattern 2: Location Focus
```
Filter: Location = Houston
Result: All Houston curves across markets/types
Use: Site-specific management
```

### Pattern 3: Product Category
```
Filter: Product = Revenue
Result: All revenue curves regardless of location
Use: Product comparison or updates
```

### Pattern 4: Multi-Filter Precision
```
Filter: Market = CAISO
        Location = NP15
        Curve Type = REVENUE
        Granularity = MONTHLY
Result: Exact match for specific use case
Use: Targeted uploads or audits
```

### Pattern 5: Progressive Filtering
```
Step 1: Filter Market = CAISO (127 → 82)
Step 2: See what's available
Step 3: Filter Location = NP15 (82 → 23)
Step 4: Browse 23 items
Step 5: Filter Type = REVENUE (23 → 8)
Step 6: Perfect! Found exactly what I need
```

---

## 🎨 UI State Diagram

```
                         ┌─────────────┐
                         │  PAGE LOAD  │
                         └──────┬──────┘
                                │
                ┌───────────────┴───────────────┐
                │ Load all definitions via API  │
                │ Show in Column 1               │
                │ Columns 2 & 3 disabled         │
                └───────────────┬───────────────┘
                                │
                    ┌───────────┴───────────┐
                    │ User applies filters  │
                    │ (optional)            │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴────────────────┐
                    │ User clicks definition     │
                    └───────────┬────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ↓                       ↓                       ↓
┌─────────────┐      ┌──────────────────┐    ┌─────────────────┐
│ Detail Panel│      │ Column 2: Load   │    │ Column 2: Enable│
│ Shows ALL   │      │ instances for    │    │ search/sort/add │
│ def fields  │      │ this definition  │    │ buttons         │
└─────────────┘      └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │ User clicks instance  │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ↓                       ↓                       ↓
┌─────────────┐      ┌──────────────────┐    ┌─────────────────┐
│ Detail Panel│      │ Column 3: Load   │    │ Column 3: Enable│
│ Shows def + │      │ existing data    │    │ template/upload │
│ inst fields │      │ for instance     │    │ buttons         │
└─────────────┘      └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │ User downloads template│
                    │ OR uploads CSV         │
                    └───────────┬────────────┘
                                │
                         ┌──────┴──────┐
                         │ UPLOAD DATA │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │ Success! Data stored  │
                    │ Toast notification    │
                    │ Data preview updates  │
                    └───────────────────────┘
```

---

## 🎭 State Transitions

### Column States

#### Column 1: Definitions (Always Active)
```
State 1: INITIAL
├─ Loaded: ✅ All definitions from API
├─ Filtered: By global filters
├─ Search: Active
├─ Sort: Active
└─ Add Button: Active

State 2: ITEM SELECTED
├─ Highlight: Blue background on selected card
├─ Detail Panel: Shows definition fields
├─ Column 2: Activates and loads instances
└─ Column 3: Remains disabled (needs instance)
```

#### Column 2: Instances (Active after Column 1 selection)
```
State 1: DISABLED
├─ Message: "Select a definition first"
├─ Search: Disabled
├─ Sort: Disabled
└─ Add Button: Disabled

State 2: ACTIVE (Definition Selected)
├─ Loaded: ✅ Instances for selected definition
├─ Filtered: By global filters (inherited)
├─ Search: Active
├─ Sort: Active
└─ Add Button: Active

State 3: ITEM SELECTED
├─ Highlight: Green background on selected card
├─ Detail Panel: Shows definition + instance fields
├─ Column 3: Activates and loads data
└─ Upload buttons: Enabled
```

#### Column 3: Data (Active after Column 2 selection)
```
State 1: DISABLED
├─ Message: "Select an instance first"
├─ Template Button: Disabled
└─ Upload Button: Disabled

State 2: ACTIVE (Instance Selected)
├─ Info: Shows selected definition + instance
├─ Existing Data: Loads if available
├─ Template Button: Active
├─ Upload Button: Active
└─ Preview: Shows on CSV selection

State 3: DATA UPLOADED
├─ Preview: Updates with new data counts
├─ Toast: Success notification
└─ Ready: For next upload
```

---

## 🎯 Click Flow Examples

### Example A: Simple Upload (3 Clicks)
```
Click 1: Definition "CAISO_NP15_Revenue"
    ↓ Detail panel shows all definition fields
    ↓ Column 2 loads instances

Click 2: Instance "v2025-Q1"
    ↓ Detail panel shows instance + definition
    ↓ Column 3 shows existing data

Click 3: "Upload New Data"
    ↓ Select CSV file
    ↓ Preview → Confirm → Upload
    ↓ Done! ✅
```

### Example B: With Filtering (5 Clicks)
```
Click 1: Global Filter Market = "ERCOT"
    ↓ Column 1 filters to ERCOT only

Click 2: Global Filter Location = "Houston"
    ↓ Column 1 filters to ERCOT + Houston

Click 3: Definition "ERCOT_Houston_Revenue_4H"
    ↓ Detail panel shows fields
    ↓ Column 2 loads instances

Click 4: Instance "v2025-Q1"
    ↓ Detail panel shows full details
    ↓ Column 3 ready

Click 5: "Download Template"
    ↓ Dates pre-filled → Generate
    ↓ Fill in Excel → Upload
    ↓ Done! ✅
```

### Example C: Create New Everything (6 Clicks)
```
Click 1: Global Filter Market = "NYISO"
    ↓ Verify no existing NYISO curves

Click 2: "+ Add New Definition"
    ↓ Modal opens
    ↓ Fill fields → Save
    ↓ New definition created and auto-selected

Click 3: Detail panel shows new definition
    ↓ Verify all fields correct

Click 4: "+ Add New Instance"
    ↓ Modal opens
    ↓ Fill fields → Save
    ↓ New instance created and auto-selected

Click 5: Detail panel shows full details
    ↓ Verify delivery period

Click 6: "Download Template"
    ↓ Generate → Fill → Upload
    ↓ Done! New curve complete ✅
```

---

## 📊 Data Flow

### API Calls Sequence

```
PAGE LOAD
    ↓
GET /api/curves/definitions
    ↓
Store: allDefs = [127 definitions]
Render: Column 1 list
    ↓
USER: Apply filter Market=ERCOT
    ↓
Client-side filter: allDefs.filter(...)
Render: Column 1 list (82 items)
    ↓
USER: Click definition ID=45
    ↓
GET /api/curves/instances?definitionId=45
    ↓
Store: allInsts = [5 instances]
Render: Column 2 list
Display: Detail panel with definition fields
    ↓
USER: Click instance ID=23
    ↓
GET /api/curves/23/data
    ↓
Display: Detail panel with instance + definition fields
Display: Column 3 existing data preview (360 points)
Enable: Template and Upload buttons
    ↓
USER: Click "Upload New Data"
    ↓
Modal: File picker opens
    ↓
USER: Select CSV file
    ↓
Client: Parse CSV, validate, show preview
    ↓
USER: Confirm upload
    ↓
POST /api/curve-upload/upload-data
Body: { curveInstanceId: 23, priceData: [...] }
    ↓
Server: Validate, delete old data, insert new
    ↓
Response: { success: true, recordsCreated: 360 }
    ↓
Display: Toast notification "Successfully uploaded"
Refresh: Column 3 data preview
    ↓
COMPLETE ✅
```

---

## 🎉 Summary

### What Makes This Design Better

**Visual Clarity:**
- ✅ See all three sections at once
- ✅ Color-coded for easy navigation
- ✅ Clear progression: Def → Inst → Data

**Information Transparency:**
- ✅ Detail panel shows ALL fields
- ✅ No hidden information
- ✅ Verify before you upload

**Efficient Filtering:**
- ✅ Global filters apply everywhere
- ✅ Column searches refine further
- ✅ Find what you need fast

**Professional Polish:**
- ✅ Smooth transitions
- ✅ Consistent design patterns
- ✅ Intuitive interactions
- ✅ Enterprise-grade UX

**Your upload page is now production-ready!** 🚀

