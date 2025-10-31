import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const enums = {
      curveType: [
        'REVENUE',
        'REVENUE_OTHER', 
        'ENERGY',
        'ENERGY_ARB',
        'AS',
        'TB2',
        'TB4',
        'RA',
        'DA',
        'RT',
        'OTHER'
      ],
      batteryDuration: [
        'TWO_H',
        'TWO_POINT_SIX_H',
        'FOUR_H', 
        'EIGHT_H',
        'UNKNOWN',
        'OTHER'
      ],
      scenario: [
        'BASE',
        'LOW',
        'HIGH',
        'P50',
        'P90',
        'P10',
        'DOWNSIDE',
        'UPSIDE',
        'WORST',
        'BEST',
        'ACTUAL',
        'TARGET',
        'LOWER_BOUND',
        'UPPER_BOUND',
        'OTHER'
      ],
      degradationType: [
        'NONE',
        'YEAR_1',
        'YEAR_2', 
        'YEAR_5',
        'YEAR_10',
        'YEAR_15',
        'YEAR_20',
        'CUSTOM',
        'OTHER'
      ],
      granularity: [
        'HOURLY',
        'DAILY',
        'MONTHLY',
        'QUARTERLY', 
        'ANNUALLY'
      ],
      markets: [
        'CAISO',
        'ERCOT',
        'PJM',
        'NYISO',
        'ISO-NE',
        'MISO'
      ],
      locations: [
        'NP15',
        'SP15',
        'ZP26',
        'Goleta',
        'Hidden Lakes',
        'Houston',
        'North',
        'West',
        'MASS'
      ]
    };

    return new Response(
      JSON.stringify({ success: true, enums }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching enums:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch enum values',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 