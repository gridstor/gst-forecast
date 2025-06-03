-- =====================================================
-- ADD CURVE CREATOR FIELD TO CURVE INSTANCE
-- Add field to track who will create the specific curve instance
-- =====================================================

BEGIN;

-- Add curveCreator field to CurveInstance table
ALTER TABLE "Forecasts"."CurveInstance" 
ADD COLUMN IF NOT EXISTS "curveCreator" VARCHAR(255);

-- Add helpful comment
COMMENT ON COLUMN "Forecasts"."CurveInstance"."curveCreator" IS 
'Who will create this specific curve instance (analyst, team member, etc.)';

-- Update the delivery management view to include curve creator
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
    
    -- Instance info if delivered (including curve creator)
    ci."id" as delivered_instance_id,
    ci."instanceVersion" as delivered_version,
    ci."curveCreator" as curve_creator,
    ci."createdAt" as delivered_at
    
FROM "Forecasts"."CurveDeliveryRequest" dr
JOIN "Forecasts"."CurveDefinition" cd ON dr."curveDefinitionId" = cd."id"
LEFT JOIN "Forecasts"."CurveDeliverySpec" ds ON ds."deliveryRequestId" = dr."id"
LEFT JOIN "Forecasts"."CurveInstance" ci ON dr."deliveredInstanceId" = ci."id"
WHERE dr."isActive" = true
ORDER BY dr."dueDate" ASC, dr."priority" DESC;

COMMIT; 