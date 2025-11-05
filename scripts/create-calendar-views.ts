/**
 * Create Calendar and Schedule Management Views
 * 
 * This script creates the database views needed for the curve delivery calendar.
 * Run this script after curves have been added to ensure the calendar displays them.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating Calendar and Schedule Management Views...\n');

  try {
    console.log('⚙️  Creating schedule_management view...');
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW "Forecasts".schedule_management AS
      SELECT 
          cs.id as schedule_id,
          cd.id as curve_definition_id,
          cd."curveName",
          cd.market,
          cd.location,
          cd.product,
          cd."batteryDuration",
          cs."scheduleType",
          cs.frequency,
          cs."dayOfWeek",
          cs."dayOfMonth",
          cs."timeOfDay",
          cs."leadTimeDays",
          cs."freshnessDays",
          cs."responsibleTeam",
          cs."notificationEmails",
          cs.importance,
          cs."isActive",
          cs."validFrom",
          cs."validUntil",
          cs."createdAt",
          cs."updatedAt",
          
          latest_instance.id as latest_instance_id,
          latest_instance."instanceVersion" as latest_version,
          latest_instance."forecastRunDate" as last_run_date,
          latest_instance."deliveryPeriodStart" as latest_delivery_start,
          latest_instance."deliveryPeriodEnd" as latest_delivery_end,
          latest_instance.status as instance_status,
          latest_instance."curveTypes",
          latest_instance.commodities,
          latest_instance.scenarios,
          latest_instance.granularity,
          
          CASE 
              WHEN latest_instance."forecastRunDate" IS NULL THEN CURRENT_TIMESTAMP
              WHEN cs.frequency = 'HOURLY' THEN latest_instance."forecastRunDate" + INTERVAL '1 hour'
              WHEN cs.frequency = 'DAILY' THEN latest_instance."forecastRunDate" + INTERVAL '1 day'
              WHEN cs.frequency = 'WEEKLY' THEN latest_instance."forecastRunDate" + INTERVAL '7 days'
              WHEN cs.frequency = 'MONTHLY' THEN latest_instance."forecastRunDate" + INTERVAL '1 month'
              WHEN cs.frequency = 'QUARTERLY' THEN latest_instance."forecastRunDate" + INTERVAL '3 months'
              WHEN cs.frequency = 'ANNUALLY' THEN latest_instance."forecastRunDate" + INTERVAL '1 year'
              ELSE latest_instance."forecastRunDate" + INTERVAL '30 days'
          END as next_delivery_due,
          
          CASE 
              WHEN latest_instance.id IS NULL THEN 'PENDING'
              WHEN latest_instance.status = 'DRAFT' THEN 'IN_PROGRESS'
              WHEN latest_instance.status IN ('PENDING_APPROVAL', 'APPROVED') THEN 'SCHEDULED'
              WHEN latest_instance.status = 'ACTIVE' THEN 'COMPLETED'
              WHEN latest_instance.status IN ('SUPERSEDED', 'EXPIRED') THEN 'SUPERSEDED'
              WHEN latest_instance.status = 'FAILED' THEN 'FAILED'
              ELSE 'PENDING'
          END as schedule_status,
          
          CASE 
              WHEN latest_instance."forecastRunDate" IS NULL THEN 
                  CURRENT_TIMESTAMP > (cs."validFrom" + (cs."leadTimeDays" || ' days')::INTERVAL)
              WHEN cs.frequency = 'HOURLY' THEN 
                  CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '1 hour' + (cs."leadTimeDays" || ' days')::INTERVAL)
              WHEN cs.frequency = 'DAILY' THEN 
                  CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '1 day' + (cs."leadTimeDays" || ' days')::INTERVAL)
              WHEN cs.frequency = 'WEEKLY' THEN 
                  CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '7 days' + (cs."leadTimeDays" || ' days')::INTERVAL)
              WHEN cs.frequency = 'MONTHLY' THEN 
                  CURRENT_TIMESTAMP > (latest_instance."forecastRunDate" + INTERVAL '1 month' + (cs."leadTimeDays" || ' days')::INTERVAL)
              ELSE false
          END as is_overdue,
          
          COALESCE(instance_stats.total_instances, 0) as total_instances,
          COALESCE(instance_stats.active_instances, 0) as active_instances
          
      FROM "Forecasts"."CurveSchedule" cs
      INNER JOIN "Forecasts"."CurveDefinition" cd ON cd.id = cs."curveDefinitionId"
      LEFT JOIN LATERAL (
          SELECT * FROM "Forecasts"."CurveInstance" ci
          WHERE ci."curveDefinitionId" = cs."curveDefinitionId"
          ORDER BY ci."forecastRunDate" DESC, ci."createdAt" DESC
          LIMIT 1
      ) latest_instance ON true
      LEFT JOIN LATERAL (
          SELECT 
              COUNT(*) as total_instances,
              COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_instances
          FROM "Forecasts"."CurveInstance" ci
          WHERE ci."curveDefinitionId" = cs."curveDefinitionId"
      ) instance_stats ON true
      WHERE cd."isActive" = true
    `;
    console.log('✅ schedule_management view created');

    console.log('⚙️  Creating schedule_calendar view...');
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW "Forecasts".schedule_calendar AS
      SELECT 
          ROW_NUMBER() OVER (ORDER BY ci."deliveryPeriodStart", cd.id) as event_id,
          cd.id as curve_definition_id,
          ci.id as curve_instance_id,
          cs.id as schedule_id,
          
          ci."deliveryPeriodStart" as event_date,
          ci."deliveryPeriodEnd" as event_end_date,
          ci."forecastRunDate" as forecast_date,
          
          cd."curveName" as title,
          CONCAT(
              cd."curveName", ' - ',
              cd.market, ' ',
              cd.location, 
              CASE WHEN ci.granularity IS NOT NULL THEN ' (' || ci.granularity || ')' ELSE '' END
          ) as description,
          
          cd.market,
          cd.location,
          cd.product,
          cd."batteryDuration",
          ci."curveTypes",
          ci.commodities,
          ci.scenarios,
          ci.granularity,
          ci."degradationType",
          
          ci.status as instance_status,
          cs."responsibleTeam",
          cs.importance,
          cs.frequency,
          
          CASE 
              WHEN ci.status = 'DRAFT' THEN 'orange'
              WHEN ci.status = 'PENDING_APPROVAL' THEN 'yellow'
              WHEN ci.status = 'APPROVED' THEN 'blue'
              WHEN ci.status = 'ACTIVE' THEN 'green'
              WHEN ci.status IN ('SUPERSEDED', 'EXPIRED') THEN 'gray'
              WHEN ci.status = 'FAILED' THEN 'red'
              ELSE 'gray'
          END as event_color,
          
          CASE 
              WHEN ci.status = 'DRAFT' THEN '🟠'
              WHEN ci.status = 'PENDING_APPROVAL' THEN '🟡'
              WHEN ci.status = 'APPROVED' THEN '🔵'
              WHEN ci.status = 'ACTIVE' THEN '✅'
              WHEN ci.status IN ('SUPERSEDED', 'EXPIRED') THEN '⚫'
              WHEN ci.status = 'FAILED' THEN '❌'
              ELSE '⚪'
          END as status_icon,
          
          CONCAT('/curves/view/', ci.id) as event_url,
          
          ci."createdBy",
          ci."approvedBy",
          ci."approvedAt",
          ci."createdAt",
          ci."updatedAt",
          ci.notes
          
      FROM "Forecasts"."CurveInstance" ci
      INNER JOIN "Forecasts"."CurveDefinition" cd ON cd.id = ci."curveDefinitionId"
      LEFT JOIN "Forecasts"."CurveSchedule" cs ON cs."curveDefinitionId" = cd.id AND cs."isActive" = true
      WHERE cd."isActive" = true
      ORDER BY ci."deliveryPeriodStart" DESC, cd."curveName"
    `;
    console.log('✅ schedule_calendar view created');

    console.log('⚙️  Creating upcoming_deliveries view...');
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW "Forecasts".upcoming_deliveries AS
      SELECT * FROM "Forecasts".schedule_calendar
      WHERE event_date >= CURRENT_DATE 
        AND event_date <= CURRENT_DATE + INTERVAL '90 days'
      ORDER BY event_date
    `;
    console.log('✅ upcoming_deliveries view created');

    console.log('⚙️  Creating overdue_deliveries view...');
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW "Forecasts".overdue_deliveries AS
      SELECT 
          sm.*,
          CURRENT_DATE - DATE(sm.next_delivery_due) as days_overdue
      FROM "Forecasts".schedule_management sm
      WHERE sm.is_overdue = true
        AND sm.schedule_status != 'COMPLETED'
      ORDER BY sm.next_delivery_due
    `;
    console.log('✅ overdue_deliveries view created');

    console.log('⚙️  Creating schedules_needing_attention view...');
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW "Forecasts".schedules_needing_attention AS
      SELECT * FROM "Forecasts".schedule_management
      WHERE schedule_status IN ('PENDING', 'IN_PROGRESS', 'SCHEDULED')
        AND "isActive" = true
        AND ("validUntil" IS NULL OR "validUntil" > CURRENT_TIMESTAMP)
      ORDER BY 
          CASE WHEN is_overdue THEN 1 ELSE 2 END,
          importance DESC,
          next_delivery_due
    `;
    console.log('✅ schedules_needing_attention view created');

    console.log('\n📊 Checking created views...\n');

    // Verify the views were created
    const scheduleManagement = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "Forecasts".schedule_management
    `;
    console.log(`✅ schedule_management view: ${scheduleManagement[0]?.count || 0} records`);

    const scheduleCalendar = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "Forecasts".schedule_calendar
    `;
    console.log(`✅ schedule_calendar view: ${scheduleCalendar[0]?.count || 0} records`);

    const upcomingDeliveries = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "Forecasts".upcoming_deliveries
    `;
    console.log(`✅ upcoming_deliveries view: ${upcomingDeliveries[0]?.count || 0} records`);

    // Show sample calendar events
    console.log('\n📅 Sample Calendar Events:\n');
    const sampleEvents = await prisma.$queryRaw<any[]>`
      SELECT 
        event_date,
        title,
        market,
        location,
        instance_status,
        status_icon
      FROM "Forecasts".schedule_calendar
      ORDER BY event_date DESC
      LIMIT 5
    `;

    if (sampleEvents.length > 0) {
      sampleEvents.forEach((event: any) => {
        console.log(`  ${event.status_icon} ${event.event_date.toLocaleDateString()} - ${event.title}`);
        console.log(`     ${event.market} | ${event.location} | Status: ${event.instance_status}`);
      });
    } else {
      console.log('  No calendar events found. Add curve instances to see them here.');
    }

    console.log('\n✨ Calendar views created successfully!');
    console.log('\n📌 Next Steps:');
    console.log('   1. Visit /curve-schedule/manage to see the calendar');
    console.log('   2. Create curve instances with delivery dates to populate the calendar');
    console.log('   3. The calendar will automatically show all curves with delivery dates\n');

  } catch (error) {
    console.error('\n❌ Error creating calendar views:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

