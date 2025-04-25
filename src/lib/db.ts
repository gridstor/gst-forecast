import { Pool } from 'pg';
import type { PoolClient } from 'pg';

// Create a singleton pool
let pool: Pool | null = null;

export const createDatabase = async () => {
  if (!pool) {
    // Parse the connection string to add SSL requirement
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
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
      console.log('Successfully connected to the database');
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

export type Database = Pool; 