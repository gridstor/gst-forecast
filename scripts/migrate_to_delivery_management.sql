-- =====================================================
-- MIGRATION: SCHEDULE SYSTEM → DELIVERY MANAGEMENT SYSTEM
-- Transform recurring schedule tracking into one-time delivery commitment tracking
-- =====================================================

BEGIN;

-- ========== STEP 1: CREATE NEW DELIVERY STATUS ENUM ==========
CREATE TYPE "Forecasts"."DeliveryStatus" AS ENUM (
    'REQUESTED',      -- Initial delivery request received
    'IN_PROGRESS',    -- Work started on the delivery
    'DELIVERED',      -- Curve instance completed and delivered
    'CANCELLED'       -- Delivery request cancelled
);

-- ========== STEP 2: BACKUP EXISTING SCHEDULE DATA ==========
-- Create backup table for existing schedule data
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveSchedule_Backup" AS 
SELECT * FROM "Forecasts"."CurveSchedule";

-- ========== STEP 3: CREATE NEW DELIVERY MANAGEMENT TABLES ==========

-- Main table: Track delivery commitments (was CurveSchedule)
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveDeliveryRequest" (
    "id" SERIAL PRIMARY KEY,
    "curveDefinitionId" INT NOT NULL,
    "deliveryStatus" "Forecasts"."DeliveryStatus" NOT NULL DEFAULT 'REQUESTED',
    "dueDate" DATE NOT NULL,  -- When this delivery is due
    "requestedBy" VARCHAR(100) NOT NULL,  -- Who requested this delivery
    "responsibleTeam" VARCHAR(100) NOT NULL DEFAULT 'Analytics',
    "priority" INTEGER NOT NULL DEFAULT 3 CHECK ("priority" >= 1 AND "priority" <= 5),
    "notes" TEXT,  -- Delivery context and requirements
    "deliveredInstanceId" INTEGER,  -- Links to the curve instance that fulfilled this request
    "requestDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "deliveryDate" DATE,  -- When actually delivered
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(100),
    
    -- Relations
    CONSTRAINT fk_delivery_curve_definition 
        FOREIGN KEY ("curveDefinitionId") REFERENCES "Forecasts"."CurveDefinition"("id"),
    CONSTRAINT fk_delivery_instance 
        FOREIGN KEY ("deliveredInstanceId") REFERENCES "Forecasts"."CurveInstance"("id")
);

-- Delivery specification (was CurveInstanceTemplate)
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveDeliverySpec" (
    "id" SERIAL PRIMARY KEY,
    "deliveryRequestId" INT NOT NULL,
    "deliveryPeriodStart" TIMESTAMPTZ NOT NULL,
    "deliveryPeriodEnd" TIMESTAMPTZ NOT NULL,
    "degradationStartDate" DATE,
    "granularity" VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    "instanceVersion" VARCHAR(50) NOT NULL DEFAULT 'v1',
    "deliveryFormat" VARCHAR(50) DEFAULT 'CSV',  -- How client wants the data
    "specialRequirements" TEXT,  -- Any special delivery requirements
    
    -- Custom enum values (for flexibility)
    "customCurveType" VARCHAR(100),
    "customBatteryDuration" VARCHAR(50),
    "customScenario" VARCHAR(100),
    
    -- Metadata
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(100),
    
    -- Relations
    CONSTRAINT fk_spec_delivery_request 
        FOREIGN KEY ("deliveryRequestId") REFERENCES "Forecasts"."CurveDeliveryRequest"("id") ON DELETE CASCADE
);

-- ========== STEP 4: CREATE INDEXES ==========
CREATE INDEX idx_delivery_request_curve_definition ON "Forecasts"."CurveDeliveryRequest"("curveDefinitionId");
CREATE INDEX idx_delivery_request_status ON "Forecasts"."CurveDeliveryRequest"("deliveryStatus");
CREATE INDEX idx_delivery_request_due_date ON "Forecasts"."CurveDeliveryRequest"("dueDate");
CREATE INDEX idx_delivery_request_team ON "Forecasts"."CurveDeliveryRequest"("responsibleTeam");
CREATE INDEX idx_delivery_request_active ON "Forecasts"."CurveDeliveryRequest"("isActive");

CREATE INDEX idx_delivery_spec_request ON "Forecasts"."CurveDeliverySpec"("deliveryRequestId");
CREATE INDEX idx_delivery_spec_period ON "Forecasts"."CurveDeliverySpec"("deliveryPeriodStart", "deliveryPeriodEnd");

-- ========== STEP 5: MIGRATE EXISTING DATA ==========
-- Convert existing schedules to delivery requests
-- Note: This is a one-time conversion, schedule recurring logic will be removed

INSERT INTO "Forecasts"."CurveDeliveryRequest" (
    "curveDefinitionId",
    "deliveryStatus",
    "dueDate",
    "requestedBy",
    "responsibleTeam", 
    "priority",
    "notes",
    "requestDate",
    "metadata",
    "createdAt",
    "updatedAt",
    "createdBy"
)
SELECT 
    cs."curveDefinitionId",
    'REQUESTED'::"Forecasts"."DeliveryStatus",
    -- Set due date to 30 days from now for existing schedules
    (CURRENT_DATE + INTERVAL '30 days')::DATE,
    'Legacy Migration',
    cs."responsibleTeam",
    cs."importance",
    'Migrated from recurring schedule - frequency was: ' || cs."frequency"::TEXT,
    CURRENT_DATE,
    cs."metadata",
    cs."createdAt",
    cs."updatedAt",
    'system'
FROM "Forecasts"."CurveSchedule" cs
WHERE cs."isActive" = true;

-- Convert existing instance templates to delivery specs
INSERT INTO "Forecasts"."CurveDeliverySpec" (
    "deliveryRequestId",
    "deliveryPeriodStart",
    "deliveryPeriodEnd", 
    "degradationStartDate",
    "granularity",
    "instanceVersion",
    "customCurveType",
    "customBatteryDuration",
    "customScenario",
    "notes",
    "createdAt",
    "updatedAt",
    "createdBy"
)
SELECT 
    dr."id", -- New delivery request ID
    cit."deliveryPeriodStart",
    cit."deliveryPeriodEnd",
    cit."degradationStartDate",
    cit."granularity",
    cit."instanceVersion",
    cit."customCurveType",
    cit."customBatteryDuration",
    cit."customScenario",
    'Migrated from instance template',
    cit."createdAt",
    cit."updatedAt",
    cit."createdBy"
FROM "Forecasts"."CurveInstanceTemplate" cit
JOIN "Forecasts"."CurveSchedule" cs ON cit."scheduleId" = cs."id"
JOIN "Forecasts"."CurveDeliveryRequest" dr ON dr."curveDefinitionId" = cs."curveDefinitionId"
WHERE cs."isActive" = true;

-- ========== STEP 6: CREATE VIEWS FOR DELIVERY MANAGEMENT ==========

-- Main delivery management view
CREATE OR REPLACE VIEW "Forecasts".delivery_management AS
SELECT 
    dr."id" as delivery_request_id,
    dr."deliveryStatus",
    dr."dueDate",
    dr."requestedBy",
    dr."responsibleTeam",
    dr."priority",
    dr."notes",
    dr."requestDate",
    dr."deliveryDate",
    
    -- Curve information
    cd."curveName",
    cd."market",
    cd."location", 
    cd."product",
    cd."curveType",
    cd."batteryDuration",
    cd."scenario",
    
    -- Delivery spec
    ds."deliveryPeriodStart",
    ds."deliveryPeriodEnd",
    ds."degradationStartDate",
    ds."granularity",
    ds."instanceVersion",
    ds."deliveryFormat",
    
    -- Status calculations
    CASE 
        WHEN dr."dueDate" < CURRENT_DATE AND dr."deliveryStatus" = 'REQUESTED' THEN 'OVERDUE'
        WHEN dr."dueDate" <= CURRENT_DATE + INTERVAL '3 days' AND dr."deliveryStatus" = 'REQUESTED' THEN 'DUE_SOON'
        ELSE dr."deliveryStatus"::TEXT
    END as status_with_urgency,
    
    (dr."dueDate" - CURRENT_DATE) as days_until_due,
    
    -- Instance info if delivered
    ci."id" as delivered_instance_id,
    ci."instanceVersion" as delivered_version,
    ci."createdAt" as delivered_at
    
FROM "Forecasts"."CurveDeliveryRequest" dr
JOIN "Forecasts"."CurveDefinition" cd ON dr."curveDefinitionId" = cd."id"
LEFT JOIN "Forecasts"."CurveDeliverySpec" ds ON ds."deliveryRequestId" = dr."id"
LEFT JOIN "Forecasts"."CurveInstance" ci ON dr."deliveredInstanceId" = ci."id"
WHERE dr."isActive" = true
ORDER BY dr."dueDate" ASC, dr."priority" DESC;

-- ========== STEP 7: ADD COMMENTS ==========
COMMENT ON TABLE "Forecasts"."CurveDeliveryRequest" IS 
'Tracks one-time curve delivery commitments. Each row represents a promise to deliver specific curve data by a due date.';

COMMENT ON TABLE "Forecasts"."CurveDeliverySpec" IS 
'Specifies the technical requirements for a curve delivery (period, granularity, format, etc.)';

COMMENT ON COLUMN "Forecasts"."CurveDeliveryRequest"."dueDate" IS 
'When this delivery is due to the client/requestor';

COMMENT ON COLUMN "Forecasts"."CurveDeliveryRequest"."requestedBy" IS 
'Who requested this delivery (client, team member, etc.)';

COMMENT ON COLUMN "Forecasts"."CurveDeliveryRequest"."deliveredInstanceId" IS 
'Links to the CurveInstance that fulfilled this delivery request';

COMMENT ON COLUMN "Forecasts"."CurveDeliveryRequest"."notes" IS 
'Free-text field for delivery context, requirements, and special instructions';

-- Migration completed successfully!
-- NEXT STEPS:
-- 1. Update UI to focus on delivery requests instead of schedules
-- 2. Remove recurring schedule logic from frontend
-- 3. Add delivery tracking workflow
-- 4. Test delivery request creation and fulfillment

COMMIT; 