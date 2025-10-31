import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const level = url.searchParams.get('level'); // info, warning, error
    
    // For now, we'll create mock activity logs since we don't have a dedicated log table
    // In the future, this could be connected to a proper logging system or database table
    
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        level: 'info',
        action: 'curve_upload',
        message: 'Curve definition created successfully',
        user: 'admin',
        details: { curveName: 'Test Curve', market: 'CAISO' }
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        level: 'info',
        action: 'curve_instance_created',
        message: 'New curve instance created',
        user: 'system',
        details: { instanceVersion: 'v1.0', status: 'DRAFT' }
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        level: 'warning',
        action: 'data_upload',
        message: 'Large data upload detected',
        user: 'admin',
        details: { recordCount: 8760, fileSize: '2.5MB' }
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        level: 'error',
        action: 'curve_validation',
        message: 'Curve validation failed',
        user: 'system',
        details: { error: 'Missing required field: deliveryPeriodEnd' }
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
        level: 'info',
        action: 'admin_access',
        message: 'Admin dashboard accessed',
        user: 'admin',
        details: { ip: '192.168.1.100', userAgent: 'Chrome' }
      }
    ];
    
    // Filter by level if specified
    let filteredLogs = mockLogs;
    if (level && ['info', 'warning', 'error'].includes(level)) {
      filteredLogs = mockLogs.filter(log => log.level === level);
    }
    
    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    
    // In a real implementation, you might also query actual database logs:
    // const realLogs = await query(`
    //   SELECT * FROM "Forecasts"."ActivityLog" 
    //   WHERE level = $1 OR $1 IS NULL
    //   ORDER BY timestamp DESC 
    //   LIMIT $2 OFFSET $3
    // `, [level, limit, offset]);
    
    return new Response(JSON.stringify({
      success: true,
      logs: paginatedLogs,
      pagination: {
        total: filteredLogs.length,
        limit,
        offset,
        hasMore: offset + limit < filteredLogs.length
      },
      filters: {
        level,
        availableLevels: ['info', 'warning', 'error']
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
