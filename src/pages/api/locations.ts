import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    console.log('Fetching locations from database...');
    // Get distinct locations from curve_definitions
    const locations = await prisma.curve_definitions.findMany({
      select: {
        location: true,
        market: true,
      },
      where: {
        location: { not: null },
        market: { not: null },
        granularity: { in: ['MONTHLY', 'ANNUAL'] }
      },
      distinct: ['location', 'market'],
      orderBy: [
        { market: 'asc' },
        { location: 'asc' }
      ]
    });

    console.log('Raw locations from DB:', locations);

    // Transform to match LocationOption interface
    const formattedLocations = locations
      .filter(l => l.location && l.market)
      .map(l => ({
        id: `${l.market}-${l.location}`,
        name: l.location,
        market: l.market,
        active: true
      }));

    console.log('Formatted locations:', formattedLocations);

    return new Response(JSON.stringify(formattedLocations), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch locations',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 