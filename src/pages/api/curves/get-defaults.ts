import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const locationParam = new URL(url).searchParams.get('location');
    
    console.log(`Getting default curves for location: ${locationParam}`);
    
    // For now, return the proper structure with empty arrays
    // TODO: Implement actual default curve logic based on database settings
    const defaults = {
      monthly: [] as number[],
      annual: [] as number[]
    };

    // Optional: Get the first few curves for this location as defaults
    if (locationParam) {
      try {
        const result = await query(`
          SELECT id 
          FROM "Forecasts"."CurveDefinition"
          WHERE location = $1 AND "isActive" = true
          ORDER BY "createdAt" DESC
          LIMIT 2
        `, [locationParam]);
        
        // Set these as default monthly curves for now
        defaults.monthly = result.rows.map(row => row.id);
        console.log(`Set default curves for ${locationParam}:`, defaults);
      } catch (dbError) {
        console.warn('Could not fetch default curves from database:', dbError);
      }
    }

    return new Response(JSON.stringify(defaults), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in get defaults API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch default curves' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 