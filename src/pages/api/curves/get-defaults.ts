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

    // Get default curves for this location
    const defaultCurves = await prisma.curve_definitions.findMany({
      where: {
        market,
        location,
        display_curves: {
          some: {
            website_displays: {
              display_name: 'default_curves'
            }
          }
        }
      },
      select: {
        curve_id: true,
        granularity: true,
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
        display_curves: {
          _count: 'desc'
        }
      }
    });

    // Format the response
    const monthly = defaultCurves
      .filter(c => c.granularity?.toLowerCase() === 'monthly')
      .map(c => ({
        curveId: c.curve_id,
        displayOrder: c.display_curves[0]?.display_order ?? 0
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const annual = defaultCurves
      .filter(c => c.granularity?.toLowerCase() === 'annual')
      .map(c => ({
        curveId: c.curve_id,
        displayOrder: c.display_curves[0]?.display_order ?? 0
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return new Response(JSON.stringify({
      monthly: monthly.map(c => c.curveId),
      annual: annual.map(c => c.curveId)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching default curves:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch default curves' }), 
      { status: 500 }
    );
  }
}; 