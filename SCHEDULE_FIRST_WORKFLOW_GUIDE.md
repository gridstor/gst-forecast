# Schedule-First Curve Workflow Guide

## Overview

The schedule-first workflow allows you to plan curve deliveries in advance, creating schedules before actual data is available. This is ideal for energy market forecasting where you need to plan curve updates and deliveries according to business schedules.

## Architecture Components

### 1. **Database Layer**
- **Enhanced Views**: `schedule_management`, `schedule_calendar`, `schedule_summary`
- **Smart Functions**: Auto curve definition creation, safe schedule deletion
- **Status Tracking**: Real-time schedule status based on data availability

### 2. **API Endpoints**
- `POST /api/curve-schedule/create-enhanced` - Create new schedules with enhanced features
- `POST /api/curve-schedule/preview` - Preview schedule creation before committing
- `GET /api/curve-schedule/manage` - Fetch schedules with filtering
- `PUT /api/curve-schedule/manage` - Update schedule details
- `DELETE /api/curve-schedule/manage` - Safely delete schedules

### 3. **Frontend Pages**
- `/curve-schedule/create-enhanced` - Enhanced schedule creation form with versioning
- `/curve-schedule/manage` - Management dashboard with grid/calendar views

## Workflow Steps

### Step 1: Create Schedules

1. **Navigate to Schedule Creation**
   ```
   /curve-schedule/create
   ```

2. **Fill in Curve Specifications**
   - Market (ERCOT, CAISO, etc.)
   - Location (Houston, SP15, etc.)
   - Product identifier
   - Curve type (REVENUE, ENERGY_ARB, AS, etc.)
   - Battery duration (2H, 4H, 8H, etc.)
   - Scenario (BASE, HIGH, LOW, P50, etc.)

3. **Configure Schedule Parameters**
   - Update frequency (Daily, Weekly, Monthly, etc.)
   - Delivery timing (day of week/month, time of day)
   - Freshness period (how long data stays valid)
   - Responsible team and priority level

4. **Auto-Definition Creation**
   - System automatically creates or links to existing CurveDefinition
   - Standardized naming: `ERCOT_HOUSTON_REVENUE_4H_BASE`
   - Proper timezone and units assignment

### Step 2: Manage Schedules

1. **Navigate to Management Dashboard**
   ```
   /curve-schedule/manage
   ```

2. **View Options**
   - **Grid View**: Tabular view with filtering, sorting, bulk operations
   - **Calendar View**: Visual timeline of scheduled deliveries

3. **Status Understanding**
   - **SCHEDULED**: Awaiting data (planned but no instances)
   - **IN_PROGRESS**: Has some instances but may need updates
   - **COMPLETED**: Has fresh, active data
   - **OVERDUE**: Past due date without fresh data

### Step 3: Fulfill Schedules

When you're ready to add actual curve data:

1. **From Upload Page**: Select existing schedule to fulfill
2. **From Inventory**: Create new instance for scheduled curve definition
3. **Status Updates**: Schedule automatically moves to COMPLETED when fresh data is available

## Key Features

### 📅 **Smart Status Tracking**
```sql
-- Automatic status calculation based on:
- Data availability (instances exist?)
- Freshness (within valid time window?)
- Schedule frequency (is update overdue?)
```

### 🔄 **Auto Curve Definition Management**
```sql
-- Function automatically:
- Searches for existing matching definitions
- Creates new ones if needed
- Uses standardized naming conventions
- Sets appropriate units and timezones
```

### 🛡️ **Safe Deletion**
```sql
-- Can only delete schedules if:
- No curve instances exist yet
- Prevents data loss
- Maintains referential integrity
```

### 📊 **Dashboard Features**
- Real-time summary statistics
- Advanced filtering (status, market, team, curve type)
- Bulk operations (delete multiple schedules)
- Calendar visualization with color coding
- Edit schedule parameters before data upload

## Database Schema Usage

### Running the Scripts

1. **Database Reset** (if needed):
   ```sql
   -- Run in pgAdmin:
   \i scripts/01_complete_database_reset.sql
   ```

2. **Create New Schema**:
   ```sql
   -- Run in pgAdmin:
   \i scripts/02_create_energy_forecast_schema.sql
   ```

3. **Add Schedule Workflow**:
   ```sql
   -- Run in pgAdmin:
   \i scripts/05_schedule_first_workflow.sql
   ```

4. **Clean Legacy Data**:
   ```sql
   -- Run in pgAdmin:
   \i scripts/04_cleanup_legacy_tables.sql
   ```

### Key Views and Functions

**Main Management View**:
```sql
SELECT * FROM "Forecasts".schedule_management;
-- Shows all schedules with calculated status, next due dates, and metadata
```

**Calendar View**:
```sql
SELECT * FROM "Forecasts".schedule_calendar;
-- Optimized for calendar display with event colors and dates
```

**Create Schedule with Auto Definition**:
```sql
SELECT "Forecasts".create_schedule_with_definition(
    'ERCOT',                    -- market
    'Houston',                  -- location
    'Aurora_Houston_Revenue_4h', -- product
    'REVENUE',                  -- curve type
    '4H',                       -- battery duration
    'BASE',                     -- scenario
    'NONE',                     -- degradation type
    'MONTHLY',                  -- frequency
    NULL,                       -- day of week
    5,                          -- day of month
    '10:00:00',                 -- time of day
    720,                        -- freshness hours
    'Market Analysis',          -- responsible team
    ARRAY['team@company.com'],  -- notification emails
    4,                          -- importance
    'john.doe@company.com'      -- created by
);
```

## Workflow Benefits

### 🎯 **Planning First**
- Plan curve deliveries in advance
- Coordinate team responsibilities
- Set clear expectations and deadlines

### 🔄 **Flexible Fulfillment**
- Create schedules without immediate data requirements
- Fulfill schedules when data becomes available
- Track completion status automatically

### 📈 **Better Visibility**
- Dashboard shows all planned vs completed deliveries
- Calendar view for timeline planning
- Team and priority-based organization

### 🛠️ **Operational Control**
- Edit schedules before fulfillment
- Bulk operations for efficiency
- Safe deletion prevents data loss

## Integration with Existing Workflow

The schedule-first approach complements your existing curve management:

1. **Plan First**: Create schedules for anticipated curve needs
2. **Fulfill Later**: Use upload pages to fulfill scheduled deliveries
3. **Track Progress**: Dashboard shows which schedules need attention
4. **Maintain Quality**: Existing curve instance and versioning systems work unchanged

## Next Steps

1. **Run Database Scripts**: Execute the SQL scripts to set up the new schema
2. **Test Schedule Creation**: Try creating a few test schedules
3. **Explore Dashboard**: Use the management interface to view and filter schedules
4. **Update Navigation**: Add links to the new pages in your main navigation
5. **Train Teams**: Show teams how to use the schedule-first approach

This workflow transforms curve management from reactive (data arrives, then we manage it) to proactive (plan deliveries, then fulfill them), providing much better visibility and control over your energy forecasting operations. 