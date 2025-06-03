-- =====================================================
-- SCHEDULE-FIRST CURVE WORKFLOW
-- Enhanced functions and views for planning curve deliveries
-- =====================================================

BEGIN;

-- ========== STEP 1: CREATE ENHANCED SCHEDULE MANAGEMENT VIEWS ==========

-- First, drop existing functions that need parameter changes
DROP FUNCTION IF EXISTS "Forecasts".create_schedule_with_definition(
    VARCHAR, VARCHAR, VARCHAR, 
    "Forecasts"."CurveType", "Forecasts"."BatteryDuration", "Forecasts"."ScenarioType", "Forecasts"."DegradationType",
    "Forecasts"."UpdateFrequency", INTEGER, INTEGER, TIME, INTEGER, VARCHAR, TEXT[], INTEGER, VARCHAR
);

DROP FUNCTION IF EXISTS "Forecasts".find_or_create_curve_definition(
    VARCHAR, VARCHAR, VARCHAR,
    "Forecasts"."CurveType", "Forecasts"."BatteryDuration", "Forecasts"."ScenarioType", "Forecasts"."DegradationType",
    VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR
);

DROP FUNCTION IF EXISTS "Forecasts".delete_schedule_safe(INTEGER, VARCHAR);

-- Main schedule management view with status tracking
CREATE OR REPLACE VIEW "Forecasts".schedule_management AS
SELECT 
    s."id" as schedule_id,
    s."curveDefinitionId",
    s."scheduleType",
    s."frequency",
    s."dayOfWeek",
    s."dayOfMonth", 
    s."timeOfDay",
    s."freshnessDays",
    s."responsibleTeam",
    s."importance",
    s."isActive",
    s."validFrom",
    s."validUntil",
    s."createdAt" as schedule_created,
    
    -- Curve definition details
    cd."curveName",
    cd."market",
    cd."location", 
    cd."product",
    cd."curveType",
    cd."batteryDuration",
    cd."scenario",
    cd."units",
    cd."description",
    
    -- Calculate next delivery date based on frequency
    CASE 
        WHEN s."frequency" = 'DAILY' THEN 
            CURRENT_DATE + INTERVAL '1 day'
        WHEN s."frequency" = 'WEEKLY' AND s."dayOfWeek" IS NOT NULL THEN
            CURRENT_DATE + INTERVAL '1 week' * 
            CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= s."dayOfWeek" 
                 THEN 0 ELSE 1 END +
            INTERVAL '1 day' * (s."dayOfWeek" - EXTRACT(DOW FROM CURRENT_DATE))
        WHEN s."frequency" = 'MONTHLY' AND s."dayOfMonth" IS NOT NULL THEN
            DATE_TRUNC('month', CURRENT_DATE) + 
            INTERVAL '1 month' + 
            INTERVAL '1 day' * (s."dayOfMonth" - 1)
        WHEN s."frequency" = 'QUARTERLY' THEN
            DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months'
        WHEN s."frequency" = 'ANNUALLY' THEN
            DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
        ELSE CURRENT_DATE + INTERVAL '30 days'
    END::DATE as next_delivery_due,
    
    -- Instance statistics
    COALESCE(latest.instance_count, 0) as total_instances,
    latest.latest_instance_date,
    latest.latest_status,
    latest.latest_version,
    latest.latest_granularity,
    
    -- Schedule status logic
    CASE 
        WHEN latest.instance_count IS NULL THEN 'SCHEDULED'
        WHEN latest.latest_instance_date IS NOT NULL AND 
             latest.latest_instance_date + (s."freshnessDays" || ' days')::INTERVAL > CURRENT_TIMESTAMP 
             AND latest.latest_status = 'ACTIVE' THEN 'COMPLETED'
        WHEN latest.instance_count > 0 THEN 'IN_PROGRESS'
        ELSE 'SCHEDULED'
    END as schedule_status,
    
    -- Overdue check
    CASE 
        WHEN latest.instance_count IS NULL AND 
             CURRENT_DATE > (
                CASE 
                    WHEN s."frequency" = 'DAILY' THEN CURRENT_DATE
                    WHEN s."frequency" = 'WEEKLY' THEN CURRENT_DATE - INTERVAL '7 days'
                    WHEN s."frequency" = 'MONTHLY' THEN CURRENT_DATE - INTERVAL '1 month'
                    ELSE CURRENT_DATE - INTERVAL '30 days'
                END
             ) THEN true
        WHEN latest.latest_instance_date IS NOT NULL AND 
             latest.latest_instance_date + (s."freshnessDays" || ' days')::INTERVAL < CURRENT_TIMESTAMP 
             THEN true
        ELSE false
    END as is_overdue,
    
    -- Days until next delivery
    EXTRACT(DAY FROM (
        CASE 
            WHEN s."frequency" = 'DAILY' THEN CURRENT_DATE + INTERVAL '1 day'
            WHEN s."frequency" = 'WEEKLY' AND s."dayOfWeek" IS NOT NULL THEN
                CURRENT_DATE + INTERVAL '1 week'
            WHEN s."frequency" = 'MONTHLY' AND s."dayOfMonth" IS NOT NULL THEN
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '1 day' * (s."dayOfMonth" - 1)
            ELSE CURRENT_DATE + INTERVAL '30 days'
        END - CURRENT_DATE
    )) as days_until_delivery

FROM "Forecasts"."CurveSchedule" s
JOIN "Forecasts"."CurveDefinition" cd ON cd."id" = s."curveDefinitionId"
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as instance_count,
        MAX(ci."forecastRunDate") as latest_instance_date,
        MAX(ci."status") as latest_status,
        MAX(ci."instanceVersion") as latest_version,
        MAX(ci."granularity") as latest_granularity
    FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = s."curveDefinitionId"
) latest ON true
WHERE s."isActive" = true
ORDER BY 
    CASE 
        WHEN (CASE 
                WHEN latest.instance_count IS NULL THEN 'SCHEDULED'
                WHEN latest.latest_instance_date IS NOT NULL AND 
                     latest.latest_instance_date + (s."freshnessDays" || ' days')::INTERVAL > CURRENT_TIMESTAMP 
                     AND latest.latest_status = 'ACTIVE' THEN 'COMPLETED'
                WHEN latest.instance_count > 0 THEN 'IN_PROGRESS'
                ELSE 'SCHEDULED'
              END) = 'SCHEDULED' AND 
             (CASE 
                WHEN latest.instance_count IS NULL AND 
                     CURRENT_DATE > (
                        CASE 
                            WHEN s."frequency" = 'DAILY' THEN CURRENT_DATE
                            WHEN s."frequency" = 'WEEKLY' THEN CURRENT_DATE - INTERVAL '7 days'
                            WHEN s."frequency" = 'MONTHLY' THEN CURRENT_DATE - INTERVAL '1 month'
                            ELSE CURRENT_DATE - INTERVAL '30 days'
                        END
                     ) THEN true
                WHEN latest.latest_instance_date IS NOT NULL AND 
                     latest.latest_instance_date + (s."freshnessDays" || ' days')::INTERVAL < CURRENT_TIMESTAMP 
                     THEN true
                ELSE false
              END) THEN 1
        WHEN (CASE 
                WHEN latest.instance_count IS NULL THEN 'SCHEDULED'
                WHEN latest.latest_instance_date IS NOT NULL AND 
                     latest.latest_instance_date + (s."freshnessDays" || ' days')::INTERVAL > CURRENT_TIMESTAMP 
                     AND latest.latest_status = 'ACTIVE' THEN 'COMPLETED'
                WHEN latest.instance_count > 0 THEN 'IN_PROGRESS'
                ELSE 'SCHEDULED'
              END) = 'SCHEDULED' THEN 2  
        WHEN (CASE 
                WHEN latest.instance_count IS NULL THEN 'SCHEDULED'
                WHEN latest.latest_instance_date IS NOT NULL AND 
                     latest.latest_instance_date + (s."freshnessDays" || ' days')::INTERVAL > CURRENT_TIMESTAMP 
                     AND latest.latest_status = 'ACTIVE' THEN 'COMPLETED'
                WHEN latest.instance_count > 0 THEN 'IN_PROGRESS'
                ELSE 'SCHEDULED'
              END) = 'IN_PROGRESS' THEN 3
        ELSE 4 
    END,
    s."importance" DESC,
    CASE 
        WHEN s."frequency" = 'DAILY' THEN 
            CURRENT_DATE + INTERVAL '1 day'
        WHEN s."frequency" = 'WEEKLY' AND s."dayOfWeek" IS NOT NULL THEN
            CURRENT_DATE + INTERVAL '1 week' * 
            CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= s."dayOfWeek" 
                 THEN 0 ELSE 1 END +
            INTERVAL '1 day' * (s."dayOfWeek" - EXTRACT(DOW FROM CURRENT_DATE))
        WHEN s."frequency" = 'MONTHLY' AND s."dayOfMonth" IS NOT NULL THEN
            DATE_TRUNC('month', CURRENT_DATE) + 
            INTERVAL '1 month' + 
            INTERVAL '1 day' * (s."dayOfMonth" - 1)
        WHEN s."frequency" = 'QUARTERLY' THEN
            DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months'
        WHEN s."frequency" = 'ANNUALLY' THEN
            DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
        ELSE CURRENT_DATE + INTERVAL '30 days'
    END;

-- Calendar view for schedule management
CREATE OR REPLACE VIEW "Forecasts".schedule_calendar AS
SELECT 
    sm.*,
    -- Calendar specific fields
    sm.next_delivery_due as event_date,
    CONCAT(sm."curveName", ' - ', sm."responsibleTeam") as event_title,
    CASE 
        WHEN sm.schedule_status = 'SCHEDULED' AND sm.is_overdue THEN '#dc2626' -- red
        WHEN sm.schedule_status = 'SCHEDULED' THEN '#2563eb' -- blue  
        WHEN sm.schedule_status = 'IN_PROGRESS' THEN '#f59e0b' -- amber
        WHEN sm.schedule_status = 'COMPLETED' THEN '#059669' -- emerald
        ELSE '#6b7280' -- gray
    END as event_color,
    CASE 
        WHEN sm.schedule_status = 'SCHEDULED' AND sm.is_overdue THEN 'Overdue Delivery'
        WHEN sm.schedule_status = 'SCHEDULED' THEN 'Scheduled Delivery'
        WHEN sm.schedule_status = 'IN_PROGRESS' THEN 'In Progress'
        WHEN sm.schedule_status = 'COMPLETED' THEN 'Completed'
        ELSE 'Unknown'
    END as event_status_text
FROM "Forecasts".schedule_management sm
WHERE sm.next_delivery_due >= CURRENT_DATE - INTERVAL '30 days'
  AND sm.next_delivery_due <= CURRENT_DATE + INTERVAL '90 days';

-- Schedule summary by team and location
CREATE OR REPLACE VIEW "Forecasts".schedule_summary AS
SELECT 
    sm."market",
    sm."location", 
    sm."responsibleTeam",
    sm."curveType",
    COUNT(*) as total_schedules,
    COUNT(*) FILTER (WHERE sm.schedule_status = 'SCHEDULED') as scheduled_count,
    COUNT(*) FILTER (WHERE sm.schedule_status = 'IN_PROGRESS') as in_progress_count,
    COUNT(*) FILTER (WHERE sm.schedule_status = 'COMPLETED') as completed_count,
    COUNT(*) FILTER (WHERE sm.is_overdue) as overdue_count,
    AVG(sm."importance") as avg_importance,
    MIN(sm.next_delivery_due) as next_delivery,
    STRING_AGG(DISTINCT sm."curveName", ', ' ORDER BY sm."curveName") as curve_names
FROM "Forecasts".schedule_management sm
GROUP BY sm."market", sm."location", sm."responsibleTeam", sm."curveType"
ORDER BY overdue_count DESC, scheduled_count DESC;

-- ========== STEP 2: ENHANCED SCHEDULE CREATION FUNCTIONS ==========

-- Function to find or create curve definition
CREATE OR REPLACE FUNCTION "Forecasts".find_or_create_curve_definition(
    p_market VARCHAR,
    p_location VARCHAR,
    p_product VARCHAR,
    p_curve_type "Forecasts"."CurveType",
    p_battery_duration "Forecasts"."BatteryDuration" DEFAULT 'UNKNOWN',
    p_scenario "Forecasts"."ScenarioType" DEFAULT 'BASE',
    p_degradation_type "Forecasts"."DegradationType" DEFAULT 'NONE',
    p_commodity VARCHAR DEFAULT 'Energy',
    p_units VARCHAR DEFAULT '$/MWh',
    p_timezone VARCHAR DEFAULT 'UTC',
    p_description TEXT DEFAULT NULL,
    p_created_by VARCHAR DEFAULT 'system'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_definition_id INTEGER;
    v_curve_name VARCHAR(255);
BEGIN
    -- Generate standardized curve name
    v_curve_name := UPPER(CONCAT(
        REPLACE(p_market, ' ', '_'), '_',
        REPLACE(p_location, ' ', '_'), '_',
        p_curve_type::TEXT, '_',
        p_battery_duration::TEXT, '_',
        p_scenario::TEXT
    ));
    
    -- Try to find existing definition
    SELECT cd."id" INTO v_definition_id
    FROM "Forecasts"."CurveDefinition" cd
    WHERE cd."market" = p_market
      AND cd."location" = p_location
      AND cd."product" = p_product
      AND cd."curveType" = p_curve_type
      AND cd."batteryDuration" = p_battery_duration
      AND cd."scenario" = p_scenario
      AND cd."degradationType" = p_degradation_type
      AND cd."isActive" = true;
    
    -- Create if not found
    IF v_definition_id IS NULL THEN
        INSERT INTO "Forecasts"."CurveDefinition" (
            "curveName",
            "market",
            "location", 
            "product",
            "curveType",
            "batteryDuration",
            "scenario",
            "degradationType",
            "commodity",
            "units",
            "timezone",
            "description",
            "createdBy"
        ) VALUES (
            v_curve_name,
            p_market,
            p_location,
            p_product, 
            p_curve_type,
            p_battery_duration,
            p_scenario,
            p_degradation_type,
            p_commodity,
            p_units,
            p_timezone,
            COALESCE(p_description, CONCAT('Auto-created curve definition for ', v_curve_name)),
            p_created_by
        )
        RETURNING "id" INTO v_definition_id;
        
        RAISE NOTICE 'Created new CurveDefinition: % (ID: %)', v_curve_name, v_definition_id;
    ELSE
        RAISE NOTICE 'Found existing CurveDefinition: % (ID: %)', v_curve_name, v_definition_id;
    END IF;
    
    RETURN v_definition_id;
END;
$$;

-- Function to create schedule with auto curve definition
CREATE OR REPLACE FUNCTION "Forecasts".create_schedule_with_definition(
    p_market VARCHAR,
    p_location VARCHAR,
    p_product VARCHAR,
    p_curve_type "Forecasts"."CurveType",
    p_battery_duration "Forecasts"."BatteryDuration" DEFAULT 'UNKNOWN',
    p_scenario "Forecasts"."ScenarioType" DEFAULT 'BASE',
    p_degradation_type "Forecasts"."DegradationType" DEFAULT 'NONE',
    p_frequency "Forecasts"."UpdateFrequency" DEFAULT 'MONTHLY',
    p_day_of_week INTEGER DEFAULT NULL,
    p_day_of_month INTEGER DEFAULT NULL,
    p_time_of_day TIME DEFAULT '09:00:00',
    p_freshness_days INTEGER DEFAULT 30,
    p_responsible_team VARCHAR DEFAULT 'Market Analysis',
    p_notification_emails TEXT[] DEFAULT NULL,
    p_importance INTEGER DEFAULT 3,
    p_created_by VARCHAR DEFAULT 'system'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_definition_id INTEGER;
    v_schedule_id INTEGER;
BEGIN
    -- Find or create curve definition
    SELECT "Forecasts".find_or_create_curve_definition(
        p_market,
        p_location,
        p_product,
        p_curve_type,
        p_battery_duration,
        p_scenario,
        p_degradation_type,
        'Energy',
        CASE 
            WHEN p_curve_type = 'REVENUE' THEN '$'
            WHEN p_curve_type = 'AS' THEN '$/MW-yr'
            ELSE '$/MWh'
        END,
        CASE 
            WHEN p_market = 'CAISO' THEN 'America/Los_Angeles'
            WHEN p_market = 'ERCOT' THEN 'America/Chicago'
            ELSE 'UTC'
        END,
        NULL,
        p_created_by
    ) INTO v_definition_id;
    
    -- Create schedule
    INSERT INTO "Forecasts"."CurveSchedule" (
        "curveDefinitionId",
        "scheduleType",
        "frequency",
        "dayOfWeek",
        "dayOfMonth",
        "timeOfDay",
        "freshnessDays",
        "responsibleTeam",
        "notificationEmails",
        "importance",
        "isActive"
    ) VALUES (
        v_definition_id,
        'REGULAR',
        p_frequency,
        p_day_of_week,
        p_day_of_month,
        p_time_of_day,
        p_freshness_days,
        p_responsible_team,
        p_notification_emails,
        p_importance,
        true
    )
    RETURNING "id" INTO v_schedule_id;
    
    RAISE NOTICE 'Created schedule ID % for curve definition ID %', v_schedule_id, v_definition_id;
    
    RETURN v_schedule_id;
END;
$$;

-- Function to delete schedule (only if no instances exist)
CREATE OR REPLACE FUNCTION "Forecasts".delete_schedule_safe(
    p_schedule_id INTEGER,
    p_deleted_by VARCHAR DEFAULT 'system'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_definition_id INTEGER;
    v_instance_count INTEGER;
BEGIN
    -- Get the curve definition ID
    SELECT s."curveDefinitionId" INTO v_definition_id
    FROM "Forecasts"."CurveSchedule" s
    WHERE s."id" = p_schedule_id;
    
    IF v_definition_id IS NULL THEN
        RAISE EXCEPTION 'Schedule % not found', p_schedule_id;
    END IF;
    
    -- Check for existing instances
    SELECT COUNT(*) INTO v_instance_count
    FROM "Forecasts"."CurveInstance" ci
    WHERE ci."curveDefinitionId" = v_definition_id;
    
    IF v_instance_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete schedule %. % instances exist for this curve definition.', 
            p_schedule_id, v_instance_count;
    END IF;
    
    -- Safe to delete
    DELETE FROM "Forecasts"."CurveSchedule" 
    WHERE "id" = p_schedule_id;
    
    RAISE NOTICE 'Deleted schedule % (no instances existed)', p_schedule_id;
    
    RETURN true;
END;
$$;

COMMIT;

-- ========== VERIFICATION ==========
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===== SCHEDULE-FIRST WORKFLOW READY =====';
    RAISE NOTICE 'Created views:';
    RAISE NOTICE '  - schedule_management (main view)';
    RAISE NOTICE '  - schedule_calendar (calendar view)'; 
    RAISE NOTICE '  - schedule_summary (summary by team/location)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '  - find_or_create_curve_definition()';
    RAISE NOTICE '  - create_schedule_with_definition()';
    RAISE NOTICE '  - delete_schedule_safe()';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for schedule-first workflow implementation!';
END $$;

-- =====================================================
-- USAGE EXAMPLES:
--
-- 1. Create a schedule (auto-creates curve definition):
-- SELECT "Forecasts".create_schedule_with_definition(
--     'ERCOT', 'Houston', 'Aurora_Houston_Revenue_4h', 'REVENUE',
--     '4H', 'BASE', 'NONE', 'MONTHLY', NULL, 5, '10:00:00',
--     30, 'Market Analysis', ARRAY['team@company.com'], 4, 'john.doe'
-- );
--
-- 2. View schedule management:
-- SELECT * FROM "Forecasts".schedule_management;
--
-- 3. View calendar events:
-- SELECT * FROM "Forecasts".schedule_calendar;
--
-- 4. Delete schedule safely:
-- SELECT "Forecasts".delete_schedule_safe(1, 'admin');
-- ===================================================== 