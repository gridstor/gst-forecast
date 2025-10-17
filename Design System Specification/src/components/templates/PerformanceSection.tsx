/**
 * TEMPLATE: Performance Tracking Section
 * 
 * For system status, performance metrics, and operational data.
 * Uses success variants for positive metrics.
 */

import React from 'react';
import { MarketCard } from '../MarketCard';
import { SectionHeader } from '../SectionHeader';

export function PerformanceSection() {
  return (
    <section className="py-12 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="System Performance"
          description="Real-time performance monitoring and system health"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Status Card */}
          <MarketCard
            marketName="System Status"
            accentColor="purple"
            timestamp="Oct 17, 2025 2:50 PM"
            metrics={[
              {
                label: 'Total Capacity',
                value: '4,350',
                unit: 'MW',
              },
              {
                label: 'Available',
                value: '4,102',
                unit: 'MW',
              },
              {
                label: 'In Maintenance',
                value: '248',
                unit: 'MW',
              },
              {
                label: 'Efficiency',
                value: '94.3%',
              },
            ]}
            summaryLeft={{
              label: 'Avg Round-Trip',
              value: '89.2%',
            }}
            summaryRight={{
              label: 'Uptime',
              value: '99.7%',
            }}
            finalHighlight={{
              leftLabel: 'Energy Cycled',
              leftValue: '2.8 GWh',
              rightLabel: 'Total Sites',
              rightValue: '54',
            }}
          />

          {/* Revenue Card */}
          <MarketCard
            marketName="Revenue Summary"
            accentColor="green"
            yoyChange={15.3}
            metrics={[
              {
                label: 'Energy Arbitrage',
                value: '$42.5M',
                variant: 'success',
              },
              {
                label: 'Capacity Revenue',
                value: '$78.3M',
                variant: 'success',
              },
              {
                label: 'Ancillary Services',
                value: '$18.7M',
                variant: 'success',
              },
              {
                label: 'Total Revenue',
                value: '$139.5M',
              },
            ]}
            highlightedMetric={{
              label: 'Projected Annual Revenue',
              value: '$314.8M',
              variant: 'success',
            }}
          />

          {/* Operations Card */}
          <MarketCard
            marketName="Operations"
            accentColor="blue"
            metrics={[
              {
                label: 'Active Projects',
                value: '42',
              },
              {
                label: 'Pending Review',
                value: '8',
              },
              {
                label: 'Completed',
                value: '156',
              },
              {
                label: 'Success Rate',
                value: '98.5%',
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
