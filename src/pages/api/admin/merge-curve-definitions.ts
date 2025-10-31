import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/admin/merge-curve-definitions
 * 
 * Merges a temporary/duplicate definition into an existing one
 * Moves all instances from the temp definition to the target definition
 * Then deletes the temp definition
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      tempDefinitionId,    // The temp definition to remove
      targetDefinitionId,  // The existing definition to merge into
      performedBy = 'Admin'
    } = body;

    if (!tempDefinitionId || !targetDefinitionId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: tempDefinitionId, targetDefinitionId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (tempDefinitionId === targetDefinitionId) {
      return new Response(JSON.stringify({
        error: 'Cannot merge a definition into itself'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify both definitions exist
      const tempDef = await tx.curveDefinition.findUnique({
        where: { id: parseInt(tempDefinitionId) },
        include: {
          instances: {
            select: {
              id: true,
              instanceVersion: true
            }
          }
        }
      });

      const targetDef = await tx.curveDefinition.findUnique({
        where: { id: parseInt(targetDefinitionId) }
      });

      if (!tempDef) {
        throw new Error(`Temp definition ${tempDefinitionId} not found`);
      }

      if (!targetDef) {
        throw new Error(`Target definition ${targetDefinitionId} not found`);
      }

      console.log(`Merging "${tempDef.curveName}" into "${targetDef.curveName}"`);
      console.log(`Moving ${tempDef.instances.length} instances...`);

      // 2. Check for instance version conflicts and rename if needed
      const targetInstances = await tx.curveInstance.findMany({
        where: { curveDefinitionId: parseInt(targetDefinitionId) },
        select: { instanceVersion: true }
      });
      
      const targetVersions = new Set(targetInstances.map(i => i.instanceVersion));
      let renamedCount = 0;
      
      for (const inst of tempDef.instances) {
        if (targetVersions.has(inst.instanceVersion)) {
          // Conflict! Rename the instance being moved
          const newVersion = `${inst.instanceVersion}_merged_${Date.now()}`;
          console.log(`Renaming conflicting instance from "${inst.instanceVersion}" to "${newVersion}"`);
          
          await tx.curveInstance.update({
            where: { id: inst.id },
            data: { instanceVersion: newVersion }
          });
          
          renamedCount++;
        }
      }
      
      if (renamedCount > 0) {
        console.log(`Renamed ${renamedCount} instance(s) to avoid conflicts`);
      }

      // 3. Now move all instances from temp to target
      const updatedInstances = await tx.curveInstance.updateMany({
        where: {
          curveDefinitionId: parseInt(tempDefinitionId)
        },
        data: {
          curveDefinitionId: parseInt(targetDefinitionId)
        }
      });

      console.log(`Moved ${updatedInstances.count} instances`);

      // 4. Move schedules if any
      const updatedSchedules = await tx.curveSchedule.updateMany({
        where: {
          curveDefinitionId: parseInt(tempDefinitionId)
        },
        data: {
          curveDefinitionId: parseInt(targetDefinitionId)
        }
      });

      console.log(`Moved ${updatedSchedules.count} schedules`);

      // 5. Move default inputs if any
      const updatedInputs = await tx.defaultCurveInput.updateMany({
        where: {
          curveDefinitionId: parseInt(tempDefinitionId)
        },
        data: {
          curveDefinitionId: parseInt(targetDefinitionId)
        }
      });

      console.log(`Moved ${updatedInputs.count} default inputs`);

      // 6. Delete the temp definition
      await tx.curveDefinition.delete({
        where: { id: parseInt(tempDefinitionId) }
      });

      console.log(`Deleted temp definition ${tempDefinitionId}`);

      return {
        success: true,
        tempDefinitionName: tempDef.curveName,
        targetDefinitionName: targetDef.curveName,
        instancesMoved: updatedInstances.count,
        instancesRenamed: renamedCount,
        schedulesMoved: updatedSchedules.count,
        inputsMoved: updatedInputs.count
      };
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error merging curve definitions:', error);
    return new Response(JSON.stringify({
      error: 'Failed to merge curve definitions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * GET /api/admin/merge-curve-definitions?tempId=X
 * 
 * Preview what would be merged (dry run)
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const tempDefinitionId = url.searchParams.get('tempId');
    
    if (!tempDefinitionId) {
      return new Response(JSON.stringify({
        error: 'Missing tempId parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tempDef = await prisma.curveDefinition.findUnique({
      where: { id: parseInt(tempDefinitionId) },
      include: {
        instances: {
          select: {
            id: true,
            instanceVersion: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                curveData: true,
                priceForecasts: true
              }
            }
          }
        },
        schedules: {
          select: {
            id: true,
            frequency: true
          }
        },
        defaultInputs: {
          select: {
            id: true,
            inputType: true
          }
        }
      }
    });

    if (!tempDef) {
      return new Response(JSON.stringify({
        error: 'Temp definition not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find potential merge targets (similar curves)
    const potentialTargets = await prisma.curveDefinition.findMany({
      where: {
        market: tempDef.market,
        location: tempDef.location,
        id: { not: parseInt(tempDefinitionId) }
      },
      select: {
        id: true,
        curveName: true,
        market: true,
        location: true,
        batteryDuration: true,
        _count: {
          select: {
            instances: true
          }
        }
      }
    });

    return new Response(JSON.stringify({
      tempDefinition: {
        id: tempDef.id,
        curveName: tempDef.curveName,
        market: tempDef.market,
        location: tempDef.location,
        batteryDuration: tempDef.batteryDuration,
        instanceCount: tempDef.instances.length,
        scheduleCount: tempDef.schedules.length,
        defaultInputCount: tempDef.defaultInputs.length,
        instances: tempDef.instances
      },
      potentialTargets: potentialTargets,
      recommendation: potentialTargets.length > 0 
        ? `Found ${potentialTargets.length} potential target(s) with matching market/location`
        : 'No matching definitions found. Consider keeping this as a separate definition with a unique name.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error previewing merge:', error);
    return new Response(JSON.stringify({
      error: 'Failed to preview merge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

