/**
 * TEMPLATE SHOWCASE
 * 
 * This file demonstrates all the available templates and patterns.
 * Use this as a reference when building your own sections.
 * 
 * To use a template:
 * 1. Import the template component
 * 2. Copy the relevant section from this file
 * 3. Customize the data for your needs
 * 
 * Available Templates:
 * - DashboardSection: Basic 3-column grid
 * - MarketOverviewSection: Full-featured market cards
 * - PerformanceSection: System performance tracking
 * - TwoColumnSection: Wide layout for detailed data
 */

import React from 'react';
import { DashboardSection } from './DashboardSection';
import { MarketOverviewSection } from './MarketOverviewSection';
import { PerformanceSection } from './PerformanceSection';
import { TwoColumnSection } from './TwoColumnSection';

export function TemplateShowcase() {
  return (
    <div className="min-h-screen bg-white">
      {/* Example 1: Basic Dashboard */}
      <DashboardSection />
      
      {/* Example 2: Market Overview (with alternating background) */}
      <div className="bg-[#F9FAFB]">
        <MarketOverviewSection />
      </div>
      
      {/* Example 3: Performance Section */}
      <PerformanceSection />
      
      {/* Example 4: Two-Column Layout */}
      <TwoColumnSection />
    </div>
  );
}

/**
 * QUICK COPY-PASTE SNIPPETS
 * 
 * Copy these snippets directly into your code:
 */

// Snippet 1: Basic Section with 3 Cards
export function BasicThreeCardSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Import: import { SectionHeader } from './components/SectionHeader'; */}
        {/* Import: import { MarketCard } from './components/MarketCard'; */}
        
        {/* Add your cards here - see DashboardSection.tsx for examples */}
      </div>
    </section>
  );
}

// Snippet 2: Alternating Background Sections
export function AlternatingBackgrounds() {
  return (
    <>
      <section className="py-12 bg-white">
        {/* White background section */}
      </section>
      
      <section className="py-12 bg-[#F9FAFB]">
        {/* Off-white background section */}
      </section>
    </>
  );
}

// Snippet 3: Single Metric Box (standalone use)
export function StandaloneMetricExample() {
  return (
    <div className="p-6">
      {/* Import: import { MetricBox } from './components/MetricBox'; */}
      {/* <MetricBox
        label="Total Revenue"
        value="$142.5M"
        unit="this quarter"
        variant="success"
      /> */}
    </div>
  );
}
