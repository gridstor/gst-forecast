import { PrismaClient } from '@prisma/client';

// Main ERCOT database client for analytics_workspace (ERCOT structural demand data + Futures data)
export const ercotDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_THIRD || process.env.DATABASE_URL || 'postgresql://localhost:5432/analytics_workspace'
    }
  },
  log: ['error', 'warn']
});

// Helper function to test the connection and query ERCOT data
export async function testERCOTConnection() {
  try {
    const result = await ercotDb.$queryRaw`
      SELECT current_database() as db_name, current_schema() as schema_name
    `;
    
    console.log('✅ ERCOT Database connection successful:', result);
    return result;
  } catch (error) {
    console.error('❌ ERCOT Database connection failed:', error);
    throw error;
  }
}

// Cleanup function to disconnect when needed
export async function disconnectERCOTDb() {
  await ercotDb.$disconnect();
}

