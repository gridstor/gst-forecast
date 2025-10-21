/**
 * GridStor Analytics Design System - Complete Showcase
 * 
 * This file demonstrates all components and patterns in the design system.
 * Use this as a reference when building your own analytics dashboards.
 * 
 * Quick Links:
 * - Full Documentation: /guidelines/GridStor-Design-System.md
 * - Quick Reference: /guidelines/Quick-Reference.md
 * - Templates: /components/templates/
 * 
 * To get started:
 * 1. Copy a template from /components/templates/
 * 2. Customize the data for your needs
 * 3. Reference this file for examples
 */

import React from 'react';
import { NavigationBar } from './components/NavigationBar';
import { MarketCard } from './components/MarketCard';
import { SectionHeader } from './components/SectionHeader';
import { LineChartExample } from './components/templates/LineChartExample';
import { BarChartExample } from './components/templates/BarChartExample';

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <NavigationBar
        currentPath="/"
        onSettingsClick={() => alert('Settings clicked!')}
      />
      {/* Market Performance Overview Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Market Performance Overview"
            description="Real-time analytics and performance metrics across regional electricity markets"
          />

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CAISO Market Card */}
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

            {/* ERCOT Market Card */}
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
              highlightedMetric={{
                label: 'Annual Revenue Potential',
                value: '$149.4M',
                variant: 'warning',
              }}
              summaryLeft={{
                label: 'Projected Total',
                value: '$13.10',
                unit: '$/kW-month',
              }}
              summaryRight={{
                label: 'vs Forecast',
                value: '-$0.85',
              }}
              finalHighlight={{
                leftLabel: 'Total Capacity',
                leftValue: '2,150 MW',
                rightLabel: 'Active Projects',
                rightValue: '24',
              }}
            />

            {/* SPP Market Card */}
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
              highlightedMetric={{
                label: 'Annual Revenue Potential',
                value: '$71.0M',
                variant: 'warning',
              }}
              summaryLeft={{
                label: 'Projected Total',
                value: '$6.28',
                unit: '$/kW-month',
              }}
              summaryRight={{
                label: 'vs Forecast',
                value: '+$0.22',
              }}
              finalHighlight={{
                leftLabel: 'Total Capacity',
                leftValue: '950 MW',
                rightLabel: 'Active Projects',
                rightValue: '12',
              }}
            />
          </div>
        </div>
      </section>

      {/* Line Chart Example */}
      <LineChartExample />

      {/* Bar Chart Example */}
      <BarChartExample />
    </div>
  );
}
