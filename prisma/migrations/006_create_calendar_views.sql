-- Create Calendar and Schedule Management Views
-- These views power the curve delivery calendar and management dashboard

BEGIN;

-- Set schema
SET search_path TO "Forecasts", public;

-- ========== SCHEDULE_MANAGEMENT VIEW ==========
-- This view provides a comprehensive overview of curve schedules and their status

CREATE OR REPLACE VIEW "Forecasts".schedule_management AS
SELECT 
    cs.id as schedule_id,
    cd.id as curve_definition_id,
    cd."curveName",
    cd.market,
    cd.location,
    cd.product,
    cd."batteryDuration",
    cs."scheduleType",
    cs.frequency,
    cs."dayOfWeek",
    cs."dayOfMonth",
    cs."timeOfDay",
    cs."leadTimeDays",
    cs."freshnessDays",
    cs."responsibleTeam",
    cs."notificationEmails",
    cs.importance,
    cs."isActive",
    cs."validFrom",
    cs."validUntil",
    cs."createdAt",
    cs."updatedAt",
    
    -- Latest instance information
    latest_instance.id as latest_instance_id,
    latest_instance."instanceVersion" as latest_version,
    latest_instance."forecastRunDate" as last_run_date,
    latest_instance."deliveryPeriodStart" as latest_delivery_start,
    latest_instance."deliveryPeriodEnd" as latest_delivery_end,
    latest_instance.status as instance_status,
    latest_instance."curveTypes",
    latest_instance.commodities,
    latest_instance.scenarios,
    latest_instance.granularity,
    
    -- Next delivery calculation
    CASE 
        WHEN latest_instance."forecastRunDate" IS NULL THEN CURRENT_TIMESTAMP
        WHEN cs.frequency = 'HOURLY' THEN latest_instance."forecastRunDate" + INTERVAL '1 hour'
        WHEN cs.frequency = 'DAILY' THEN latest_instance."forecastRunDate" + INTERVAL '1 day'
        WHEN cs.frequency = 'WEEKLY' THEN latest_instance."forecastRunDate" + INTERVAL '7 days'
        WHEN cs.frequency = 'MONTHLY' THEN latest_instance."forecastRunDate" + INTERVAL '1 month'
        WHEN cs.frequency = 'QUARTERLY' THEN latest_instance."forecastRunDate" + INTERVAL '3 months'
        WHEN cs.frequency = 'ANNUALLY' THEN latest_instance."forecastRunDate" + INTERVAL '1 year'
        ELSE latest_instance."forecastRunDate" + INTERVAL '30 days'
    END as next_delivery_due,
    
    -- Status determination
    CASE 
        WHEN latest_instance.id IS NULL THEN 'PENDING'
        WHEN latest_instance.status = 'DRAFT' THEN 'IN_PROGRESS'
        WHEN latest_instance.status IN ('PENDING_APPROVAL', 'APPROVED') THEN 'SCHEDULED'
        WHEN latest_instance.status = 'ACTIVE' THEN 'COMPLETED'
        WHEN latest_instance.status IN ('SUPERSEDED', 'EXPIRED') THEN 'SUPERSEDED'
        WHEN latest_instance.status = 'FAILED' THEN 'FAILED'
        ELSE 'PENDING'
    END as schedule_status,
    
    -- Overdue calculation
    CASE 
        WHEN latest_instance."forecastRunDate" IS NULL THEN 
            CURRENT_TIMESTAMP > (cs."validFrom" + (cs."leadTimeDays" || ' days')::INTERVAL)
        WHEN cs.frequency = 'HOURLY' THEN 
            CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '1 hour' + (cs."leadTimeDays" || ' days')::INTERVAL)
        WHEN cs.frequency = 'DAILY' THEN 
            CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '1 day' + (cs."leadTimeDays" || ' days')::INTERVAL)
        WHEN cs.frequency = 'WEEKLY' THEN 
            CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '7 days' + (cs."leadTimeDays" || ' days')::INTERVAL)
        WHEN cs.frequency = 'MONTHLY' THEN 
            CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '1 month' + (cs."leadTimeDays" || ' days')::INTERVAL)
        ELSE false
    END as is_overdue,
    
    -- Instance count
    COALESCE(instance_stats.total_instances, 0) as total_instances,
    COALESCE(instance_stats.active_instances, 0) as active_instances
    
FROM "Forecasts"."CurveSchedule" cs
INNER JOIN "Forecasts"."CurveDefinition" cd ON cd.id = cs."curveDefinitionId"
LEFT JOIN LATERAL (
    SELECT * FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = cs."curveDefinitionId"
    ORDER BY ci."forecastRunDate" DESC, ci."createdAt" DESC
    LIMIT 1
) latest_instance ON true
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as total_instances,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_instances
    FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = cs."curveDefinitionId"
) instance_stats ON true
WHERE cd."isActive" = true;

-- ========== SCHEDULE_CALENDAR VIEW ==========
-- This view provides calendar-specific events for curve deliveries

CREATE OR REPLACE VIEW "Forecasts".schedule_calendar AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY ci."deliveryPeriodStart", cd.id) as event_id,
    cd.id as curve_definition_id,
    ci.id as curve_instance_id,
    cs.id as schedule_id,
    
    -- Event details
    ci."deliveryPeriodStart" as event_date,
    ci."deliveryPeriodEnd" as event_end_date,
    ci."forecastRunDate" as forecast_date,
    
    -- Curve information
    cd."curveName" as title,
    CONCAT(
        cd."curveName", ' - ',
        cd.market, ' ',
        cd.location, 
        CASE WHEN ci.granularity IS NOT NULL THEN ' (' || ci.granularity || ')' ELSE '' END
    ) as description,
    
    -- Classification
    cd.market,
    cd.location,
    cd.product,
    cd."batteryDuration",
    ci."curveTypes",
    ci.commodities,
    ci.scenarios,
    ci.granularity,
    ci."degradationType",
    
    -- Status and scheduling
    ci.status as instance_status,
    cs."responsibleTeam",
    cs.importance,
    cs.frequency,
    
    -- Metadata for calendar display
    CASE 
        WHEN ci.status = 'DRAFT' THEN 'orange'
        WHEN ci.status = 'PENDING_APPROVAL' THEN 'yellow'
        WHEN ci.status = 'APPROVED' THEN 'blue'
        WHEN ci.status = 'ACTIVE' THEN 'green'
        WHEN ci.status IN ('SUPERSEDED', 'EXPIRED') THEN 'gray'
        WHEN ci.status = 'FAILED' THEN 'red'
        ELSE 'gray'
    END as event_color,
    
    CASE 
        WHEN ci.status = 'DRAFT' THEN '🟠'
        WHEN ci.status = 'PENDING_APPROVAL' THEN '🟡'
        WHEN ci.status = 'APPROVED' THEN '🔵'
        WHEN ci.status = 'ACTIVE' THEN '✅'
        WHEN ci.status IN ('SUPERSEDED', 'EXPIRED') THEN '⚫'
        WHEN ci.status = 'FAILED' THEN '❌'
        ELSE '⚪'
    END as status_icon,
    
    -- URL for linking
    CONCAT('/curves/view/', ci.id) as event_url,
    
    -- Additional metadata
    ci."createdBy",
    ci."approvedBy",
    ci."approvedAt",
    ci."createdAt",
    ci."updatedAt",
    ci.notes
    
FROM "Forecasts"."CurveInstance" ci
INNER JOIN "Forecasts"."CurveDefinition" cd ON cd.id = ci."curveDefinitionId"
LEFT JOIN "Forecasts"."CurveSchedule" cs ON cs."curveDefinitionId" = cd.id AND cs."isActive" = true
WHERE cd."isActive" = true
ORDER BY ci."deliveryPeriodStart" DESC, cd."curveName";

-- ========== CONVENIENCE VIEWS FOR FILTERING ==========

-- View for upcoming deliveries (next 90 days)
CREATE OR REPLACE VIEW "Forecasts".upcoming_deliveries AS
SELECT * FROM "Forecasts".schedule_calendar
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY event_date;

-- View for overdue deliveries
CREATE OR REPLACE VIEW "Forecasts".overdue_deliveries AS
SELECT 
    sm.*,
    CURRENT_DATE - DATE(sm.next_delivery_due) as days_overdue
FROM "Forecasts".schedule_management sm
WHERE sm.is_overdue = true
  AND sm.schedule_status != 'COMPLETED'
ORDER BY sm.next_delivery_due;

-- View for active schedules needing attention
CREATE OR REPLACE VIEW "Forecasts".schedules_needing_attention AS
SELECT * FROM "Forecasts".schedule_management
WHERE schedule_status IN ('PENDING', 'IN_PROGRESS', 'SCHEDULED')
  AND "isActive" = true
  AND ("validUntil" IS NULL OR "validUntil" > CURRENT_TIMESTAMP)
ORDER BY 
    CASE WHEN is_overdue THEN 1 ELSE 2 END,
    importance DESC,
    next_delivery_due;

-- ========== GRANT PERMISSIONS ==========

COMMENT ON VIEW "Forecasts".schedule_management IS 
'Comprehensive view of all curve schedules with status, next delivery dates, and instance information';

COMMENT ON VIEW "Forecasts".schedule_calendar IS 
'Calendar-optimized view of curve instances with delivery dates for calendar display';

COMMENT ON VIEW "Forecasts".upcoming_deliveries IS 
'Curves scheduled for delivery in the next 90 days';

COMMENT ON VIEW "Forecasts".overdue_deliveries IS 
'Curves that are overdue for delivery';

COMMENT ON VIEW "Forecasts".schedules_needing_attention IS 
'Active schedules that need attention (pending, in progress, or overdue)';

-- ========== VERIFICATION ==========

DO $$
DECLARE
    v_management_count INTEGER;
    v_calendar_count INTEGER;
    v_upcoming_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_management_count FROM "Forecasts".schedule_management;
    SELECT COUNT(*) INTO v_calendar_count FROM "Forecasts".schedule_calendar;
    SELECT COUNT(*) INTO v_upcoming_count FROM "Forecasts".upcoming_deliveries;
    
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Calendar Views Created Successfully';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Schedule Management Entries: %', v_management_count;
    RAISE NOTICE 'Calendar Events: %', v_calendar_count;
    RAISE NOTICE 'Upcoming Deliveries (90 days): %', v_upcoming_count;
    RAISE NOTICE '=================================================';
END $$;

COMMIT;

-- Display sample of calendar events
SELECT 
    event_id,
    event_date,
    title,
    market,
    location,
    instance_status,
    status_icon,
    "responsibleTeam"
FROM "Forecasts".schedule_calendar
ORDER BY event_date DESC
LIMIT 10;

