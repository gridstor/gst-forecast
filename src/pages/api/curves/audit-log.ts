import { Pool } from 'pg';
import { config } from '../../../config/database';

const pool = new Pool(config);

export async function POST(req: Request) {
  try {
    const { curveId, action, metadata } = await req.json();

    const query = `
      INSERT INTO Forecasts.curve_audit_log (
        curve_id,
        action_type,
        action_metadata,
        created_at,
        created_by
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      curveId,
      action,
      metadata,
      metadata.uploadedBy || 'SYSTEM'
    ]);

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return new Response(JSON.stringify({ error: 'Failed to create audit log' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 