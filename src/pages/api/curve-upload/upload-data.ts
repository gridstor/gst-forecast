import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const {
      curveInstanceId,
      priceData
    } = body;

    // Validate required fields
    if (!curveInstanceId || !priceData || !Array.isArray(priceData)) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: curveInstanceId, priceData (array)' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate that the curve instance exists
    const curveInstance = await prisma.curveInstance.findUnique({
      where: { id: parseInt(curveInstanceId) },
      include: { curveDefinition: true }
    });

    if (!curveInstance) {
      return new Response(
        JSON.stringify({ error: 'Curve instance not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Attempt to extract units from CSV rows (first non-empty value)
    const csvUnits = Array.isArray(priceData)
      ? (priceData.find((r: any) => r && typeof r.units === 'string' && r.units.trim().length > 0)?.units || null)
      : null;

    // Validate and prepare price data
    const validatedData = [];
    const errors = [];

    for (let i = 0; i < priceData.length; i++) {
      const row = priceData[i];
      
      // Skip rows with empty values (template placeholders)
      if (!row.value || row.value.toString().trim() === '') {
        continue;
      }
      
      if (!row.timestamp) {
        errors.push(`Row ${i + 1}: Missing timestamp`);
        continue;
      }
      
      if (!row.curveType || !row.commodity || !row.scenario) {
        errors.push(`Row ${i + 1}: Missing curveType, commodity, or scenario`);
        continue;
      }

      const timestamp = new Date(row.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push(`Row ${i + 1}: Invalid timestamp format`);
        continue;
      }

      const value = parseFloat(row.value);
      if (isNaN(value)) {
        errors.push(`Row ${i + 1}: Invalid value (must be a number)`);
        continue;
      }

      // Check if timestamp is within delivery period (compare dates only, not times)
      const tsDate = new Date(timestamp.toISOString().split('T')[0]);
      const startDate = new Date(curveInstance.deliveryPeriodStart.toISOString().split('T')[0]);
      const endDate = new Date(curveInstance.deliveryPeriodEnd.toISOString().split('T')[0]);
      
      if (tsDate < startDate || tsDate > endDate) {
        errors.push(`Row ${i + 1}: Timestamp ${timestamp.toISOString().split('T')[0]} outside delivery period (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
        continue;
      }

      // Validate that curveType/commodity/scenario are in the instance arrays
      const instanceTypes = curveInstance.curveTypes || [];
      const instanceCommodities = curveInstance.commodities || [];
      const instanceScenarios = curveInstance.scenarios || [];
      
      // Log for debugging
      if (i === 0) {
        console.log('Instance delivery period:', {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        });
        console.log('Instance validation arrays:', {
          instanceTypes,
          instanceCommodities,
          instanceScenarios
        });
        console.log('First row values:', {
          timestamp: timestamp.toISOString(),
          timestampDate: tsDate.toISOString(),
          curveType: row.curveType,
          commodity: row.commodity,
          scenario: row.scenario,
          value: value
        });
      }
      
      if (instanceTypes.length > 0 && !instanceTypes.includes(row.curveType)) {
        errors.push(`Row ${i + 1}: curveType "${row.curveType}" not in instance types: [${instanceTypes.join(', ')}]`);
        continue;
      }
      
      if (instanceCommodities.length > 0 && !instanceCommodities.includes(row.commodity)) {
        errors.push(`Row ${i + 1}: commodity "${row.commodity}" not in instance commodities: [${instanceCommodities.join(', ')}]`);
        continue;
      }
      
      if (instanceScenarios.length > 0 && !instanceScenarios.includes(row.scenario)) {
        errors.push(`Row ${i + 1}: scenario "${row.scenario}" not in instance scenarios: [${instanceScenarios.join(', ')}]`);
        continue;
      }
      
      validatedData.push({
        curveInstanceId: parseInt(curveInstanceId),
        timestamp,
        value,
        curveType: row.curveType,
        commodity: row.commodity,
        scenario: row.scenario,
        units: row.units || csvUnits || 'Unknown',
        flags: row.flags || []
      });
    }

    if (errors.length > 0) {
      console.error('Validation errors:', errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation errors in price data',
          validationErrors: errors.slice(0, 10), // Only return first 10 errors
          totalErrors: errors.length,
          validatedCount: validatedData.length,
          totalCount: priceData.length,
          instanceInfo: {
            curveTypes: curveInstance.curveTypes,
            commodities: curveInstance.commodities,
            scenarios: curveInstance.scenarios
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (validatedData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid price data to upload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing curve data for this instance (if any)
    await prisma.curveData.deleteMany({
      where: { curveInstanceId: parseInt(curveInstanceId) }
    });

    // Insert curve data - one row per (timestamp, curveType, commodity, scenario) combination
    // Use createMany for better performance
    await prisma.curveData.createMany({
      data: validatedData
    });
    
    const insertedCount = validatedData.length;

    const result = { count: insertedCount };

    // Update instance status to ACTIVE and persist units into metadata if available
    const nextMetadata: any = {
      ...(curveInstance.metadata as any || {})
    };
    if (csvUnits) {
      nextMetadata.units = csvUnits;
    }

    await prisma.curveInstance.update({
      where: { id: parseInt(curveInstanceId) },
      data: { 
        status: 'ACTIVE',
        updatedAt: new Date(),
        metadata: nextMetadata
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsCreated: result.count,
        curveInstance: {
          id: curveInstance.id,
          curveName: curveInstance.curveDefinition.curveName,
          instanceVersion: curveInstance.instanceVersion
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error uploading price data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to upload price data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}; 