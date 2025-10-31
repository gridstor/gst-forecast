# GridStor Design System Templates

This folder contains ready-to-use templates for common dashboard patterns.

## 📦 Available Templates

### `DashboardSection.tsx`
**Use for:** Basic metric dashboards, overview screens

**Features:**
- 3-column responsive grid
- Simple metric cards
- Fast to customize

**Copy this when:** You need a quick dashboard with 3-6 cards showing basic metrics.

---

### `MarketOverviewSection.tsx`
**Use for:** Comprehensive market analysis, detailed KPI tracking

**Features:**
- Full-featured market cards
- All optional elements (timestamp, YoY, highlights, summaries)
- Professional market presentation

**Copy this when:** You need detailed market performance tracking with all bells and whistles.

---

### `PerformanceSection.tsx`
**Use for:** System monitoring, performance tracking, operational metrics

**Features:**
- Multiple card types in one section
- Success variants for positive metrics
- Operational focus

**Copy this when:** You're building system status dashboards or performance monitors.

---

### `TwoColumnSection.tsx`
**Use for:** Detailed analytics, side-by-side comparisons

**Features:**
- Wide 2-column layout
- More horizontal space per card
- Good for complex metrics

**Copy this when:** Your cards need more room or you want direct comparisons.

---

### `TemplateShowcase.tsx`
**Use for:** Reference and examples

**Features:**
- Shows all templates in use
- Copy-paste snippets
- Pattern library

**Copy this when:** You need to see how everything works together.

---

### `LineChartExample.tsx`
**Use for:** Time-series data, trends over time, historical analysis

**Features:**
- Multiple data series support
- Custom GridStor tooltips
- Responsive design
- Clean, professional styling

**Copy this when:** You need to visualize trends, changes over time, or compare multiple metrics.

---

### `BarChartExample.tsx`
**Use for:** Categorical comparisons, grouped data, regional analysis

**Features:**
- Multiple bar groups
- Stacked or grouped bars
- Custom formatted tooltips
- Region/category comparisons

**Copy this when:** You need to compare values across categories or show data composition.

---

## 🚀 How to Use Templates

### Step 1: Choose Your Template
Pick the template that matches your use case from the list above.

### Step 2: Copy the File
Copy the entire template file to your working location:

```tsx
// Example: Copy DashboardSection.tsx
import { DashboardSection } from './components/templates/DashboardSection';

// Use it in your app
<DashboardSection />
```

### Step 3: Customize the Data
Replace the placeholder data with your real data:

```tsx
// Before (placeholder):
metrics={[
  { label: 'Metric Name', value: '1,234', unit: 'units' },
]}

// After (your data):
metrics={[
  { label: 'Active Users', value: '12,450', unit: 'users' },
]}
```

### Step 4: Adjust the Layout (if needed)
Change colors, add/remove cards, modify sections as needed.

---

## 💡 Quick Customization Guide

### Change Section Background
```tsx
// White background
<section className="py-12 bg-white">

// Off-white background
<section className="py-12 bg-[#F9FAFB]">
```

### Change Card Accent Color
```tsx
accentColor="blue"    // CAISO, primary
accentColor="red"     // ERCOT, critical
accentColor="green"   // SPP, success
accentColor="purple"  // Admin
accentColor="gray"    // Neutral
```

### Change Grid Layout
```tsx
// 3 columns (default)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 2 columns (wider cards)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// 4 columns (smaller cards)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
```

### Add/Remove Card Features
```tsx
// Minimal card
<MarketCard
  marketName="Simple"
  accentColor="blue"
  metrics={[...]}
/>

// Add timestamp
<MarketCard
  timestamp="Oct 17, 2025 2:45 PM"
  // ... other props
/>

// Add YoY indicator
<MarketCard
  yoyChange={12.5}  // Positive number = green up arrow
  // ... other props
/>

// Add highlighted metric
<MarketCard
  highlightedMetric={{
    label: 'Annual Target',
    value: '$52.5M',
    variant: 'warning',
  }}
  // ... other props
/>
```

---

## 🎨 Mixing and Matching

You can combine elements from different templates:

```tsx
// Take the layout from TwoColumnSection
// But use cards from PerformanceSection
<section className="py-12 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeader title="Custom Section" />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card from PerformanceSection */}
      <MarketCard
        marketName="Revenue Summary"
        accentColor="green"
        metrics={[...]}
      />
      
      {/* Your custom card */}
      <MarketCard
        marketName="Custom Metrics"
        accentColor="blue"
        metrics={[...]}
      />
    </div>
  </div>
</section>
```

---

## 📚 Common Patterns

### Pattern: Alternating Sections
```tsx
{/* Section 1: White background */}
<DashboardSection />

{/* Section 2: Off-white background */}
<div className="bg-[#F9FAFB]">
  <PerformanceSection />
</div>

{/* Section 3: White background */}
<TwoColumnSection />
```

### Pattern: Mixed Card Complexity
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Simple card */}
  <MarketCard marketName="Quick Stats" accentColor="gray" metrics={[...]} />
  
  {/* Medium card */}
  <MarketCard marketName="Performance" accentColor="blue" timestamp="..." metrics={[...]} />
  
  {/* Complex card */}
  <MarketCard marketName="Full Details" accentColor="green" timestamp="..." yoyChange={8.5} metrics={[...]} highlightedMetric={...} />
</div>
```

### Pattern: Progressive Disclosure
```tsx
{/* High-level overview */}
<DashboardSection />

{/* Detailed breakdown */}
<TwoColumnSection />

{/* Deep dive */}
<MarketOverviewSection />
```

---

## ✅ Pre-flight Checklist

Before using a template in production:

- [ ] Replaced all placeholder data
- [ ] Updated section title and description
- [ ] Chose appropriate accent colors
- [ ] Verified metric values are formatted correctly
- [ ] Tested responsive behavior (mobile/tablet/desktop)
- [ ] Checked that all imports are correct
- [ ] Removed unused props
- [ ] Added meaningful labels and units

---

## 🆘 Troubleshooting

**Template not showing up?**
- Check import path is correct
- Ensure all component dependencies are imported

**Layout looks broken?**
- Verify you're using the responsive grid classes
- Check that the section wrapper has proper padding

**Data not displaying correctly?**
- Ensure values are strings or numbers, not objects
- Check that metric arrays have the correct structure

**Colors not matching?**
- Use exact accent color names from the system
- Don't create custom colors (use the 5 provided)

---

## 📖 Learn More

- **Complete Guide:** `/guidelines/GridStor-Design-System.md`
- **Quick Reference:** `/guidelines/Quick-Reference.md`
- **Live Examples:** `/App.tsx`
- **Component Docs:** See individual component files

---

## 🎯 Next Steps

1. ✅ Browse the available templates
2. ✅ Copy one that fits your needs
3. ✅ Customize with your data
4. ✅ Reference the full documentation as needed
5. ✅ Build amazing dashboards!

Need help? Check the documentation files in `/guidelines/` or review the examples in `App.tsx`.
