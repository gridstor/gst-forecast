/**
 * TEMPLATE: Basic Dashboard Section
 * 
 * Copy this template and customize the cards for your needs.
 * This shows a standard 3-column responsive grid with basic metric cards.
 */

import React from 'react';
import { MarketCard } from '../MarketCard';
import { SectionHeader } from '../SectionHeader';

export function DashboardSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Your Dashboard Title"
          description="Replace with your section description"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 - Replace with your data */}
          <MarketCard
            marketName="Card Title 1"
            accentColor="blue"
            metrics={[
              { label: 'Metric Name', value: '1,234', unit: 'units' },
              { label: 'Percentage', value: '56.7%' },
              { label: 'Currency', value: '$890', unit: 'per unit' },
              { label: 'Decimal', value: '12.3' },
            ]}
          />
          
          {/* Card 2 - Replace with your data */}
          <MarketCard
            marketName="Card Title 2"
            accentColor="green"
            metrics={[
              { label: 'Metric Name', value: '5,678', unit: 'units' },
              { label: 'Percentage', value: '78.9%' },
              { label: 'Currency', value: '$1,234', unit: 'per unit' },
              { label: 'Decimal', value: '45.6' },
            ]}
          />
          
          {/* Card 3 - Replace with your data */}
          <MarketCard
            marketName="Card Title 3"
            accentColor="purple"
            metrics={[
              { label: 'Metric Name', value: '9,012', unit: 'units' },
              { label: 'Percentage', value: '91.2%' },
              { label: 'Currency', value: '$2,345', unit: 'per unit' },
              { label: 'Decimal', value: '67.8' },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
