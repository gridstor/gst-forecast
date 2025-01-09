import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';

export const GET: APIRoute = async ({ url }) => {
  try {
    const locationParam = new URL(url).searchParams.get('location');
    
    if (!locationParam) {
      return new Response(
        JSON.stringify({ error: 'Location parameter is required' }), 
        { status: 400 }
      );
    }

    // Split the combined market-location string
    const [market, location] = locationParam.split('-');

    if (!market || !location) {
      return new Response(
        JSON.stringify({ error: 'Invalid location format' }), 
        { status: 400 }
      );
    }

    const curves = await prisma.curve_definitions.findMany({
      where: { 
        market: market,
        location: location,
        granularity: { in: ['MONTHLY', 'ANNUAL'] }
      },
      select: {
        curve_id: true,
        market: true,
        location: true,
        mark_type: true,
        mark_case: true,
        mark_date: true,
        granularity: true,
        curve_creator: true,
        mark_fundamentals_desc: true,
        mark_model_type_desc: true,
        mark_dispatch_optimization_desc: true,
        gridstor_purpose: true,
        value_type: true,
        curve_start_date: true,
        curve_end_date: true,
        created_at: true,
        display_curves: {
          where: {
            website_displays: {
              display_name: 'default_curves'
            }
          },
          select: {
            display_order: true
          }
        }
      },
      orderBy: {
        mark_date: 'desc'
      }
    });

    const formattedCurves = curves.map(curve => {
      const isDefault = curve.display_curves.length > 0;
      const displayOrder = isDefault ? curve.display_curves[0]?.display_order : null;
      
      return {
        ...curve,
        is_default: isDefault,
        display_order: displayOrder,
        display_curves: undefined // Remove this from the response
      };
    });

    return new Response(JSON.stringify(formattedCurves), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching curves:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch curves' }), 
      { status: 500 }
    );
  }
}; 