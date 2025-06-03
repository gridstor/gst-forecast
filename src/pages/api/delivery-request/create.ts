import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const {
      // Definition handling
      definitionOption, // 'existing' or 'new'
      existingDefinitionId,
      
      // Curve Definition fields (for new definitions)
      market,
      location,
      product,
      curveType,
      batteryDuration = 'UNKNOWN',
      scenario = 'BASE',
      
      // Curve Instance fields
      curveCreator, // NEW FIELD
      instanceVersion = 'v1.0',
      granularity = 'MONTHLY',
      deliveryPeriodStart,
      deliveryPeriodEnd,
      modelType,
      degradationStartDate = null,
      
      // Delivery Request fields
      dueDate,
      requestedBy,
      priority = 3,
      responsibleTeam = 'Analytics',
      deliveryFormat = 'CSV',
      notes,
      
      // Metadata
      createdBy = 'system'
    } = body;

    // Validate required fields
    if (!deliveryPeriodStart || !deliveryPeriodEnd || !dueDate || !requestedBy || !curveCreator) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: deliveryPeriodStart, deliveryPeriodEnd, dueDate, requestedBy, curveCreator' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate definition option
    if (!definitionOption || !['existing', 'new'].includes(definitionOption)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or missing definitionOption. Must be "existing" or "new"' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Additional validation based on definition option
    if (definitionOption === 'existing' && !existingDefinitionId) {
      return new Response(
        JSON.stringify({ 
          error: 'existingDefinitionId is required when using existing definition' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (definitionOption === 'new' && (!market || !location || !product || !curveType)) {
      return new Response(
        JSON.stringify({ 
          error: 'market, location, product, and curveType are required for new definitions' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate delivery period
    const deliveryStart = new Date(deliveryPeriodStart);
    const deliveryEnd = new Date(deliveryPeriodEnd);
    const dueDateObj = new Date(dueDate);
    
    if (deliveryEnd <= deliveryStart) {
      return new Response(
        JSON.stringify({ 
          error: 'Delivery end date must be after start date' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (dueDateObj < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: 'Due date cannot be in the past' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      let curveDefinition;

      // Step 1: Handle Curve Definition
      if (definitionOption === 'existing') {
        // Use existing definition
        curveDefinition = await tx.curveDefinition.findUnique({
          where: { id: parseInt(existingDefinitionId) }
        });

        if (!curveDefinition) {
          throw new Error(`Curve definition with ID ${existingDefinitionId} not found`);
        }
      } else {
        // Create new definition
        // Generate curve name if not provided
        const curveName = `${market}_${location}_${product}_${curveType}_${batteryDuration}_${scenario}`.replace(/\s+/g, '_');

        // Check if definition with this name already exists
        const existingDef = await tx.curveDefinition.findUnique({
          where: { curveName }
        });

        if (existingDef) {
          // Use existing definition instead of creating duplicate
          curveDefinition = existingDef;
        } else {
          // Create new definition
          curveDefinition = await tx.curveDefinition.create({
            data: {
              curveName,
              market,
              location,
              product,
              curveType,
              batteryDuration,
              scenario,
              degradationType: 'NONE', // Default, will be handled at instance level
              commodity: 'Energy',
              units: '$/MWh',
              timezone: 'UTC',
              description: `${curveType} curve for ${market} ${location} ${product}`,
              isActive: true,
              createdBy
            }
          });
        }
      }

      // Step 2: Create Delivery Request
      const deliveryRequest = await tx.$queryRaw`
        INSERT INTO "Forecasts"."CurveDeliveryRequest" (
          "curveDefinitionId",
          "deliveryStatus",
          "dueDate",
          "requestedBy",
          "responsibleTeam",
          "priority",
          "notes",
          "requestDate",
          "isActive",
          "createdBy"
        ) VALUES (
          ${curveDefinition.id},
          'REQUESTED'::"Forecasts"."DeliveryStatus",
          ${dueDateObj}::DATE,
          ${requestedBy},
          ${responsibleTeam},
          ${priority},
          ${notes || ''},
          CURRENT_DATE,
          true,
          ${createdBy}
        )
        RETURNING "id", "deliveryStatus", "dueDate", "requestedBy"
      `;

      const deliveryRequestData = (deliveryRequest as any)[0];

      // Step 3: Create Delivery Specification
      const deliverySpec = await tx.$queryRaw`
        INSERT INTO "Forecasts"."CurveDeliverySpec" (
          "deliveryRequestId",
          "deliveryPeriodStart",
          "deliveryPeriodEnd",
          "degradationStartDate",
          "granularity",
          "instanceVersion",
          "deliveryFormat",
          "specialRequirements",
          "createdBy"
        ) VALUES (
          ${deliveryRequestData.id},
          ${deliveryStart}::TIMESTAMPTZ,
          ${deliveryEnd}::TIMESTAMPTZ,
          ${degradationStartDate ? new Date(degradationStartDate) : null}::DATE,
          ${granularity},
          ${instanceVersion},
          ${deliveryFormat},
          ${JSON.stringify({
            curveCreator,
            modelType: modelType || null,
            notes: notes || null
          })},
          ${createdBy}
        )
        RETURNING "id", "deliveryPeriodStart", "deliveryPeriodEnd", "granularity"
      `;

      const deliverySpecData = (deliverySpec as any)[0];

      return {
        deliveryRequestId: deliveryRequestData.id,
        deliverySpecId: deliverySpecData.id,
        curveDefinitionId: curveDefinition.id,
        curveDefinitionName: curveDefinition.curveName,
        deliveryStatus: deliveryRequestData.deliveryStatus,
        dueDate: deliveryRequestData.dueDate,
        isNewCurveDefinition: definitionOption === 'new',
        definitionUsed: definitionOption
      };
    });

    // Convert BigInt values to strings for JSON serialization
    const safeResult = JSON.parse(JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return new Response(
      JSON.stringify({ 
        success: true,
        deliveryRequestId: safeResult.deliveryRequestId,
        message: `Delivery request created successfully. ${safeResult.isNewCurveDefinition ? 'New curve definition created.' : 'Using existing curve definition.'}`,
        result: safeResult
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating delivery request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create delivery request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}; 