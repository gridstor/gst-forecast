import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

interface PricePoint {
  flow_date_start: string;
  value: number;
}

interface CurveUploadData {
  curveDetails: {
    location: string;
    market: string;
    markCase: string;
    markType: string;
    granularity: string;
    curveCreator: string;
    markDate: string;
    valueType: string;
    curveStartDate: string;
    curveEndDate: string;
    markFundamentalsDesc: string;
    markModelTypeDesc: string;
    markDispatchOptimizationDesc: string;
    gridstorPurpose: string;
    curve_bess_duration?: number;
  };
  pricePoints: PricePoint[];
}

export const post: APIRoute = async ({ request }) => {
  try {
    const data = await request.json() as CurveUploadData;

    // Validate request data
    if (!data.curveDetails || !data.pricePoints || !Array.isArray(data.pricePoints)) {
      return new Response(JSON.stringify({ error: 'Invalid request data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create or update curve schedule
    const schedule = await prisma.curve_schedule.upsert({
      where: {
        id: 1 // You might want to adjust this based on your needs
      },
      create: {
        curvePattern: `${data.curveDetails.location}_${data.curveDetails.market}`,
        location: data.curveDetails.location,
        sourceType: data.curveDetails.markType,
        provider: data.curveDetails.curveCreator,
        granularity: data.curveDetails.granularity,
        modelType: data.curveDetails.markModelTypeDesc,
        updateFrequency: 'daily', // Default value, adjust as needed
        responsibleTeam: 'Trading', // Default value, adjust as needed
        importance: 1, // Default value, adjust as needed
        lastReceivedDate: new Date(),
        description: `${data.curveDetails.markFundamentalsDesc} - ${data.curveDetails.markDispatchOptimizationDesc}`
      },
      update: {
        lastReceivedDate: new Date(),
        lastUpdatedDate: new Date()
      }
    });

    // Log update history
    await prisma.curve_update_history.create({
      data: {
        scheduleId: schedule.id,
        updateDate: new Date(),
        updatedBy: data.curveDetails.curveCreator,
        status: 'completed',
        notes: `Uploaded curve for ${data.curveDetails.location} - ${data.curveDetails.market}`,
      }
    });

    // Log receipt
    await prisma.curve_receipt.create({
      data: {
        scheduleId: schedule.id,
        receivedDate: new Date(),
        receivedBy: data.curveDetails.curveCreator,
        processingStatus: 'completed',
        notes: `Received ${data.pricePoints.length} price points`
      }
    });

    // Create curve definition and price forecasts
    const curveDefinition = await prisma.curve_definitions.create({
      data: {
        markType: data.curveDetails.markType,
        markCase: data.curveDetails.markCase,
        markDate: new Date(data.curveDetails.markDate),
        location: data.curveDetails.location,
        market: data.curveDetails.market,
        curveCreator: data.curveDetails.curveCreator,
        granularity: data.curveDetails.granularity,
        curveStartDate: new Date(data.curveDetails.curveStartDate),
        curveEndDate: new Date(data.curveDetails.curveEndDate),
      }
    });

    // Create price forecasts
    const priceForecastsData = data.pricePoints.map(point => ({
      curveId: curveDefinition.curve_id,
      markCase: data.curveDetails.markCase,
      flowDateStart: new Date(point.flow_date_start),
      value: point.value,
      location: data.curveDetails.location,
      curveCreator: data.curveDetails.curveCreator,
      valueType: data.curveDetails.valueType,
      markDate: new Date(data.curveDetails.markDate)
    }));

    await prisma.price_forecasts.createMany({
      data: priceForecastsData
    });

    return new Response(JSON.stringify({ 
      success: true, 
      curveId: curveDefinition.curve_id,
      scheduleId: schedule.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing curve upload:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 