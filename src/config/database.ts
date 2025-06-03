import type { PoolConfig } from 'pg';

// Parse DATABASE_URL if available, otherwise use individual env vars
function parseConnectionString(url: string | undefined): Partial<PoolConfig> {
  if (!url) return {};
  
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port || '5432'),
      database: parsedUrl.pathname.slice(1).split('?')[0],
      user: parsedUrl.username,
      password: parsedUrl.password,
      ssl: parsedUrl.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false
    };
  } catch (e) {
    console.error('Error parsing DATABASE_URL:', e);
    return {};
  }
}

// Database configuration that works with both local and AWS RDS
export const config: PoolConfig = {
  ...parseConnectionString(process.env.DATABASE_URL),
  // Fallback to individual env vars if DATABASE_URL parsing fails
  host: process.env.POSTGRES_HOST || parseConnectionString(process.env.DATABASE_URL).host || '127.0.0.1',
  port: parseInt(process.env.POSTGRES_PORT || '5432') || parseConnectionString(process.env.DATABASE_URL).port || 5432,
  database: process.env.POSTGRES_DATABASE || parseConnectionString(process.env.DATABASE_URL).database || 'postgres',
  user: process.env.POSTGRES_USER || parseConnectionString(process.env.DATABASE_URL).user || 'postgres',
  password: process.env.POSTGRES_PASSWORD || parseConnectionString(process.env.DATABASE_URL).password || 'postgres',
  // AWS RDS requires SSL
  ssl: process.env.DATABASE_URL?.includes('rds.amazonaws.com') 
    ? { rejectUnauthorized: false }
    : false,
  keepAlive: true,
  statement_timeout: 0,
  query_timeout: 0,
  connectionTimeoutMillis: 10000,
  idle_in_transaction_session_timeout: 0,
  application_name: 'gst-forecast'
}; 