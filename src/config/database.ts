import type { PoolConfig } from 'pg';

// Database configuration for Windows PostgreSQL
export const config: PoolConfig = {
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DATABASE || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  // Windows-specific settings
  ssl: false,
  keepAlive: true,
  statement_timeout: 0,
  query_timeout: 0,
  connectionTimeoutMillis: 10000,
  idle_in_transaction_session_timeout: 0,
  application_name: 'gst-forecast'
}; 