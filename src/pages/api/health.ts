import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Test database connection
    const dbStatus = await testDatabaseConnection();
    
    // Get basic system info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Check if we can access key tables
    const tableChecks = await testTableAccess();

    const healthStatus = {
      status: dbStatus.healthy && tableChecks.healthy ? 'healthy' : 'unhealthy',
      timestamp: systemInfo.timestamp,
      checks: {
        database: dbStatus,
        tables: tableChecks,
        system: {
          healthy: true,
          uptime: systemInfo.uptime,
          nodeVersion: systemInfo.nodeVersion,
          platform: systemInfo.platform
        }
      }
    };

    return new Response(JSON.stringify(healthStatus), {
      status: healthStatus.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: { healthy: false, error: 'Connection failed' },
        tables: { healthy: false, error: 'Unable to test' },
        system: { healthy: false, error: 'Health check failed' }
      }
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      healthy: true,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function testTableAccess() {
  try {
    // Test access to key tables
    const curveDefinitionCount = await prisma.curveDefinition.count();
    const curveInstanceCount = await prisma.curveInstance.count();
    
    return {
      healthy: true,
      message: 'Table access successful',
      counts: {
        curveDefinitions: curveDefinitionCount,
        curveInstances: curveInstanceCount
      }
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Table access failed'
    };
  }
}
