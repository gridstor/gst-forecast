import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const {
      // Curve Definition fields
      market,
      location,
      product,
      curveType,
      batteryDuration = 'UNKNOWN',
      scenario = 'BASE',
      
      // Delivery Request fields
      dueDate,
      requestedBy,
      responsibleTeam = 'Analytics',
      priority = 3,
      deliveryFormat = 'CSV',
      deliveryNotes,
      
      // Technical Specification fields
      deliveryPeriodStart,
      deliveryPeriodEnd,
      degradationStartDate = null,
      granularity = 'MONTHLY',
      instanceVersion = 'v1'
    } = body;

    // Validate required fields
    if (!market || !location || !product || !curveType || !dueDate || !requestedBy || !responsibleTeam || !deliveryPeriodStart || !deliveryPeriodEnd) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: market, location, product, curveType, dueDate, requestedBy, responsibleTeam, deliveryPeriodStart, deliveryPeriodEnd' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validation logic
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    const deliveryStart = new Date(deliveryPeriodStart);
    const deliveryEnd = new Date(deliveryPeriodEnd);
    
    const validation = {
      dueDateValid: dueDateObj >= today,
      deliveryPeriodValid: deliveryEnd > deliveryStart,
      degradationDateValid: true, // Default to true
      allValid: true
    };

    // Validate degradation date if provided
    if (degradationStartDate) {
      const degradationDate = new Date(degradationStartDate);
      validation.degradationDateValid = degradationDate >= deliveryStart && degradationDate <= deliveryEnd;
    }

    validation.allValid = validation.dueDateValid && validation.deliveryPeriodValid && validation.degradationDateValid;

    // Calculate delivery duration
    const diffTime = Math.abs(deliveryEnd.getTime() - deliveryStart.getTime());
    const deliveryDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate days until due
    const daysUntilDue = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Build preview data
    const preview = {
      validation,
      
      curveDefinition: {
        curveName: `${market}_${location}_${product}_${curveType}_${batteryDuration}_${scenario}`.replace(/\s/g, '_').toUpperCase(),
        market,
        location,
        product,
        curveType,
        batteryDuration,
        scenario,
        isExisting: false, // Would need to check database to determine this
        hasCustomValues: [market, curveType, batteryDuration, scenario].some(val => val === 'CUSTOM')
      },
      
      deliveryRequest: {
        dueDate,
        requestedBy,
        responsibleTeam,
        priority,
        deliveryFormat,
        deliveryNotes,
        daysUntilDue,
        urgencyLevel: daysUntilDue <= 3 ? 'URGENT' : daysUntilDue <= 7 ? 'HIGH' : daysUntilDue <= 14 ? 'MEDIUM' : 'LOW'
      },
      
      deliverySpec: {
        deliveryPeriodStart,
        deliveryPeriodEnd,
        degradationStartDate,
        granularity,
        instanceVersion,
        deliveryFormat,
        deliveryDuration
      }
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        preview
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating delivery request preview:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 