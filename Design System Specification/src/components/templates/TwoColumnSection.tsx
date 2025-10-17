/**
 * TEMPLATE: Two-Column Wide Layout
 * 
 * For detailed analytics that need more horizontal space.
 * Cards are wider and stack on mobile.
 */

import React from 'react';
import { MarketCard } from '../MarketCard';
import { SectionHeader } from '../SectionHeader';

export function TwoColumnSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Detailed Analytics"
          description="In-depth performance metrics and comparisons"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column Card */}
          <MarketCard
            marketName="Performance Overview"
            accentColor="blue"
            timestamp="Oct 17, 2025 2:45 PM"
            yoyChange={8.5}
            metrics={[
              {
                label: 'Total Volume',
                value: '1,234,567',
                unit: 'units',
              },
              {
                label: 'Growth Rate',
                value: '12.5%',
              },
              {
                label: 'Revenue',
                value: '$4.2M',
                variant: 'success',
              },
              {
                label: 'Margin',
                value: '34.8%',
              },
            ]}
            highlightedMetric={{
              label: 'Projected Annual Target',
              value: '$52.5M',
              variant: 'warning',
            }}
            finalHighlight={{
              leftLabel: 'YTD Revenue',
              leftValue: '$28.4M',
              rightLabel: 'Target Progress',
              rightValue: '54.1%',
            }}
          />
          
          {/* Right Column Card */}
          <MarketCard
            marketName="Market Analysis"
            accentColor="green"
            timestamp="Oct 17, 2025 2:43 PM"
            metrics={[
              {
                label: 'Market Share',
                value: '28.5%',
              },
              {
                label: 'Competitors',
                value: '14',
              },
              {
                label: 'Customer Sat.',
                value: '4.7/5',
              },
              {
                label: 'NPS Score',
                value: '+42',
              },
            ]}
            highlightedMetric={{
              label: 'Market Position',
              value: '#2',
              variant: 'info',
            }}
            finalHighlight={{
              leftLabel: 'Total Customers',
              leftValue: '12,450',
              rightLabel: 'New This Month',
              rightValue: '342',
            }}
          />
        </div>
      </div>
    </section>
  );
}
