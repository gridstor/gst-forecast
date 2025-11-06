import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Force Node.js to accept self-signed certificates for AWS RDS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create a singleton pool
let pool: Pool | null = null;

export const createDatabase = async () => {
  if (!pool) {
    // Debug: Log all environment variables to see what's available
    console.log('Environment variables check:');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
    
    // Parse the connection string
    let connectionString = process.env.DATABASE_URL;
    
    // Fallback: Try to read from different possible env var names
    if (!connectionString) {
      connectionString = process.env.POSTGRES_URL || process.env.DB_URL;
      console.log('Trying fallback env vars:', !!connectionString);
    }
    
    // If still not found, throw error
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB')));
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('Using connection string with length:', connectionString.length);
    console.log('Connection string preview:', connectionString.substring(0, 20) + '...');

    // Ensure SSL is properly configured for AWS RDS
    if (!connectionString.includes('sslmode=')) {
      connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }

    console.log('Connection string configured for SSL requirement');

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Accept self-signed certificates from AWS RDS
      }
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Test the connection
    try {
      const client = await pool.connect();
      client.release();
      console.log('Successfully connected to the database with SSL');
    } catch (err) {
      console.error('Error connecting to the database:', err);
      throw err;
    }
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const db = await createDatabase();
  try {
    return await db.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  const db = await createDatabase();
  return await db.connect();
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Export db as a function that returns the database pool
export const db = async () => {
  return await createDatabase();
};

export type Database = Pool; 