# Autocomplete Field System

## Overview
Implemented an autocomplete system that pre-populates form fields with existing database values while allowing users to add new values. This maintains data consistency and prevents typos.

## Features

### ✅ **Pre-Populated Fields**
The following fields now show existing database values:
- **Market** (CAISO, ERCOT, PJM, MISO, NYISO, SPP)
- **Location** (all unique locations currently in use)
- **Product** (all unique products currently in use)
- **Commodity** (Energy, Capacity, Ancillary Services, etc.)
- **Curve Type** (REVENUE, ENERGY, AS, RA, etc.)
- **Battery Duration** (2H, 4H, 8H, etc.)
- **Scenario** (BASE, HIGH, LOW, P50, P90, P10, etc.)
- **Degradation Type** (NONE, YEAR_1, YEAR_5, YEAR_10, YEAR_20)
- **Units** ($/MWh, $/kW-month, MWh, MW)
- **Granularity** (HOURLY, DAILY, MONTHLY, QUARTERLY, ANNUAL)
- **Timezone** (UTC, America/Los_Angeles, America/Chicago, America/New_York)

### ✅ **Dual Input Methods**

#### **For Select Elements (Dropdowns)**
- Pre-populated with database values
- Shows "+ Add New Value..." option at bottom
- Clicking "Add New" prompts for custom value
- New value is added to dropdown immediately
- Works for: Market, Curve Type, Battery Duration, Scenario, Degradation Type, Granularity, Units

#### **For Text Inputs (Datalists)**
- HTML5 datalist with autocomplete
- Type to search existing values
- Can enter any new value directly
- Shows count of available values below field
- Works for: Location, Product, Commodity, Timezone

### ✅ **Smart Caching**
- API results cached for 1 minute
- Reduces database queries
- Refreshes automatically after cache expires
- Can be manually refreshed after creating new definitions

## Files Created/Modified

### **New Files:**
1. **`src/pages/api/admin/curve-field-values.ts`**
   - API endpoint that returns unique values from database
   - Queries CurveDefinition table for all fields
   - Combines database values with enum defaults
   - Returns sorted, deduplicated lists

2. **`src/lib/autocomplete-fields.ts`**
   - Reusable autocomplete management module
   - Fetches field values from API
   - Sets up datalists for text inputs
   - Populates select elements with options
   - Handles "Add New" functionality
   - Caches values for performance

### **Modified Files:**
1. **`src/pages/admin/inventory.astro`**
   - Added autocomplete initialization
   - Edit forms now use database values

2. **`src/pages/admin/upload.astro`**
   - Added autocomplete initialization
   - Added missing fields (Commodity, Scenario, Degradation Type, Timezone)
   - Updated save function to include all new fields
   - Text inputs now have placeholders

## Usage

### **For End Users:**

#### **Creating a New Curve:**
1. Open the upload page (`/admin/upload`)
2. Click "Add Curve Definition"
3. Form fields show existing values from database
4. **Option A - Use Existing:** Click dropdown and select
5. **Option B - Add New:** 
   - For dropdowns: Select "+ Add New Value..." and enter new value
   - For text fields: Just type the new value directly
6. Save the definition

#### **Editing a Curve:**
1. Go to inventory page (`/admin/inventory`)
2. Select a curve and click "Edit Definition"
3. Same autocomplete functionality as creation

### **For Developers:**

#### **Adding Autocomplete to a New Form:**
```typescript
// In your page's script section
async function initAutocomplete() {
  const { initializeAutocompleteFields } = await import('../../lib/autocomplete-fields');
  await initializeAutocompleteFields(document.body);
}

// Call during page initialization
initAutocomplete();
```

#### **Refreshing Values After Changes:**
```typescript
import { refreshAutocompleteValues } from '../../lib/autocomplete-fields';

// After creating a new definition
await refreshAutocompleteValues();
```

## Technical Details

### **API Response Format:**
```json
{
  "values": {
    "markets": ["CAISO", "ERCOT", "PJM"],
    "locations": ["Houston", "LA Basin", "NP15"],
    "products": ["4HR BESS", "2HR BESS"],
    "commodities": ["Energy", "Capacity"],
    "curveTypes": ["REVENUE", "ENERGY"],
    "batteryDurations": ["TWO_H", "FOUR_H"],
    "scenarios": ["BASE", "HIGH", "LOW"],
    "degradationTypes": ["NONE", "YEAR_5"],
    "units": ["$/MWh", "$/kW-month"],
    "granularities": ["MONTHLY", "DAILY"],
    "timezones": ["UTC", "America/Los_Angeles"]
  },
  "stats": {
    "totalDefinitions": 25,
    "uniqueMarkets": 3,
    "uniqueLocations": 8,
    "uniqueProducts": 6
  }
}
```

### **Field ID Mapping:**
The system automatically detects these field IDs:
- `defMarket`, `editDefMarket` → markets
- `defLocation`, `editDefLocation` → locations
- `defProduct`, `editDefProduct` → products
- `defCommodity`, `editDefCommodity` → commodities
- `defCurveType`, `editDefCurveType` → curveTypes
- And so on...

### **Data Flow:**
```
1. Page loads
   ↓
2. initAutocomplete() called
   ↓
3. Fetch /api/admin/curve-field-values
   ↓
4. Cache response for 1 minute
   ↓
5. For each field:
   - If SELECT: Populate options + add "Other"
   - If INPUT: Create datalist + attach
   ↓
6. User interacts with form
   ↓
7. If "Add New" selected:
   - Prompt for value
   - Add to dropdown
   - Clear cache
```

## Benefits

### **✅ Data Consistency**
- No more "CAISO" vs "Caiso" vs "caiso"
- No random spaces or dashes
- Standardized naming across all curves

### **✅ User Experience**
- See what values are already in use
- Type to search existing values
- Easy to reuse common values
- Still flexible to add new values when needed

### **✅ Data Quality**
- Reduces typos
- Maintains clean database
- Makes reporting and filtering more reliable
- Easier to manage and audit data

### **✅ Performance**
- Caching reduces database load
- Single API call per page load
- Minimal impact on form responsiveness

## Examples

### **Example 1: Consistent Market Names**
**Before:** Users might type "CAISO", "Caiso", "caiso", "ca iso"
**After:** Dropdown shows "CAISO" from database, ensures consistency

### **Example 2: Location Autocomplete**
**Before:** Users had to remember exact location names
**After:** Type "LA" and see "LA Basin", "LA Import", etc.

### **Example 3: Adding New Location**
**Scenario:** Need to add a new location "San Diego"
**Process:**
1. Start typing "San Diego"
2. Not in dropdown → just continue typing
3. Value is saved
4. Next user will see "San Diego" in autocomplete

### **Example 4: Select with Custom Value**
**Scenario:** Need a custom battery duration
**Process:**
1. Open Battery Duration dropdown
2. Select "+ Add New Value..."
3. Enter "3.5H"
4. Custom value is added
5. Immediate use in current form
6. Available in autocomplete after page refresh

## Future Enhancements

Potential improvements:
- [ ] Real-time sync across tabs/users
- [ ] Admin page to manage and clean up values
- [ ] Suggest similar values when adding new
- [ ] Deprecate old values
- [ ] Bulk update values
- [ ] Value usage statistics

## Troubleshooting

### **Values Not Showing:**
1. Check browser console for errors
2. Verify `/api/admin/curve-field-values` returns data
3. Check field IDs match expected patterns
4. Clear cache and reload

### **New Values Not Appearing:**
1. Cache expires after 1 minute
2. Create a new curve to force refresh
3. Or call `refreshAutocompleteValues()`

### **"Add New" Not Working:**
1. Check browser console for errors
2. Verify field is a SELECT element
3. Ensure JavaScript is enabled
4. Check for modal/popup blockers

## Testing Checklist

- [ ] Load upload page - see existing values
- [ ] Load inventory page - see existing values
- [ ] Type in Location field - see autocomplete
- [ ] Select from Market dropdown - works
- [ ] Click "+ Add New Value..." - prompt appears
- [ ] Enter new value - appears in dropdown
- [ ] Save with existing value - works
- [ ] Save with new value - works
- [ ] Reload page - new value appears in autocomplete
- [ ] Multiple tabs - values consistent

## Related Documentation

- [P-Value Migration & Edit Features](../deployment/PVALUE_MIGRATION_AND_EDIT_FEATURES.md)
- [Upload Page Guide](./UPLOAD_PAGE_GUIDE.md)
- [Database Schema](../database/CURRENT_DATABASE_SCHEMA.md)

