import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/curves/should-create-instance
 * 
 * Helps determine if user should create a new definition or a new instance
 * Given curve characteristics, returns existing definitions that match
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { market, location, batteryDuration } = body;

    if (!market || !location) {
      return new Response(JSON.stringify({
        error: 'market and location are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find existing definitions that match these core characteristics
    const matchingDefinitions = await prisma.curveDefinition.findMany({
      where: {
        market,
        location,
        batteryDuration: batteryDuration || undefined,
        isActive: true
      },
      include: {
        _count: {
          select: {
            instances: true
          }
        }
      }
    });

    // Recommendation logic
    let recommendation: string;
    let existingDefinition: any = null;
    
    if (matchingDefinitions.length === 0) {
      recommendation = 'CREATE_DEFINITION';
    } else if (matchingDefinitions.length === 1) {
      recommendation = 'CREATE_INSTANCE';
      existingDefinition = matchingDefinitions[0];
    } else {
      recommendation = 'CHOOSE_DEFINITION_OR_CREATE';
      existingDefinition = matchingDefinitions;
    }

    const response = {
      recommendation,
      explanation: getExplanation(recommendation),
      matchingDefinitions: Array.isArray(existingDefinition) 
        ? existingDefinition 
        : existingDefinition 
          ? [existingDefinition] 
          : [],
      userGuidance: getUserGuidance(recommendation, matchingDefinitions)
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking definition/instance:', error);
    return new Response(JSON.stringify({
      error: 'Failed to check',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

function getExplanation(recommendation: string): string {
  switch (recommendation) {
    case 'CREATE_DEFINITION':
      return 'No existing curve definition matches these characteristics. You should create a new definition.';
    case 'CREATE_INSTANCE':
      return 'A matching curve definition exists. You should create a new instance under it instead of a new definition.';
    case 'CHOOSE_DEFINITION_OR_CREATE':
      return 'Multiple curve definitions match these characteristics. Choose one to add an instance to, or create a new definition if needed.';
    default:
      return 'Unable to determine recommendation.';
  }
}

function getUserGuidance(recommendation: string, definitions: any[]): string {
  switch (recommendation) {
    case 'CREATE_DEFINITION':
      return '✅ Go ahead and create a new Curve Definition with a unique name.';
    case 'CREATE_INSTANCE':
      return `⚠️ Don't create a new definition! Instead, create a new Instance under the existing definition "${definitions[0].curveName}". Instances allow you to have different versions, time periods, or runs of the same curve.`;
    case 'CHOOSE_DEFINITION_OR_CREATE':
      return `⚠️ Found ${definitions.length} matching definitions. Review them and either:\n` +
             `1. Add a new Instance to one of them, OR\n` +
             `2. If none match your needs exactly, create a new Definition with a unique name.`;
    default:
      return 'Please review your inputs and try again.';
  }
}

