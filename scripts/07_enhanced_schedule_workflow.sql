-- =====================================================
-- ENHANCED SCHEDULE-FIRST WORKFLOW
-- Support for mixed CurveDefinition + CurveInstance templates
-- with preview functionality and custom enum values
-- =====================================================

BEGIN;

-- ========== STEP 1: CREATE INSTANCE TEMPLATE TABLE ==========

CREATE TABLE IF NOT EXISTS "Forecasts"."CurveInstanceTemplate" (
  id                    SERIAL PRIMARY KEY,
  "scheduleId"            INTEGER NOT NULL,
  "deliveryPeriodStart"   TIMESTAMPTZ NOT NULL,
  "deliveryPeriodEnd"     TIMESTAMPTZ NOT NULL,
  "degradationStartDate"  DATE,
  granularity           VARCHAR(50) NOT NULL,
  "instanceVersion"       VARCHAR(50) DEFAULT 'v1',
  
  -- Store custom enum values as TEXT when they don't match predefined enums
  "customCurveType"       VARCHAR(100),
  "customBatteryDuration" VARCHAR(50),
  "customScenario"        VARCHAR(100),
  "customDegradeType"     VARCHAR(100),
  
  -- Metadata
  notes                 TEXT,
  "createdAt"             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "createdBy"             VARCHAR(100),
  
  -- Constraints
  CONSTRAINT fk_schedule FOREIGN KEY ("scheduleId") REFERENCES "Forecasts"."CurveSchedule"(id) ON DELETE CASCADE,
  CONSTRAINT chk_delivery_period CHECK ("deliveryPeriodEnd" > "deliveryPeriodStart"),
  CONSTRAINT chk_degradation_within_period CHECK (
    "degradationStartDate" IS NULL OR 
    ("degradationStartDate" >= "deliveryPeriodStart"::DATE AND 
     "degradationStartDate" <= "deliveryPeriodEnd"::DATE)
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_instance_template_schedule ON "Forecasts"."CurveInstanceTemplate"("scheduleId");
CREATE INDEX IF NOT EXISTS idx_instance_template_delivery ON "Forecasts"."CurveInstanceTemplate"("deliveryPeriodStart", "deliveryPeriodEnd");

-- ========== STEP 2: ENHANCED FUNCTIONS ==========

-- Function to preview schedule creation without creating records
CREATE OR REPLACE FUNCTION "Forecasts".preview_schedule_creation(
    -- Required Curve Definition params
    p_market VARCHAR,
    p_location VARCHAR,
    p_product VARCHAR,
    p_curve_type VARCHAR, -- Can be enum value or custom
    
    -- Required Instance Template params
    p_delivery_start TIMESTAMPTZ,
    p_delivery_end TIMESTAMPTZ,
    
    -- Optional Curve Definition params
    p_battery_duration VARCHAR DEFAULT 'UNKNOWN',
    p_scenario VARCHAR DEFAULT 'BASE',
    p_degradation_type VARCHAR DEFAULT 'NONE',
    
    -- Optional Instance Template params
    p_degradation_start_date DATE DEFAULT NULL,
    p_granularity VARCHAR DEFAULT 'MONTHLY',
    p_instance_version VARCHAR DEFAULT 'v1',
    
    -- Optional Schedule params
    p_frequency "Forecasts"."UpdateFrequency" DEFAULT 'MONTHLY',
    p_day_of_week INTEGER DEFAULT NULL,
    p_day_of_month INTEGER DEFAULT NULL,
    p_time_of_day TIME DEFAULT '09:00:00',
    p_freshness_days INTEGER DEFAULT 30,
    p_responsible_team VARCHAR DEFAULT 'Market Analysis',
    p_importance INTEGER DEFAULT 3,
    p_created_by VARCHAR DEFAULT 'system'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_curve_name VARCHAR(255);
    v_existing_definition_id INTEGER;
    v_is_custom_curve_type BOOLEAN;
    v_is_custom_battery BOOLEAN;
    v_is_custom_scenario BOOLEAN;
    v_is_custom_degradation BOOLEAN;
    v_preview JSON;
BEGIN
    -- Generate standardized curve name
    v_curve_name := UPPER(CONCAT(
        REPLACE(p_market, ' ', '_'), '_',
        REPLACE(p_location, ' ', '_'), '_',
        REPLACE(p_curve_type, ' ', '_'), '_',
        REPLACE(p_battery_duration, ' ', '_'), '_',
        REPLACE(p_scenario, ' ', '_')
    ));
    
    -- Check for existing definition
    SELECT cd."id" INTO v_existing_definition_id
    FROM "Forecasts"."CurveDefinition" cd
    WHERE cd."market" = p_market
      AND cd."location" = p_location
      AND cd."product" = p_product
      AND cd."curveType"::TEXT = p_curve_type
      AND cd."batteryDuration"::TEXT = p_battery_duration
      AND cd."scenario"::TEXT = p_scenario
      AND cd."degradationType"::TEXT = p_degradation_type
      AND cd."isActive" = true;
    
    -- Check if values are custom (not in enum)
    v_is_custom_curve_type := NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'CurveType' AND e.enumlabel = p_curve_type
    );
    
    v_is_custom_battery := NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'BatteryDuration' AND e.enumlabel = p_battery_duration
    );
    
    v_is_custom_scenario := NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'ScenarioType' AND e.enumlabel = p_scenario
    );
    
    v_is_custom_degradation := NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'DegradationType' AND e.enumlabel = p_degradation_type
    );
    
    -- Build preview JSON
    v_preview := json_build_object(
        'curveDefinition', json_build_object(
            'id', v_existing_definition_id,
            'curveName', v_curve_name,
            'market', p_market,
            'location', p_location,
            'product', p_product,
            'curveType', p_curve_type,
            'batteryDuration', p_battery_duration,
            'scenario', p_scenario,
            'degradationType', p_degradation_type,
            'isExisting', v_existing_definition_id IS NOT NULL,
            'hasCustomValues', v_is_custom_curve_type OR v_is_custom_battery OR v_is_custom_scenario OR v_is_custom_degradation,
            'customFields', json_build_object(
                'curveType', v_is_custom_curve_type,
                'batteryDuration', v_is_custom_battery,
                'scenario', v_is_custom_scenario,
                'degradationType', v_is_custom_degradation
            )
        ),
        'schedule', json_build_object(
            'frequency', p_frequency,
            'dayOfWeek', p_day_of_week,
            'dayOfMonth', p_day_of_month,
            'timeOfDay', p_time_of_day,
            'freshnessDays', p_freshness_days,
            'responsibleTeam', p_responsible_team,
            'importance', p_importance,
            'nextDeliveryDue', CASE 
                WHEN p_frequency = 'DAILY' THEN CURRENT_DATE + INTERVAL '1 day'
                WHEN p_frequency = 'WEEKLY' THEN CURRENT_DATE + INTERVAL '1 week'
                WHEN p_frequency = 'MONTHLY' THEN CURRENT_DATE + INTERVAL '1 month'
                ELSE CURRENT_DATE + INTERVAL '30 days'
            END
        ),
        'instanceTemplate', json_build_object(
            'deliveryPeriodStart', p_delivery_start,
            'deliveryPeriodEnd', p_delivery_end,
            'degradationStartDate', p_degradation_start_date,
            'granularity', p_granularity,
            'instanceVersion', p_instance_version,
            'deliveryDuration', EXTRACT(DAY FROM (p_delivery_end - p_delivery_start)),
            'degradationDaysFromStart', CASE 
                WHEN p_degradation_start_date IS NOT NULL 
                THEN EXTRACT(DAY FROM (p_degradation_start_date::TIMESTAMPTZ - p_delivery_start))
                ELSE NULL
            END
        ),
        'validation', json_build_object(
            'deliveryPeriodValid', p_delivery_end > p_delivery_start,
            'degradationDateValid', p_degradation_start_date IS NULL OR 
                (p_degradation_start_date >= p_delivery_start::DATE AND 
                 p_degradation_start_date <= p_delivery_end::DATE),
            'freshnessReasonable', p_freshness_days > 0 AND p_freshness_days <= 365
        ),
        'metadata', json_build_object(
            'createdBy', p_created_by,
            'previewGeneratedAt', CURRENT_TIMESTAMP
        )
    );
    
    RETURN v_preview;
END;
$$;

-- Enhanced function to create schedule with instance template
CREATE OR REPLACE FUNCTION "Forecasts".create_schedule_with_instance_template(
    -- Required Curve Definition params
    p_market VARCHAR,
    p_location VARCHAR,
    p_product VARCHAR,
    p_curve_type VARCHAR,
    
    -- Required Instance Template params
    p_delivery_start TIMESTAMPTZ,
    p_delivery_end TIMESTAMPTZ,
    
    -- Optional Curve Definition params
    p_battery_duration VARCHAR DEFAULT 'UNKNOWN',
    p_scenario VARCHAR DEFAULT 'BASE',
    p_degradation_type VARCHAR DEFAULT 'NONE',
    
    -- Optional Instance Template params
    p_degradation_start_date DATE DEFAULT NULL,
    p_granularity VARCHAR DEFAULT 'MONTHLY',
    p_instance_version VARCHAR DEFAULT 'v1',
    
    -- Optional Schedule params
    p_frequency "Forecasts"."UpdateFrequency" DEFAULT 'MONTHLY',
    p_day_of_week INTEGER DEFAULT NULL,
    p_day_of_month INTEGER DEFAULT NULL,
    p_time_of_day TIME DEFAULT '09:00:00',
    p_freshness_days INTEGER DEFAULT 30,
    p_responsible_team VARCHAR DEFAULT 'Market Analysis',
    p_importance INTEGER DEFAULT 3,
    p_created_by VARCHAR DEFAULT 'system'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_definition_id INTEGER;
    v_schedule_id INTEGER;
    v_template_id INTEGER;
    v_curve_name VARCHAR(255);
    v_enum_curve_type "Forecasts"."CurveType";
    v_enum_battery "Forecasts"."BatteryDuration";
    v_enum_scenario "Forecasts"."ScenarioType";
    v_enum_degradation "Forecasts"."DegradationType";
    v_result JSON;
BEGIN
    -- Validate delivery period
    IF p_delivery_end <= p_delivery_start THEN
        RAISE EXCEPTION 'Delivery end date must be after start date';
    END IF;
    
    -- Validate degradation date
    IF p_degradation_start_date IS NOT NULL AND 
       (p_degradation_start_date < p_delivery_start::DATE OR 
        p_degradation_start_date > p_delivery_end::DATE) THEN
        RAISE EXCEPTION 'Degradation start date must be within delivery period';
    END IF;
    
    -- Generate curve name
    v_curve_name := UPPER(CONCAT(
        REPLACE(p_market, ' ', '_'), '_',
        REPLACE(p_location, ' ', '_'), '_',
        REPLACE(p_curve_type, ' ', '_'), '_',
        REPLACE(p_battery_duration, ' ', '_'), '_',
        REPLACE(p_scenario, ' ', '_')
    ));
    
    -- Try to cast to enum types, use defaults if custom
    BEGIN
        v_enum_curve_type := p_curve_type::"Forecasts"."CurveType";
    EXCEPTION WHEN OTHERS THEN
        v_enum_curve_type := 'OTHER'::"Forecasts"."CurveType";
    END;
    
    BEGIN
        v_enum_battery := p_battery_duration::"Forecasts"."BatteryDuration";
    EXCEPTION WHEN OTHERS THEN
        v_enum_battery := 'OTHER'::"Forecasts"."BatteryDuration";
    END;
    
    BEGIN
        v_enum_scenario := p_scenario::"Forecasts"."ScenarioType";
    EXCEPTION WHEN OTHERS THEN
        v_enum_scenario := 'OTHER'::"Forecasts"."ScenarioType";
    END;
    
    BEGIN
        v_enum_degradation := p_degradation_type::"Forecasts"."DegradationType";
    EXCEPTION WHEN OTHERS THEN
        v_enum_degradation := 'OTHER'::"Forecasts"."DegradationType";
    END;
    
    -- Find or create curve definition
    SELECT cd."id" INTO v_definition_id
    FROM "Forecasts"."CurveDefinition" cd
    WHERE cd."market" = p_market
      AND cd."location" = p_location
      AND cd."product" = p_product
      AND cd."curveType" = v_enum_curve_type
      AND cd."batteryDuration" = v_enum_battery
      AND cd."scenario" = v_enum_scenario
      AND cd."degradationType" = v_enum_degradation
      AND cd."isActive" = true;
    
    -- Create definition if not found
    IF v_definition_id IS NULL THEN
        INSERT INTO "Forecasts"."CurveDefinition" (
            "curveName", "market", "location", "product",
            "curveType", "batteryDuration", "scenario", "degradationType",
            "commodity", "units", "timezone", "description", "createdBy"
        ) VALUES (
            v_curve_name, p_market, p_location, p_product,
            v_enum_curve_type, v_enum_battery, v_enum_scenario, v_enum_degradation,
            'Energy',
            CASE WHEN v_enum_curve_type = 'REVENUE' THEN '$' ELSE '$/MWh' END,
            CASE WHEN p_market = 'CAISO' THEN 'America/Los_Angeles'
                 WHEN p_market = 'ERCOT' THEN 'America/Chicago'
                 ELSE 'UTC' END,
            'Enhanced schedule with instance template',
            p_created_by
        )
        RETURNING "id" INTO v_definition_id;
    END IF;
    
    -- Create schedule
    INSERT INTO "Forecasts"."CurveSchedule" (
        "curveDefinitionId", "scheduleType", "frequency",
        "dayOfWeek", "dayOfMonth", "timeOfDay", "freshnessDays",
        "responsibleTeam", "importance", "isActive"
    ) VALUES (
        v_definition_id, 'REGULAR', p_frequency,
        p_day_of_week, p_day_of_month, p_time_of_day, p_freshness_days,
        p_responsible_team, p_importance, true
    )
    RETURNING "id" INTO v_schedule_id;
    
    -- Create instance template
    INSERT INTO "Forecasts"."CurveInstanceTemplate" (
        "scheduleId", "deliveryPeriodStart", "deliveryPeriodEnd",
        "degradationStartDate", granularity, "instanceVersion",
        "customCurveType", "customBatteryDuration", "customScenario", "customDegradeType",
        "createdBy"
    ) VALUES (
        v_schedule_id, p_delivery_start, p_delivery_end,
        p_degradation_start_date, p_granularity, p_instance_version,
        CASE WHEN v_enum_curve_type = 'OTHER' THEN p_curve_type ELSE NULL END,
        CASE WHEN v_enum_battery = 'OTHER' THEN p_battery_duration ELSE NULL END,
        CASE WHEN v_enum_scenario = 'OTHER' THEN p_scenario ELSE NULL END,
        CASE WHEN v_enum_degradation = 'OTHER' THEN p_degradation_type ELSE NULL END,
        p_created_by
    )
    RETURNING "id" INTO v_template_id;
    
    -- Return result
    v_result := json_build_object(
        'scheduleId', v_schedule_id,
        'definitionId', v_definition_id,
        'templateId', v_template_id,
        'curveName', v_curve_name,
        'createdAt', CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Created enhanced schedule: % with template: %', v_schedule_id, v_template_id;
    
    RETURN v_result;
END;
$$;

COMMIT;

-- ========== VERIFICATION ==========
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===== ENHANCED SCHEDULE WORKFLOW READY =====';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - CurveInstanceTemplate table';
    RAISE NOTICE '  - preview_schedule_creation() function';
    RAISE NOTICE '  - create_schedule_with_instance_template() function';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - Mixed CurveDefinition + CurveInstance data';
    RAISE NOTICE '  - Custom enum value support';
    RAISE NOTICE '  - Preview functionality';
    RAISE NOTICE '  - Comprehensive validation';
    RAISE NOTICE '';
END $$; 