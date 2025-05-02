import type { APIRoute } from 'astro';
import { Pool } from 'pg';
import { config } from '../../../../config/database';

export const POST: APIRoute = async ({ params, request }) => {
  const curveId = params.curveId;
  if (!curveId) {
    return new Response(JSON.stringify({ error: 'Curve ID is required' }), {
      status: 400,
    });
  }

  try {
    const { newDate } = await request.json();
    if (!newDate) {
      return new Response(JSON.stringify({ error: 'New date is required' }), {
        status: 400,
      });
    }

    const pool = new Pool(config);

    try {
      // Start a transaction
      await pool.query('BEGIN');

      // Update the next expected date
      await pool.query(`
        UPDATE Forecasts.curve_definitions
        SET next_expected_date = $1
        WHERE curve_id = $2
      `, [newDate, curveId]);

      // Log the schedule change
      await pool.query(`
        INSERT INTO Forecasts.curve_audit_log (
          curve_id,
          action_type,
          action_metadata,
          created_by
        ) VALUES ($1, $2, $3, $4)
      `, [
        curveId,
        'SCHEDULE_UPDATE',
        JSON.stringify({
          newExpectedDate: newDate,
          reason: 'Manual schedule update via calendar'
        }),
        'SYSTEM'
      ]);

      // Commit the transaction
      await pool.query('COMMIT');

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
    } catch (error) {
      // Rollback on error
      await pool.query('ROLLBACK');
      throw error;
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Error updating curve schedule:', error);
    return new Response(JSON.stringify({ error: 'Failed to update schedule' }), {
      status: 500,
    });
  }
};

// Add GET endpoint to fetch schedule details
export const GET: APIRoute = async ({ params }) => {
  const curveId = params.curveId;
  if (!curveId) {
    return new Response(JSON.stringify({ error: 'Curve ID is required' }), {
      status: 400,
    });
  }

  const pool = new Pool(config);

  try {
    const result = await pool.query(`
      SELECT 
        next_expected_date,
        last_received_date,
        (
          SELECT json_agg(json_build_object(
            'expectedDate', expected_date,
            'actualDate', actual_date
          ))
          FROM Forecasts.curve_update_history
          WHERE curve_id = $1
          ORDER BY expected_date DESC
          LIMIT 10
        ) as update_history
      FROM Forecasts.curve_definitions
      WHERE curve_id = $1
    `, [curveId]);

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Curve not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching curve schedule:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch schedule' }), {
      status: 500,
    });
  } finally {
    await pool.end();
  }
}; 