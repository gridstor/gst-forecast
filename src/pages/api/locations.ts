import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('Returning fallback locations for schedule workflow...');
    
    // Return fallback data for common energy markets until database is fully configured
    const fallbackLocations = [
      { value: 'ERCOT-Houston', label: 'ERCOT - Houston', market: 'ERCOT', location: 'Houston' },
      { value: 'ERCOT-Dallas', label: 'ERCOT - Dallas', market: 'ERCOT', location: 'Dallas' },
      { value: 'ERCOT-Austin', label: 'ERCOT - Austin', market: 'ERCOT', location: 'Austin' },
      { value: 'CAISO-SP15', label: 'CAISO - SP15', market: 'CAISO', location: 'SP15' },
      { value: 'CAISO-NP15', label: 'CAISO - NP15', market: 'CAISO', location: 'NP15' },
      { value: 'PJM-Zone_A', label: 'PJM - Zone A', market: 'PJM', location: 'Zone A' },
      { value: 'MISO-Illinois', label: 'MISO - Illinois', market: 'MISO', location: 'Illinois' },
      { value: 'SPP-North', label: 'SPP - North', market: 'SPP', location: 'North' }
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