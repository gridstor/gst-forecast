import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: APIRoute = async () => {
  try {
    console.log('Testing Prisma connection and CurveDefinition access...');
    
    // Test 1: Basic connection
    await prisma.$connect();
    console.log('✓ Prisma connected');
    
    // Test 2: Query a definition
    const firstDef = await prisma.curveDefinition.findFirst();
    console.log('✓ Found first definition:', firstDef?.id, firstDef?.curveName);
    
    // Test 3: Try to update it
    if (firstDef) {
      const updated = await prisma.curveDefinition.update({
        where: { id: firstDef.id },
        data: { 
          updatedAt: new Date(),
          // Test just updating timestamp
        }
      });
      console.log('✓ Update successful');
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Prisma working correctly',
        testedDefinition: {
          id: updated.id,
          curveName: updated.curveName,
          curveType: updated.curveType,
          batteryDuration: updated.batteryDuration,
          scenario: updated.scenario,
          degradationType: updated.degradationType
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'No definitions found in database'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

