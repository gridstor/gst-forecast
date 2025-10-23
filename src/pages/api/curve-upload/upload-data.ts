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
      
      if (!row.timestamp || row.value === undefined || row.value === null) {
        errors.push(`Row ${i + 1}: Missing timestamp or value`);
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

      // Check if timestamp is within delivery period
      if (timestamp < curveInstance.deliveryPeriodStart || timestamp > curveInstance.deliveryPeriodEnd) {
        errors.push(`Row ${i + 1}: Timestamp outside delivery period`);
        continue;
      }

      // Handle p-value (default to 50 if not specified)
      const pvalue = row.pvalue ? parseInt(row.pvalue) : 50;
      
      validatedData.push({
        curveInstanceId: parseInt(curveInstanceId),
        timestamp,
        pValue: pvalue,
        value,
        flags: row.flags || []
      });
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation errors in price data',
          validationErrors: errors,
          validatedCount: validatedData.length,
          totalCount: priceData.length
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

    // Insert curve data using tall format - one row per (timestamp, pValue) combination
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