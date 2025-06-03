import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const locationParam = new URL(url).searchParams.get('location');
    
    if (!locationParam) {
      return new Response(
        JSON.stringify({ error: 'Location parameter is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Curves by location fallback for: ${locationParam}`);
    
    // Return empty array until new Forecasts schema is properly connected
    // This API will be updated to use the new CurveDefinition table later
    const emptyCurves: any[] = [];

    return new Response(JSON.stringify(emptyCurves), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in curves by location API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch curves' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 