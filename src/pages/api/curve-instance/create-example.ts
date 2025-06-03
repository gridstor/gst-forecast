import type { APIRoute } from 'astro';

/**
 * Example API endpoint demonstrating how to create a curve instance
 * in the new architecture. This is a conceptual implementation.
 */

interface CreateInstanceRequest {
  curveDefinitionId: number;
  deliveryDate: string;
  modelType: 'HISTORICAL' | 'QUANTITATIVE' | 'FUNDAMENTAL';
  forecastData: Array<{
    timestamp: string;
    value: number;
    confidence?: number;
  }>;
  inputs: Array<{
    type: string;
    source: string;
    identifier: string;
    version?: string;
    weight?: number;
  }>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: CreateInstanceRequest = await request.json();

    // In the new architecture, this would:
    // 1. Find any existing active instance for this delivery period
    // 2. Create a new version number
    // 3. Expire the old instance
    // 4. Create the new instance with lineage

    const conceptualFlow = {
      steps: [
        {
          action: "Find existing instance",
          query: `
            SELECT * FROM CurveInstance 
            WHERE curveDefinitionId = ${body.curveDefinitionId}
              AND deliveryPeriodStart = '${body.deliveryDate}'
              AND freshnessEndDate IS NULL
              AND status = 'ACTIVE'
          `
        },
        {
          action: "Calculate new version",
          logic: "If exists: increment version, else: v1"
        },
        {
          action: "Expire previous instance",
          update: `
            UPDATE CurveInstance 
            SET freshnessEndDate = NOW(), 
                status = 'SUPERSEDED'
            WHERE id = previousInstanceId
          `
        },
        {
          action: "Create new instance",
          data: {
            curveDefinitionId: body.curveDefinitionId,
            instanceVersion: "v2",
            deliveryPeriodStart: body.deliveryDate,
            deliveryPeriodEnd: body.deliveryDate,
            forecastRunDate: new Date(),
            freshnessStartDate: new Date(),
            freshnessEndDate: null,
            status: "ACTIVE",
            modelType: body.modelType,
            runType: "MANUAL",
            createdBy: "api_user"
          }
        },
        {
          action: "Insert price forecasts",
          data: body.forecastData.map(point => ({
            curveInstanceId: "newInstanceId",
            timestamp: point.timestamp,
            value: point.value,
            confidence: point.confidence
          }))
        },
        {
          action: "Record input lineage",
          data: body.inputs.map(input => ({
            curveInstanceId: "newInstanceId",
            inputType: input.type,
            inputSource: input.source,
            inputIdentifier: input.identifier,
            inputVersion: input.version,
            inputTimestamp: new Date(),
            usageType: "PRIMARY",
            weight: input.weight
          }))
        },
        {
          action: "Create version history",
          data: {
            curveInstanceId: "newInstanceId",
            previousInstanceId: "oldInstanceId",
            changeType: "UPDATE",
            changeReason: "API update",
            changedBy: "api_user"
          }
        }
      ]
    };

    // Example response showing what would be returned
    const exampleResponse = {
      success: true,
      instance: {
        id: 1234,
        instanceVersion: "v2",
        curveDefinitionId: body.curveDefinitionId,
        deliveryPeriodStart: body.deliveryDate,
        deliveryPeriodEnd: body.deliveryDate,
        forecastRunDate: new Date().toISOString(),
        freshnessStartDate: new Date().toISOString(),
        freshnessEndDate: null,
        status: "ACTIVE",
        modelType: body.modelType,
        _count: {
          priceForecasts: body.forecastData.length,
          inputLineage: body.inputs.length
        }
      },
      previousInstance: {
        id: 1233,
        instanceVersion: "v1",
        status: "SUPERSEDED",
        freshnessEndDate: new Date().toISOString()
      },
      conceptualFlow
    };

    return new Response(JSON.stringify(exampleResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to create curve instance',
      message: error instanceof Error ? error.message : 'Unknown error',
      note: 'This is a conceptual example of the new architecture'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 