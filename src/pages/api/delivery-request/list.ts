import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('Delivery request list endpoint called');
    
    // Check if delivery tables exist
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'Forecasts' 
          AND table_name = 'CurveDeliveryRequest'
        ) as table_exists
      `;
      
      const tableExists = (tableCheck as any)[0]?.table_exists;
      
      if (!tableExists) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Delivery management tables not found',
          setupRequired: true,
          message: 'The delivery management system needs to be set up. Click the button below to initialize it.',
          setupInstructions: [
            'The CurveDeliveryRequest and CurveDeliverySpec tables need to be created',
            'This is a one-time setup process',
            'Existing data will not be affected'
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error: any) {
      console.error('Error checking table existence:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Database connection issue',
        setupRequired: true,
        message: 'Unable to verify delivery management tables. Please set up the system.',
        setupInstructions: [
          'Database connection may be unstable',
          'Try setting up the delivery management system',
          'Contact support if issues persist'
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Tables exist, fetch delivery requests
    const deliveryRequests = await prisma.$queryRaw`
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
        cd."scenario"
        
      FROM "Forecasts"."CurveDeliveryRequest" dr
      JOIN "Forecasts"."CurveDefinition" cd ON dr."curveDefinitionId" = cd."id"
      WHERE dr."isActive" = true
      ORDER BY dr."dueDate" ASC, dr."priority" DESC
    `;

    // Cast to proper type for calculations
    const requests = deliveryRequests as any[];
    
    // Calculate summary statistics
    const stats = {
      total: requests.length,
      requested: requests.filter((req: any) => req.deliveryStatus === 'REQUESTED').length,
      inProgress: requests.filter((req: any) => req.deliveryStatus === 'IN_PROGRESS').length,
      delivered: requests.filter((req: any) => req.deliveryStatus === 'DELIVERED').length,
      overdue: requests.filter((req: any) => req.dueDate < new Date() && req.deliveryStatus === 'REQUESTED').length
    };

    return new Response(JSON.stringify({
      success: true,
      deliveryRequests,
      stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });



  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch delivery requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 