import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for CSV row
const CurveRowSchema = z.object({
  flow_start_date: z.string(),
  granularity: z.string(),
  mark_date: z.string(),
  mark_type: z.string(),
  mark_case: z.string(),
  value: z.string(),
  units: z.string(),
  location: z.string(),
  market: z.string()
});

export const post: APIRoute = async ({ request }) => {
  try {
    if (!request.body) {
      return new Response('No file uploaded', { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Validate CSV structure
    for (const record of records) {
      try {
        CurveRowSchema.parse(record);
      } catch (err) {
        const error = err as z.ZodError;
        return new Response(`Invalid CSV format: ${error.message}`, { status: 400 });
      }
    }

    // Process records in a transaction
    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        // Find or create curve definition
        let curveDefinition = await tx.curve_definitions.findFirst({
          where: {
            mark_type: record.mark_type,
            mark_case: record.mark_case,
            mark_date: new Date(record.mark_date),
            location: record.location,
            market: record.market
          }
        });

        if (!curveDefinition) {
          curveDefinition = await tx.curve_definitions.create({
            data: {
              mark_type: record.mark_type,
              mark_case: record.mark_case,
              mark_date: new Date(record.mark_date),
              location: record.location,
              market: record.market,
              granularity: record.granularity,
              curve_start_date: new Date(record.flow_start_date),
              curve_end_date: new Date(record.flow_start_date),
              curve_creator: 'CSV_UPLOAD'
            }
          });
        } else {
          // Update the curve end date if needed
          const newEndDate = new Date(record.flow_start_date);
          if (curveDefinition.curve_end_date && newEndDate > curveDefinition.curve_end_date) {
            await tx.curve_definitions.update({
              where: { curve_id: curveDefinition.curve_id },
              data: { curve_end_date: newEndDate }
            });
          }
        }

        // Create price forecast entry
        await tx.price_forecasts.create({
          data: {
            curve_id: curveDefinition.curve_id,
            flow_date_start: new Date(record.flow_start_date),
            mark_date: new Date(record.mark_date),
            value: parseFloat(record.value),
            units: record.units,
            location: record.location,
            mark_case: record.mark_case,
            curve_creator: 'CSV_UPLOAD',
            value_type: record.mark_type
          }
        });
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully processed ${records.length} records` 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    const error = err as Error;
    console.error('Upload error:', error);
    return new Response(`Upload failed: ${error.message}`, { status: 500 });
  }
}; 