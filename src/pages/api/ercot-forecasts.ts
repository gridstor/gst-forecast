import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    const forecasts = await prisma.ercot_long_term_forecasts_annual.findMany({
      where: {
        OR: [
          { AND: [{ MarkType: 'SOUTH_Aurora' }, { MarkCase: 'Base' }] },
          // ... rest of your conditions
        ]
      }
    });
    return new Response(JSON.stringify(forecasts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch forecasts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 