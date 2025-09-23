import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

// Validation schema for creating a curve instance
const createInstanceSchema = z.object({
  curveDefinitionId: z.number(),
  deliveryPeriodStart: z.string().transform(str => new Date(str)),
  deliveryPeriodEnd: z.string().transform(str => new Date(str)),
  modelType: z.string().optional().default('FUNDAMENTAL'),
  notes: z.string().optional(),
  priceData: z.array(z.object({
    timestamp: z.string().transform(str => new Date(str)),
    value: z.number(),
    valueHigh: z.number().optional(),
    valueLow: z.number().optional()
  })).optional().default([]),
  inputLineage: z.array(z.object({
    inputType: z.enum([
      'WEATHER_FORECAST', 'WEATHER_ACTUAL', 'DEMAND_FORECAST', 'DEMAND_ACTUAL',
      'GENERATION_FORECAST', 'GENERATION_ACTUAL', 'TRANSMISSION_LIMITS',
      'FUEL_PRICES', 'HYDRO_CONDITIONS', 'RENEWABLE_FORECAST',
      'MARKET_FUNDAMENTALS', 'REGULATORY_CHANGES', 'OTHER'
    ]),
    inputSource: z.string(),
    inputIdentifier: z.string(),
    inputVersion: z.string().optional(),
    inputTimestamp: z.string().transform(str => new Date(str)),
    usageType: z.enum(['PRIMARY', 'VALIDATION', 'REFERENCE', 'FALLBACK']).default('PRIMARY'),
    weight: z.number().optional()
  })).optional().default([])
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createInstanceSchema.parse(body);
    
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find any existing active instance for this delivery period
      const existingInstance = await tx.$queryRaw<any[]>`
        SELECT * FROM "CurveInstance"
        WHERE "curve_definition_id" = ${validatedData.curveDefinitionId}
          AND "deliveryPeriodStart" = ${validatedData.deliveryPeriodStart}
          AND "freshnessEndDate" IS NULL
          AND status = 'ACTIVE'
        ORDER BY id DESC
        LIMIT 1
      `;
      
      // Calculate new version
      let versionNumber = 1;
      let previousInstanceId = null;
      
      if (existingInstance && existingInstance.length > 0) {
        previousInstanceId = existingInstance[0].id;
        const versionMatch = existingInstance[0].instanceVersion.match(/v(\d+)/);
        if (versionMatch) {
          versionNumber = parseInt(versionMatch[1]) + 1;
        }
      }
      
      const newVersion = `v${versionNumber}`;
      
      // Expire previous instance
      if (previousInstanceId) {
        await tx.$executeRaw`
          UPDATE "CurveInstance"
          SET "freshnessEndDate" = NOW(),
              status = 'SUPERSEDED'::"InstanceStatus",
              "updatedAt" = NOW()
          WHERE id = ${previousInstanceId}
        `;
      }
      
      // Create new instance
      const newInstance = await tx.$queryRaw<any[]>`
        INSERT INTO "CurveInstance" (
          "curve_definition_id",
          "instanceVersion",
          "deliveryPeriodStart",
          "deliveryPeriodEnd",
          "forecastRunDate",
          "freshnessStartDate",
          "freshnessEndDate",
          status,
          "modelType",
          "runType",
          "createdBy",
          notes
        ) VALUES (
          ${validatedData.curveDefinitionId},
          ${newVersion},
          ${validatedData.deliveryPeriodStart},
          ${validatedData.deliveryPeriodEnd},
          NOW(),
          NOW(),
          NULL,
          'ACTIVE'::"InstanceStatus",
          ${validatedData.modelType},
          'MANUAL'::"RunType",
          'api_user',
          ${validatedData.notes || null}
        )
        RETURNING *
      `;
      
      const instanceId = newInstance[0].id;
      
      // Insert price data if provided
      if (validatedData.priceData.length > 0) {
        const priceValues = validatedData.priceData.map(p => 
          `(${instanceId}, '${p.timestamp.toISOString()}', ${p.value}, ${p.valueHigh || 'NULL'}, ${p.valueLow || 'NULL'})`
        ).join(',');
        
        await tx.$executeRawUnsafe(`
          INSERT INTO "PriceForecast" (
            "curve_instance_id", "timestamp", "value", "valueHigh", "valueLow"
          ) VALUES ${priceValues}
        `);
      }
      
      // Insert lineage data if provided
      if (validatedData.inputLineage.length > 0) {
        for (const input of validatedData.inputLineage) {
          await tx.$executeRaw`
            INSERT INTO "CurveInputLineage" (
              "curve_instance_id",
              "inputType",
              "inputSource",
              "inputIdentifier",
              "inputVersion",
              "inputTimestamp",
              "usageType",
              "weight"
            ) VALUES (
              ${instanceId},
              ${input.inputType}::"InputType",
              ${input.inputSource},
              ${input.inputIdentifier},
              ${input.inputVersion || null},
              ${input.inputTimestamp},
              ${input.usageType}::"UsageType",
              ${input.weight || null}
            )
          `;
        }
      }
      
      // Create version history entry
      await tx.$executeRaw`
        INSERT INTO "VersionHistory" (
          "curve_instance_id",
          "previous_instance_id",
          "changeType",
          "changeReason",
          "changedBy"
        ) VALUES (
          ${instanceId},
          ${previousInstanceId},
          ${previousInstanceId ? 'UPDATE' : 'INITIAL'}::"ChangeType",
          'Created via API',
          'api_user'
        )
      `;
      
      // Get the complete instance with counts
      const completeInstance = await tx.$queryRaw<{
        id: number;
        curve_definition_id: number;
        instanceVersion: string;
        deliveryPeriodStart: Date;
        deliveryPeriodEnd: Date;
        status: string;
        curveName: string;
        market: string;
        location: string;
        price_count: bigint;
        lineage_count: bigint;
      }[]>`
        SELECT 
          ci.*,
          cd."curveName",
          cd."market",
          cd."location",
          (SELECT COUNT(*) FROM "PriceForecast" WHERE "curve_instance_id" = ci.id) as price_count,
          (SELECT COUNT(*) FROM "CurveInputLineage" WHERE "curve_instance_id" = ci.id) as lineage_count
        FROM "CurveInstance" ci
        JOIN "CurveDefinition" cd ON cd.id = ci."curve_definition_id"
        WHERE ci.id = ${instanceId}
      `;
      
      return {
        newInstance: completeInstance[0],
        previousInstanceId,
        versionNumber
      };
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: `Created curve instance version ${result.versionNumber}`,
      instance: {
        id: result.newInstance.id,
        instanceVersion: result.newInstance.instanceVersion,
        curveDefinitionId: result.newInstance.curve_definition_id,
        curveName: result.newInstance.curveName,
        market: result.newInstance.market,
        location: result.newInstance.location,
        deliveryPeriodStart: result.newInstance.deliveryPeriodStart,
        deliveryPeriodEnd: result.newInstance.deliveryPeriodEnd,
        status: result.newInstance.status,
        priceCount: Number(result.newInstance.price_count),
        lineageCount: Number(result.newInstance.lineage_count)
      },
      previousInstanceId: result.previousInstanceId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating curve instance:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Invalid input data',
        details: error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Failed to create curve instance',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 