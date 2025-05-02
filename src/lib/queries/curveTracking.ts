import { Pool } from 'pg';
import { config } from '../../config/database';

const pool = new Pool(config);

export interface CurveWithTracking {
  curve_id: number;
  mark_type: string;
  mark_case: string;
  location: string;
  granularity: string;
  description: string;
  last_received_date: Date;
  next_expected_date: Date;
  freshness_start_date: Date;
  freshness_end_date: Date;
  is_currently_fresh: boolean;
  latest_flow_date?: Date;
  update_count?: number;
  days_since_update?: number;
  days_until_due?: number;
}

export async function getRecentlyUpdatedCurves(market: string, limit: number = 20): Promise<CurveWithTracking[]> {
  const query = `
    SELECT 
      cd.*,
      MAX(pf.flow_date_start) as latest_flow_date,
      COUNT(DISTINCT pf.mark_date) as update_count
    FROM Forecasts.curve_definitions cd
    LEFT JOIN Forecasts.price_forecasts pf ON cd.curve_id = pf.curve_id
    WHERE cd.market = $1
    GROUP BY cd.curve_id
    ORDER BY cd.last_received_date DESC NULLS LAST
    LIMIT $2
  `;
  
  const result = await pool.query(query, [market, limit]);
  return result.rows;
}

export async function getNextDueCurves(market: string, limit: number = 20): Promise<CurveWithTracking[]> {
  const query = `
    SELECT 
      cd.*,
      MAX(pf.flow_date_start) as latest_flow_date,
      COUNT(DISTINCT pf.mark_date) as update_count
    FROM Forecasts.curve_definitions cd
    LEFT JOIN Forecasts.price_forecasts pf ON cd.curve_id = pf.curve_id
    WHERE cd.market = $1 
    AND cd.next_expected_date > CURRENT_DATE
    GROUP BY cd.curve_id
    ORDER BY cd.next_expected_date ASC
    LIMIT $2
  `;
  
  const result = await pool.query(query, [market, limit]);
  return result.rows;
}

export async function getCurveUpdateStreak(curveId: number): Promise<{ mark_date: Date; on_time: boolean }[]> {
  const query = `
    WITH expected_dates AS (
      SELECT 
        generate_series(
          MIN(mark_date), 
          CURRENT_DATE, 
          (SELECT CASE 
            WHEN update_frequency = 'DAILY' THEN '1 day'::interval
            WHEN update_frequency = 'WEEKLY' THEN '1 week'::interval
            WHEN update_frequency = 'MONTHLY' THEN '1 month'::interval
            ELSE '1 day'::interval
          END
          FROM Forecasts.curve_schedule WHERE curve_id = $1)
        ) as expected_date
      FROM Forecasts.price_forecasts
      WHERE curve_id = $1
    )
    SELECT 
      pf.mark_date,
      CASE 
        WHEN ed.expected_date IS NOT NULL THEN true
        ELSE false
      END as on_time
    FROM Forecasts.price_forecasts pf
    LEFT JOIN expected_dates ed ON pf.mark_date = ed.expected_date
    WHERE pf.curve_id = $1
    ORDER BY pf.mark_date DESC
  `;
  
  const result = await pool.query(query, [curveId]);
  return result.rows;
}

export async function updateFreshnessPeriods(curveId: number): Promise<void> {
  const query = `
    WITH next_curve AS (
      SELECT 
        curve_id,
        mark_date as freshness_end_date,
        LAG(mark_date) OVER (
          PARTITION BY mark_type, location 
          ORDER BY mark_date DESC
        ) as next_freshness_start_date
      FROM Forecasts.curve_definitions
      WHERE mark_type = (
        SELECT mark_type FROM Forecasts.curve_definitions WHERE curve_id = $1
      )
      AND location = (
        SELECT location FROM Forecasts.curve_definitions WHERE curve_id = $1
      )
    )
    UPDATE Forecasts.curve_definitions
    SET 
      freshness_start_date = mark_date,
      freshness_end_date = (
        SELECT freshness_end_date 
        FROM next_curve 
        WHERE curve_id = $1
      )
    WHERE curve_id = $1
  `;
  
  await pool.query(query, [curveId]);
}

export async function getCurvesByTypeAndLocation(
  market: string,
  mark_type?: string,
  location?: string,
  limit: number = 50
): Promise<CurveWithTracking[]> {
  const params: any[] = [market];
  let paramCount = 1;
  
  let whereClause = 'WHERE cd.market = $1';
  if (mark_type) {
    paramCount++;
    whereClause += ` AND cd.mark_type = $${paramCount}`;
    params.push(mark_type);
  }
  if (location) {
    paramCount++;
    whereClause += ` AND cd.location = $${paramCount}`;
    params.push(location);
  }
  
  const query = `
    SELECT 
      cd.*,
      MAX(pf.flow_date_start) as latest_flow_date,
      COUNT(DISTINCT pf.mark_date) as update_count
    FROM Forecasts.curve_definitions cd
    LEFT JOIN Forecasts.price_forecasts pf ON cd.curve_id = pf.curve_id
    ${whereClause}
    GROUP BY cd.curve_id
    ORDER BY cd.last_received_date DESC NULLS LAST
    LIMIT $${paramCount + 1}
  `;
  
  params.push(limit);
  const result = await pool.query(query, params);
  return result.rows;
} 