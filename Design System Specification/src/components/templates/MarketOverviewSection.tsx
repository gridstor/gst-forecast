/**
 * TEMPLATE: Market Overview Section
 * 
 * Full-featured market cards with all optional elements.
 * Use this for comprehensive dashboards with detailed metrics.
 */

import React from 'react';
import { MarketCard } from '../MarketCard';
import { SectionHeader } from '../SectionHeader';

export function MarketOverviewSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Market Performance Overview"
          description="Comprehensive market analytics and performance tracking"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Full-Featured Market Card Template */}
          <MarketCard
            marketName="Market Name"
            badge="REGION"
            accentColor="blue"
            timestamp="Oct 17, 2025 2:45 PM"
            yoyChange={12.5}
            metrics={[
              {
                label: 'Current Price',
                value: '$7.85',
                unit: '$/kW-month',
              },
              {
                label: 'Peak Demand',
                value: '42,851',
                unit: 'MW',
              },
              {
                label: 'Avg Settlement',
                value: '$6.42',
                unit: '$/kW-month',
              },
              {
                label: 'Utilization',
                value: '87.3%',
              },
            ]}
            highlightedMetric={{
              label: 'Annual Revenue Potential',
              value: '$94.2M',
              variant: 'warning',
            }}
            summaryLeft={{
              label: 'Projected Total',
              value: '$8.32',
              unit: '$/kW-month',
            }}
            summaryRight={{
              label: 'vs Forecast',
              value: '+$0.45',
            }}
            finalHighlight={{
              leftLabel: 'Total Capacity',
              leftValue: '1,250 MW',
              rightLabel: 'Active Projects',
              rightValue: '18',
            }}
          />

          {/* Add more cards as needed */}
        </div>
      </div>
    </section>
  );
}
