import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const definition = await prisma.curveDefinition.findUnique({
      where: { id: parseInt(id) },
      include: {
        instances: {
          select: { id: true }
        }
      }
    });

    if (!definition) {
      return new Response(JSON.stringify({ error: 'Definition not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      ...definition,
      instanceCount: definition.instances.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching definition:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch definition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('Edit request received with body:', JSON.stringify(body, null, 2));
    
    const { 
      id, 
      curveName,
      market,
      location,
      product,
      curveType,
      batteryDuration,
      scenario,
      degradationType,
      commodity,
      units,
      granularity,
      timezone,
      description,
      isActive,
      performedBy 
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Parsed fields:', {
      id,
      curveName,
      market,
      curveType,
      batteryDuration,
      scenario,
      degradationType
    });

    // Check if curve name is being changed and if new name already exists
    if (curveName) {
      const existing = await prisma.curveDefinition.findFirst({
        where: {
          curveName,
          NOT: { id: parseInt(id) }
        }
      });

      if (existing) {
        return new Response(JSON.stringify({ 
          error: 'A curve with this name already exists' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Build update data object - only include fields that were provided
    const updateData: any = {
      updatedAt: new Date()
    };

    if (curveName !== undefined) updateData.curveName = curveName;
    if (market !== undefined) updateData.market = market;
    if (location !== undefined) updateData.location = location;
    if (product !== undefined) updateData.product = product;
    if (curveType !== undefined) updateData.curveType = curveType;
    if (batteryDuration !== undefined) updateData.batteryDuration = batteryDuration;
    if (scenario !== undefined) updateData.scenario = scenario;
    if (degradationType !== undefined) updateData.degradationType = degradationType;
    if (commodity !== undefined) updateData.commodity = commodity;
    if (units !== undefined) updateData.units = units;
    if (granularity !== undefined) updateData.granularity = granularity;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    console.log('Update data prepared:', JSON.stringify(updateData, null, 2));
    console.log('Updating definition with ID:', parseInt(id));

    const updated = await prisma.curveDefinition.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    console.log('✓ Update successful for definition:', updated.id);

    // Log the change in audit log (if you have one)
    // await prisma.auditLog.create({...})

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating definition:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ 
      error: 'Failed to update definition',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, performedBy } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // This will cascade delete all instances and their data
    await prisma.curveDefinition.delete({
      where: { id: parseInt(id) }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting definition:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete definition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
