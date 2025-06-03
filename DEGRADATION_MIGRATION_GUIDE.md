# Degradation Migration Guide: From Types to Date-Only

## Overview

This migration simplifies how degradation is handled in the curve scheduling system, moving from a type-based approach to a simpler date-only approach.

## Changes Made

### Before (Type-Based Approach)
- **Degradation Type Dropdown**: Users selected from predefined types like "None", "Year 1", "Year 2", etc.
- **Degradation Start Date**: Optional field that worked alongside the type
- **Complex Logic**: Backend had to interpret both type and date

### After (Date-Only Approach)
- **Radio Button Control**: Simple choice between "No degradation" or "Degradation starts on [date]"
- **Single Source of Truth**: Only the `degradationStartDate` field controls degradation
- **Cleaner Logic**: If date is set → degradation starts on that date. If NULL → no degradation.

## UI Changes

### `/curve-schedule/create-enhanced`
- ✅ Removed degradation type dropdown
- ✅ Added radio button control with two options:
  - "No degradation" (default, selected)
  - "Degradation starts on:" with date picker
- ✅ Date picker only appears when second option is selected
- ✅ Improved validation and user experience

### JavaScript (`enhanced-schedule-form.js`)
- ✅ Added radio button event handlers
- ✅ Updated form data gathering to ignore degradation type
- ✅ Simplified validation logic
- ✅ Updated preview display

## Backend Changes

### API Updates
- ✅ `src/pages/api/curve-schedule/create-enhanced.ts`: Removed `degradationType` parameter, defaults to 'NONE'
- ✅ `src/pages/api/curve-schedule/preview.ts`: Same changes as create API
- ✅ Both APIs still pass 'NONE' to database functions for backward compatibility

### Database Considerations
- 🔄 **No breaking changes**: Existing database schema remains intact
- 🔄 **Backward Compatibility**: `degradationType` field still exists but defaults to 'NONE'
- 🔄 **Primary Control**: `degradationStartDate` in `CurveInstanceTemplate` is now the primary control

## Migration Strategy

### 1. Safe Migration
- Existing records remain untouched
- New schedules use the simplified approach
- Old functionality continues to work

### 2. Optional Database Update
Run the migration script if desired:
```sql
-- See scripts/migrate_degradation_to_date_only.sql
```

### 3. Future Cleanup (Optional)
In future iterations, you could:
- Remove degradation type enum entirely
- Clean up database references
- Simplify database functions

## User Experience Improvements

### Clearer Interface
- **Before**: Users had to understand arbitrary type names like "Year 1", "Year 2"
- **After**: Clear choice between "no degradation" or "starts on specific date"

### Better Validation
- Date must be within delivery period
- Real-time feedback
- Clear error messages

### Simplified Logic
- One field controls everything
- No need to coordinate between type and date
- Fewer edge cases

## Testing the Changes

1. **Navigate to**: `http://localhost:4321/curve-schedule/create-enhanced`
2. **Test Cases**:
   - Select "No degradation" → form should work normally
   - Select "Degradation starts on" → date picker appears
   - Set date within delivery period → should validate successfully
   - Set date outside delivery period → should show error
   - Preview and create schedules with both options

## Files Modified

### Frontend
- `src/pages/curve-schedule/create-enhanced.astro`
- `public/js/enhanced-schedule-form.js`

### Backend
- `src/pages/api/curve-schedule/create-enhanced.ts`
- `src/pages/api/curve-schedule/preview.ts`

### Documentation
- `scripts/migrate_degradation_to_date_only.sql`
- `DEGRADATION_MIGRATION_GUIDE.md` (this file)

## Benefits

1. **Simplified UX**: Clearer, more intuitive interface
2. **Reduced Complexity**: Fewer fields to coordinate
3. **Better Validation**: Date-based validation is more straightforward
4. **Future-Proof**: Easier to extend with additional date-based features
5. **Backward Compatible**: Existing data and functionality preserved

## Rollback Plan

If needed, you can revert changes by:
1. Restoring the degradation type dropdown in the UI
2. Adding back degradation type handling in APIs
3. Updating JavaScript to handle both fields again

All database changes are non-destructive, so rollback is straightforward. 