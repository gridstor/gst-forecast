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

// Validation schema for step-by-step upload
const StepByStepUploadSchema = z.object({
  curveDetails: z.object({
    mark_type: z.string(),
    mark_case: z.string(),
    mark_date: z.string(),
    location: z.string(),
    market: z.string(),
    granularity: z.string(),
    curve_start_date: z.string(),
    curve_end_date: z.string(),
    curve_creator: z.string(),
    mark_fundamentals_desc: z.string().optional(),
    mark_model_type_desc: z.string().optional(),
    mark_dispatch_optimization_desc: z.string().optional(),
    gridstor_purpose: z.string().optional(),
    value_type: z.string()
  }),
  pricePoints: z.array(z.object({
    flow_date_start: z.string(),
    value: z.number()
  }))
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle CSV upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response('No file uploaded', { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
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
          return new Response(JSON.stringify({ error: `Invalid CSV format: ${error.message}` }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
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
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (contentType?.includes('application/json')) {
      // Handle step-by-step upload
      const data = await request.json();
      
      try {
        const validatedData = StepByStepUploadSchema.parse(data);
        
        // Process in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create curve definition
          const curveDefinition = await tx.curve_definitions.create({
            data: {
              mark_type: validatedData.curveDetails.mark_type,
              mark_case: validatedData.curveDetails.mark_case,
              mark_date: new Date(validatedData.curveDetails.mark_date),
              location: validatedData.curveDetails.location,
              market: validatedData.curveDetails.market,
              granularity: validatedData.curveDetails.granularity,
              curve_start_date: new Date(validatedData.curveDetails.curve_start_date),
              curve_end_date: new Date(validatedData.curveDetails.curve_end_date),
              curve_creator: validatedData.curveDetails.curve_creator,
              mark_fundamentals_desc: validatedData.curveDetails.mark_fundamentals_desc || null,
              mark_model_type_desc: validatedData.curveDetails.mark_model_type_desc || null,
              mark_dispatch_optimization_desc: validatedData.curveDetails.mark_dispatch_optimization_desc || null,
              gridstor_purpose: validatedData.curveDetails.gridstor_purpose || null,
              value_type: validatedData.curveDetails.value_type
            }
          });

          // Create price forecasts
          for (const point of validatedData.pricePoints) {
            await tx.price_forecasts.create({
              data: {
                curve_id: curveDefinition.curve_id,
                flow_date_start: new Date(point.flow_date_start),
                mark_date: new Date(validatedData.curveDetails.mark_date),
                value: point.value,
                units: 'USD/MWh', // Default unit for step-by-step upload
                location: validatedData.curveDetails.location,
                mark_case: validatedData.curveDetails.mark_case,
                curve_creator: 'STEP_BY_STEP_UPLOAD',
                value_type: validatedData.curveDetails.mark_type
              }
            });
          }

          return curveDefinition;
        });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Successfully created curve',
          curveId: result.curve_id
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (err) {
        const error = err as z.ZodError;
        return new Response(JSON.stringify({ error: `Invalid data format: ${error.message}` }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unsupported content type' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const error = err as Error;
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: `Upload failed: ${error.message}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}; 