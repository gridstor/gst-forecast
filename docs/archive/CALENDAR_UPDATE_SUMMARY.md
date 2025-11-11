# Curve Calendar Update - Fixed and Enhanced

## What Was Fixed

### The Problem
Your curve calendar wasn't showing curves you added yesterday because:
1. **Missing Database Views**: The system was missing the `schedule_calendar` and `schedule_management` views
2. **Wrong Date Display**: Calendar was showing curves by upload date instead of delivery date

### The Solution

#### 1. Created Database Views ✅
Created 5 new database views in the `Forecasts` schema:
- **`schedule_calendar`** - Main view organizing curves by delivery dates
- **`schedule_management`** - Management view with schedule status
- **`upcoming_deliveries`** - Curves due in next 90 days
- **`overdue_deliveries`** - Past-due curves
- **`schedules_needing_attention`** - Active curves needing action

**Migration Script**: `npm run migrate:calendar`

#### 2. Updated Calendar Page ✅
Updated `/curve-schedule/index.astro` to:
- Query the new `schedule_calendar` view
- Display curves by **delivery period dates** (not upload dates)
- Show status icons (✅ Active, 🟠 Draft, 🔵 Approved, ⚫ Superseded)
- Add clickable curve cards that link to curve details
- Include battery duration and curve type information
- Support both curve deliveries and scheduled runs

## What's Now Showing

Your calendar now displays **23 curves** including:
- **CAISO SP15 4H** - Delivery: 12/31/2025
- **CAISO Goleta 2.6H** - Delivery: 12/1/2025  
- **SPP North Hub 4H** - Delivery: 11/30/2025
- **SPP South Hub 4H** - Delivery: 11/30/2025
- ...and 19 more curves

## How to Use the Updated Calendar

### View Options
1. **Navigate by Month**: Use ◀️ and ▶️ buttons to change months
2. **Click on Curves**: Click any curve card to view its details
3. **See More**: Click "+X more" to see all curves on a specific day
4. **Add Notes**: Click the + icon on any date to add notes

### Status Icons Legend
- ✅ **Active** - Curve is live and current
- 🟠 **Draft** - Work in progress
- 🔵 **Approved** - Ready for activation
- 🟡 **Pending Approval** - Awaiting review
- ⚫ **Superseded** - Replaced by newer version
- ❌ **Failed** - Error state

### Information Displayed
Each curve shows:
- **Curve Name** and location
- **Market** (CAISO, ERCOT, SPP, etc.)
- **Battery Duration** (2H, 4H, etc.)
- **Status** with icon
- **Curve Type** and granularity

## Key Changes in Code

### Database Query (Before)
```typescript
// OLD: Showing by upload date
const uploadedCurves = await prisma.curveInstance.findMany({
  where: {
    createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth }
  }
});
```

### Database Query (After)
```typescript
// NEW: Showing by delivery date
const calendarEvents = await prisma.$queryRaw`
  SELECT * FROM "Forecasts".schedule_calendar
  WHERE event_date >= ${firstDayOfMonth}
    AND event_date <= ${lastDayOfMonth}
  ORDER BY event_date, title
`;
```

## Files Modified

1. **`prisma/migrations/006_create_calendar_views.sql`** - New migration file
2. **`scripts/create-calendar-views.ts`** - Migration runner script
3. **`package.json`** - Added `migrate:calendar` command
4. **`src/pages/curve-schedule/index.astro`** - Updated calendar display

## Testing the Calendar

### Navigate to Calendar
```
http://localhost:4321/curve-schedule
```

### Expected Behavior
- See curves organized by their delivery dates
- Status icons showing current state
- Click curves to view details
- Navigate between months
- All recently added curves visible

### Verify Your Recent Additions
Navigate to **November 2025** and **December 2025** to see your recently added curves showing up on their delivery dates.

## Troubleshooting

### If curves still don't show:
1. Restart dev server: `npm run dev`
2. Check browser console for errors
3. Verify database connection
4. Re-run migration: `npm run migrate:calendar`

### If dates look wrong:
- Calendar now shows **delivery period dates**, not upload dates
- This is correct and expected behavior
- Curves appear on the date they're scheduled for delivery

## Next Steps (Optional Enhancements)

1. **Add filtering** by market, location, or status
2. **Export calendar** to CSV or iCal
3. **Email notifications** for upcoming deliveries
4. **Drag-and-drop** to reschedule curves
5. **Color coding** by market or product type

---

## Summary

✅ Calendar now works correctly
✅ Shows 23 curves by delivery dates
✅ Includes curves you added yesterday
✅ Status icons and click-to-view functionality
✅ Month navigation working
✅ Notes system preserved

Your calendar is now fully operational and staying up with all curve additions! 🎉

