import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { curveId, isDefault, displayOrder } = await request.json();
    console.log('Setting default curve:', { curveId, isDefault, displayOrder });

    // Get the curve's current data
    const curve = await prisma.curve_definitions.findUnique({
      where: { curve_id: curveId },
      include: {
        display_curves: {
          where: {
            website_displays: {
              display_name: 'default_curves'
            }
          }
        }
      }
    });

    if (!curve) {
      return new Response(JSON.stringify({ error: 'Curve not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (isDefault) {
      // If the curve isn't already in display_curves, add it
      if (curve.display_curves.length === 0) {
        const display = await prisma.website_displays.findUnique({
          where: { display_name: 'default_curves' }
        });

        if (!display) {
          // Create the display if it doesn't exist
          const newDisplay = await prisma.website_displays.create({
            data: {
              display_name: 'default_curves',
              description: 'Default curves for each location'
            }
          });

          // Add the curve to display_curves
          await prisma.display_curves.create({
            data: {
              display_id: newDisplay.display_id,
              curve_id: curveId,
              display_order: displayOrder
            }
          });
        } else {
          // Add the curve to the existing display
          await prisma.display_curves.create({
            data: {
              display_id: display.display_id,
              curve_id: curveId,
              display_order: displayOrder
            }
          });
        }
      }
    } else {
      // If the curve is in display_curves, remove it
      if (curve.display_curves.length > 0) {
        await prisma.display_curves.deleteMany({
          where: {
            curve_id: curveId,
            website_displays: {
              display_name: 'default_curves'
            }
          }
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      isDefault: isDefault
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error setting default curve:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update default curve',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 