import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('Returning fallback locations for schedule workflow...');
    
    // Return fallback data for common energy markets until database is fully configured
    const fallbackLocations = [
      { id: 'Houston', name: 'Houston', market: 'ERCOT', active: true },
      { id: 'Dallas', name: 'Dallas', market: 'ERCOT', active: true },
      { id: 'Austin', name: 'Austin', market: 'ERCOT', active: true },
      { id: 'SP15', name: 'SP15', market: 'CAISO', active: true },
      { id: 'NP15', name: 'NP15', market: 'CAISO', active: true },
      { id: 'Goleta', name: 'Goleta', market: 'CAISO', active: true },
      { id: 'Zone_A', name: 'Zone A', market: 'PJM', active: true },
      { id: 'Illinois', name: 'Illinois', market: 'MISO', active: true },
      { id: 'North', name: 'North', market: 'SPP', active: true }
    ];
    
    return new Response(JSON.stringify(fallbackLocations), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in locations API:', error);
    
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 