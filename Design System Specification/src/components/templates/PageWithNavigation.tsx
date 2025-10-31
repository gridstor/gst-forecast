/**
 * TEMPLATE: Page with Navigation
 * 
 * Complete page layout example showing how to use NavigationBar
 * with the GridStor Design System components.
 * 
 * Usage:
 * - Copy this template as a starting point for new pages
 * - Update currentPath to match your route
 * - Replace content with your own sections and cards
 */

import React from 'react';
import { NavigationBar } from '../NavigationBar';
import { SectionHeader } from '../SectionHeader';
import { MarketCard } from '../MarketCard';

export function PageWithNavigation() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <NavigationBar
        currentPath="/long-term-outlook"
        onSettingsClick={() => {
          // Handle settings click
          console.log('Settings clicked');
          // You could open a modal, navigate to settings, etc.
        }}
      />

      {/* Main Content */}
      <main>
        {/* Section 1: Market Overview */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Market Performance Overview"
              description="Real-time analytics and performance metrics"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Example Card 1 */}
              <MarketCard
                marketName="CAISO"
                badge="TB4"
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
              />

              {/* Example Card 2 */}
              <MarketCard
                marketName="ERCOT"
                badge="WEST"
                accentColor="red"
                timestamp="Oct 17, 2025 2:43 PM"
                yoyChange={-3.2}
                metrics={[
                  {
                    label: 'Current Price',
                    value: '$12.45',
                    unit: '$/kW-month',
                  },
                  {
                    label: 'Peak Demand',
                    value: '68,422',
                    unit: 'MW',
                  },
                  {
                    label: 'Avg Settlement',
                    value: '$11.28',
                    unit: '$/kW-month',
                  },
                  {
                    label: 'Utilization',
                    value: '91.8%',
                  },
                ]}
              />

              {/* Example Card 3 */}
              <MarketCard
                marketName="SPP"
                badge="SOUTH"
                accentColor="green"
                timestamp="Oct 17, 2025 2:40 PM"
                yoyChange={8.7}
                metrics={[
                  {
                    label: 'Current Price',
                    value: '$5.92',
                    unit: '$/kW-month',
                  },
                  {
                    label: 'Peak Demand',
                    value: '35,284',
                    unit: 'MW',
                  },
                  {
                    label: 'Avg Settlement',
                    value: '$5.15',
                    unit: '$/kW-month',
                  },
                  {
                    label: 'Utilization',
                    value: '82.5%',
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Performance Tracking */}
        <section className="py-12 bg-[#F9FAFB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Performance Tracking"
              description="Key performance indicators and system metrics"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Two-column layout example */}
              <MarketCard
                marketName="System Performance"
                accentColor="purple"
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
                    label: 'Efficiency',
                    value: '94.3%',
                  },
                ]}
              />

              <MarketCard
                marketName="Revenue Metrics"
                accentColor="green"
                metrics={[
                  {
                    label: 'Total Revenue',
                    value: '$139.5M',
                    variant: 'success',
                  },
                  {
                    label: 'YTD Growth',
                    value: '+15.3%',
                    variant: 'success',
                  },
                  {
                    label: 'Projected Annual',
                    value: '$314.8M',
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Optional Footer */}
      <footer className="bg-[#F9FAFB] border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-500 text-sm text-center m-0">
            © 2025 GridStor Analytics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
