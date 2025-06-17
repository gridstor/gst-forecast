import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const POST: APIRoute = async () => {
  try {
    console.log('🚀 Setting up delivery management tables...');

    // Create the delivery management tables using raw SQL
    await prisma.$executeRaw`
      -- Create delivery status enum if it doesn't exist
      DO $$ BEGIN
        CREATE TYPE "Forecasts"."DeliveryStatus" AS ENUM (
          'REQUESTED',
          'IN_PROGRESS', 
          'DELIVERED',
          'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      -- Create CurveDeliveryRequest table
      CREATE TABLE IF NOT EXISTS "Forecasts"."CurveDeliveryRequest" (
        "id" SERIAL PRIMARY KEY,
        "curveDefinitionId" INT NOT NULL,
        "deliveryStatus" "Forecasts"."DeliveryStatus" NOT NULL DEFAULT 'REQUESTED',
        "dueDate" DATE NOT NULL,
        "requestedBy" VARCHAR(100) NOT NULL,
        "responsibleTeam" VARCHAR(100) NOT NULL DEFAULT 'Analytics',
        "priority" INTEGER NOT NULL DEFAULT 3 CHECK ("priority" >= 1 AND "priority" <= 5),
        "notes" TEXT,
        "deliveredInstanceId" INTEGER,
        "requestDate" DATE NOT NULL DEFAULT CURRENT_DATE,
        "deliveryDate" DATE,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "metadata" JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(100),
        
        CONSTRAINT fk_delivery_curve_definition 
          FOREIGN KEY ("curveDefinitionId") REFERENCES "Forecasts"."CurveDefinition"("id"),
        CONSTRAINT fk_delivery_instance 
          FOREIGN KEY ("deliveredInstanceId") REFERENCES "Forecasts"."CurveInstance"("id")
      );
    `;

    await prisma.$executeRaw`
      -- Create CurveDeliverySpec table
      CREATE TABLE IF NOT EXISTS "Forecasts"."CurveDeliverySpec" (
        "id" SERIAL PRIMARY KEY,
        "deliveryRequestId" INT NOT NULL,
        "deliveryPeriodStart" TIMESTAMPTZ NOT NULL,
        "deliveryPeriodEnd" TIMESTAMPTZ NOT NULL,
        "degradationStartDate" DATE,
        "granularity" VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
        "instanceVersion" VARCHAR(50) NOT NULL DEFAULT 'v1',
        "deliveryFormat" VARCHAR(50) DEFAULT 'CSV',
        "specialRequirements" TEXT,
        "customCurveType" VARCHAR(100),
        "customBatteryDuration" VARCHAR(50),
        "customScenario" VARCHAR(100),
        "notes" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(100),
        
        CONSTRAINT fk_spec_delivery_request 
          FOREIGN KEY ("deliveryRequestId") REFERENCES "Forecasts"."CurveDeliveryRequest"("id") ON DELETE CASCADE
      );
    `;

    // Create indexes for performance (each in separate call)
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_delivery_request_curve_definition 
        ON "Forecasts"."CurveDeliveryRequest"("curveDefinitionId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_delivery_request_status 
        ON "Forecasts"."CurveDeliveryRequest"("deliveryStatus")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_delivery_request_due_date 
        ON "Forecasts"."CurveDeliveryRequest"("dueDate")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_delivery_request_team 
        ON "Forecasts"."CurveDeliveryRequest"("responsibleTeam")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_delivery_request_active 
        ON "Forecasts"."CurveDeliveryRequest"("isActive")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_delivery_spec_request 
        ON "Forecasts"."CurveDeliverySpec"("deliveryRequestId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_delivery_spec_period 
        ON "Forecasts"."CurveDeliverySpec"("deliveryPeriodStart", "deliveryPeriodEnd")
    `;

    // Create a sample delivery request for testing
    const sampleRequest = await prisma.$executeRaw`
      INSERT INTO "Forecasts"."CurveDeliveryRequest" (
        "curveDefinitionId",
        "deliveryStatus", 
        "dueDate",
        "requestedBy",
        "responsibleTeam",
        "priority",
        "notes",
        "createdBy"
      )
      SELECT 
        cd."id",
        'REQUESTED'::"Forecasts"."DeliveryStatus",
        (CURRENT_DATE + INTERVAL '7 days')::DATE,
        'System Setup',
        'Analytics',
        3,
        'Sample delivery request created during system setup',
        'system'
      FROM "Forecasts"."CurveDefinition" cd 
      LIMIT 1
      ON CONFLICT DO NOTHING;
    `;

    console.log('✅ Delivery management tables created successfully!');

    return new Response(JSON.stringify({
      success: true,
      message: 'Delivery management system set up successfully!',
      details: {
        tablesCreated: [
          'CurveDeliveryRequest',
          'CurveDeliverySpec',
          'DeliveryStatus enum'
        ],
        indexesCreated: 7,
        sampleDataCreated: true
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error setting up delivery management:', error);
    return new Response(JSON.stringify({
      error: 'Failed to set up delivery management system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 