import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { instanceIds } = body;
    
    if (!instanceIds || !Array.isArray(instanceIds) || instanceIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Instance IDs array is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Fetch all instances with their curve data
    const instances = await prisma.curveInstance.findMany({
      where: { 
        id: { in: instanceIds.map((id: any) => parseInt(id.toString())) }
      },
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
            { commodity: 'asc' },
            { scenario: 'asc' }
          ]
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (instances.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No curve instances found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Generate combined CSV
    const headers = [
      'Curve Name',
      'Location',
      'Market',
      'Instance Version',
      'Timestamp',
      'Curve Type',
      'Commodity',
      'Scenario',
      'Value',
      'Units'
    ];
    
    const csvRows = [headers.join(',')];
    
    // Add data from all instances
    for (const instance of instances) {
      for (const data of instance.curveData) {
        const row = [
          `"${instance.curveDefinition.curveName}"`,
          `"${instance.curveDefinition.location}"`,
          `"${instance.curveDefinition.market}"`,
          `"${instance.instanceVersion}"`,
          data.timestamp.toISOString(),
          `"${data.curveType}"`,
          `"${data.commodity}"`,
          `"${data.scenario}"`,
          data.value.toString(),
          `"${data.units || instance.curveDefinition.units}"`
        ];
        csvRows.push(row.join(','));
      }
    }

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `curves_batch_${instances.length}_${timestamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error downloading batch curves:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download curves'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

