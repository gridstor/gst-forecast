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

      // Handle p-value mapping to columns
      const pvalue = row.pvalue ? parseInt(row.pvalue) : 50;
      const pValueColumnName = `valueP${pvalue}`;
      
      validatedData.push({
        curveInstanceId: parseInt(curveInstanceId),
        timestamp,
        pvalue,
        pValueColumnName,
        value,
        // units: row.units || '$/MWh', // Units not supported in database schema
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

    // Group data by timestamp to consolidate p-values
    const groupedData = new Map<string, any>();
    
    for (const record of validatedData) {
      const timestampKey = record.timestamp.toISOString();
      
      if (!groupedData.has(timestampKey)) {
        groupedData.set(timestampKey, {
          curveInstanceId: record.curveInstanceId,
          timestamp: record.timestamp,
          valueP5: null,
          valueP25: null,
          valueP50: null,
          valueP75: null,
          valueP95: null,
          value: null, // Legacy column
          // units: record.units, // Units not supported in database schema
          flags: record.flags
        });
      }
      
      const existingRecord = groupedData.get(timestampKey);
      
      // Set the appropriate p-value column
      switch (record.pvalue) {
        case 5:
          existingRecord.valueP5 = record.value;
          break;
        case 25:
          existingRecord.valueP25 = record.value;
          break;
        case 50:
          existingRecord.valueP50 = record.value;
          existingRecord.value = record.value; // Also set legacy column
          break;
        case 75:
          existingRecord.valueP75 = record.value;
          break;
        case 95:
          existingRecord.valueP95 = record.value;
          break;
      }
    }

    // Insert consolidated curve data
    let insertedCount = 0;
    for (const record of groupedData.values()) {
      // Ensure valueP50 is not null (required field)
      if (record.valueP50 === null) {
        // If no P50 provided, use any available value as fallback
        record.valueP50 = record.valueP5 || record.valueP25 || record.valueP75 || record.valueP95 || 0;
      }
      
      // Create the curve data record with only valid fields
      await prisma.curveData.create({
        data: {
          curveInstanceId: record.curveInstanceId,
          timestamp: record.timestamp,
          valueP5: record.valueP5,
          valueP25: record.valueP25,
          valueP50: record.valueP50,
          valueP75: record.valueP75,
          valueP95: record.valueP95,
          flags: record.flags
        }
      });
      insertedCount++;
    }

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