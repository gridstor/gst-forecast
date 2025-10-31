import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const instanceId = url.searchParams.get('instanceId');
    
    if (!instanceId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Instance ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Fetch the instance with all curve data
    const instance = await prisma.curveInstance.findUnique({
      where: { id: parseInt(instanceId) },
      include: {
        curveDefinition: {
          select: {
            curveName: true,
            location: true,
            market: true,
            units: true
          }
        },
        curveData: {
          orderBy: [
            { timestamp: 'asc' },
            { curveType: 'asc' },
            { commodity: 'asc' }
          ]
        }
      }
    });

    if (!instance) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Curve instance not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Generate CSV
    const headers = [
      'Timestamp',
      'Curve Type',
      'Commodity',
      'Scenario',
      'Value',
      'Units'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const data of instance.curveData) {
      const row = [
        data.timestamp.toISOString(),
        `"${data.curveType}"`,
        `"${data.commodity}"`,
        `"${data.scenario}"`,
        data.value.toString(),
        `"${data.units || instance.curveDefinition.units}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const filename = `${instance.curveDefinition.curveName}_${instance.instanceVersion}_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error downloading curve:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download curve'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};



