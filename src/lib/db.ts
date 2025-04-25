import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

let pool: Pool | null = null;

export async function createDatabase() {
  if (!pool) {
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : undefined
    };

    pool = new Pool(config);
  }

  return pool;
}

export type Database = Pool; 