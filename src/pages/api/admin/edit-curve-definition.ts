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
      // Fields that belong on Definition (instance-specific fields removed)
      batteryDuration,
      units,
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
      location,
      batteryDuration
    });

    // Get the current definition to check market/location
    const currentDef = await prisma.curveDefinition.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentDef) {
      return new Response(JSON.stringify({ error: 'Curve definition not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if curve name+market+location combo already exists (if any are being changed)
    const checkName = curveName || currentDef.curveName;
    const checkMarket = market || currentDef.market;
    const checkLocation = location || currentDef.location;

    const existing = await prisma.curveDefinition.findFirst({
      where: {
        curveName: checkName,
        market: checkMarket,
        location: checkLocation,
        NOT: { id: parseInt(id) }
      }
    });

    if (existing) {
      return new Response(JSON.stringify({ 
        error: `A curve with name "${checkName}" already exists for ${checkMarket} ${checkLocation}` 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update data object - only include fields that belong on Definition
    const updateData: any = {
      updatedAt: new Date()
    };

    // Definition-level fields only
    if (curveName !== undefined) updateData.curveName = curveName;
    if (market !== undefined) updateData.market = market;
    if (location !== undefined) updateData.location = location;
    if (batteryDuration !== undefined) updateData.batteryDuration = batteryDuration;
    if (units !== undefined) updateData.units = units;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    // Note: product, curveType, commodity, granularity, scenario, degradationType 
    // are now on CurveInstance, not CurveDefinition

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

    console.log(`Attempting to delete curve definition ${id}...`);

    // Check if definition exists and get counts
    const definition = await prisma.curveDefinition.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            instances: true,
            schedules: true,
            defaultInputs: true
          }
        }
      }
    });

    if (!definition) {
      return new Response(JSON.stringify({ error: 'Definition not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Deleting definition "${definition.curveName}" with ${definition._count.instances} instances, ${definition._count.schedules} schedules`);

    // This will cascade delete all instances and their data (if cascade is set up)
    await prisma.curveDefinition.delete({
      where: { id: parseInt(id) }
    });

    console.log(`Successfully deleted definition ${id}`);

    return new Response(JSON.stringify({ 
      success: true,
      deleted: {
        name: definition.curveName,
        instancesDeleted: definition._count.instances,
        schedulesDeleted: definition._count.schedules
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting definition:', error);
    
    // Check for specific constraint errors
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    let userMessage = 'Failed to delete definition';
    
    if (errorMsg.includes('foreign key constraint') || errorMsg.includes('violates foreign key')) {
      userMessage = 'Cannot delete: This definition has related instances or schedules. Database constraints are not set up for cascade delete. Run the migration SQL first.';
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      details: errorMsg,
      hint: 'You may need to run the cascade delete migration SQL on your database first.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};
