# GridStor Design System - Quick Reference

## 🚀 5-Minute Quick Start

### 1. Add Navigation
```tsx
import { NavigationBar } from './components/NavigationBar';

<NavigationBar currentPath="/" />
```

### 2. Import Components
```tsx
import { MarketCard } from './components/MarketCard';
import { SectionHeader } from './components/SectionHeader';
```

### 3. Create a Section
```tsx
<section className="py-12 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeader
      title="Your Title"
      description="Your description"
    />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Cards go here */}
    </div>
  </div>
</section>
```

### 4. Add a Card
```tsx
<MarketCard
  marketName="Your Card Title"
  accentColor="blue"
  metrics={[
    { label: 'Metric 1', value: '1,234', unit: 'units' },
    { label: 'Metric 2', value: '56.7%' },
    { label: 'Metric 3', value: '$890' },
    { label: 'Metric 4', value: '12.3' },
  ]}
/>
```

---

## 🎨 Accent Colors Cheat Sheet

| Color | Hex | When to Use |
|-------|-----|-------------|
| `blue` | `#3B82F6` | Primary data, CAISO, technology |
| `red` | `#EF4444` | Critical, ERCOT, alerts |
| `green` | `#10B981` | Revenue, success, SPP |
| `purple` | `#8B5CF6` | Admin, special features |
| `gray` | `#6B7280` | Neutral, inactive |

**Usage:**
```tsx
accentColor="blue"  // Just use the color name
```

---

## 📦 Metric Box Variants

| Variant | Background Color | When to Use |
|---------|-----------------|-------------|
| `neutral` | Gray-50 | Default metrics |
| `success` | Green-50 | Revenue, positive results |
| `warning` | Yellow-50 | Alerts, targets, projections |
| `info` | Blue-50 | Informational data |

**Usage:**
```tsx
metrics={[
  { label: 'Revenue', value: '$42M', variant: 'success' },
  { label: 'Target', value: '$50M', variant: 'warning' },
]}
```

---

## 📐 Common Layouts

### Three-Column Grid (Default)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <MarketCard {...} />
  <MarketCard {...} />
  <MarketCard {...} />
</div>
```

### Two-Column Wide
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <MarketCard {...} />
  <MarketCard {...} />
</div>
```

### Four-Column (Small Cards)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <MarketCard {...} />
  <MarketCard {...} />
  <MarketCard {...} />
  <MarketCard {...} />
</div>
```

---

## 🎯 Card Complexity Levels

### Level 1: Minimal (Fastest)
```tsx
<MarketCard
  marketName="Simple Card"
  accentColor="blue"
  metrics={[
    { label: 'Metric', value: '123' },
    { label: 'Metric', value: '456' },
  ]}
/>
```

### Level 2: Standard
```tsx
<MarketCard
  marketName="Standard Card"
  accentColor="green"
  timestamp="Oct 17, 2025 2:45 PM"
  metrics={[...]}
  summaryLeft={{ label: 'Total', value: '$123' }}
  summaryRight={{ label: 'Change', value: '+5%' }}
/>
```

### Level 3: Full-Featured
```tsx
<MarketCard
  marketName="Complete Card"
  badge="REGION"
  accentColor="blue"
  timestamp="Oct 17, 2025 2:45 PM"
  yoyChange={12.5}
  metrics={[...]}
  highlightedMetric={...}
  summaryLeft={...}
  summaryRight={...}
  finalHighlight={...}
/>
```

---

## 📊 Charts Quick Start

### Add a Line Chart
```tsx
import { LineChartExample } from './components/templates/LineChartExample';

// Use as-is or copy and customize
<LineChartExample />
```

### Add a Bar Chart
```tsx
import { BarChartExample } from './components/templates/BarChartExample';

// Use as-is or copy and customize
<BarChartExample />
```

### Custom Chart with ChartCard
```tsx
import { ChartCard } from './components/ChartCard';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

<ChartCard
  title="Your Chart Title"
  accentColor="blue"
  timestamp="Oct 17, 2025 3:00 PM"
>
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={yourData}>
      <XAxis dataKey="month" />
      <YAxis />
      <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
</ChartCard>
```

**Chart Colors:** Use GridStor palette colors (blue, red, green, purple, orange)

**See full guide:** `/components/templates/ChartTemplatesGuide.md`

---

## 🔢 Data Formatting Guidelines

### Currency
```tsx
value: '$7.85'        // ✅ Good
value: '7.85'         // ❌ Missing $
value: '$7.8500'      // ❌ Too many decimals
```

### Percentages
```tsx
value: '87.3%'        // ✅ Good
value: '87%'          // ✅ Also good
value: '0.873'        // ❌ Use percentage format
```

### Large Numbers
```tsx
value: '42,851'       // ✅ Good (with commas)
value: '42851'        // ⚠️ Works but harder to read
value: '42.9K'        // ✅ Good for very large numbers
```

### Units
```tsx
{ label: 'Price', value: '$7.85', unit: '$/kW-month' }  // ✅ Good
{ label: 'Price', value: '$7.85/kW-month' }             // ❌ Put units separately
```

---

## 🎨 Section Backgrounds

```tsx
// White background (default)
<section className="py-12 bg-white">

// Off-white (alternate sections)
<section className="py-12 bg-[#F9FAFB]">
```

**Pro tip:** Alternate between white and off-white for visual separation.

---

## 📋 Component Props Quick Lookup

### MarketCard
```tsx
marketName: string           // Required
accentColor: AccentColor     // Required: 'blue'|'red'|'green'|'purple'|'gray'
badge?: string               // Optional category badge
timestamp?: string           // Optional last updated time
yoyChange?: number           // Optional YoY percentage (+ or -)
metrics: Metric[]            // Array of metrics (2x2 grid)
highlightedMetric?: Metric   // Optional full-width highlight
summaryLeft?: Summary        // Optional left summary metric
summaryRight?: Summary       // Optional right summary metric
finalHighlight?: Highlight   // Optional bottom 2-col highlight
```

### MetricBox
```tsx
label: string                // Metric label (displayed uppercase)
value: string | number       // Value to display
unit?: string                // Optional unit
variant?: 'neutral'|'success'|'warning'|'info'
```

### SectionHeader
```tsx
title: string                // Section title
description?: string         // Optional description
```

---

## 🚨 Common Mistakes to Avoid

❌ **Don't** mix accent colors on related cards  
✅ **Do** use consistent colors for related data

❌ **Don't** use more than 4 metrics in the main grid  
✅ **Do** use 4 metrics (2x2 grid) or add more sections

❌ **Don't** forget responsive classes  
✅ **Do** use: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

❌ **Don't** manually style text sizes  
✅ **Do** rely on the existing typography scale

❌ **Don't** put units inline with values  
✅ **Do** use the separate `unit` prop

---

## 📁 File Locations

```
Components:
  /components/MarketCard.tsx
  /components/MetricBox.tsx
  /components/SectionHeader.tsx
  /components/YoYIndicator.tsx
  /components/MarketBadge.tsx

Templates:
  /components/templates/DashboardSection.tsx
  /components/templates/MarketOverviewSection.tsx
  /components/templates/PerformanceSection.tsx
  /components/templates/TwoColumnSection.tsx
  /components/templates/TemplateShowcase.tsx

Documentation:
  /guidelines/GridStor-Design-System.md (Full guide)
  /guidelines/Quick-Reference.md (This file)

Styles:
  /styles/globals.css (Design tokens)
```

---

## 🎓 Learning Path

1. **Start here:** Copy `DashboardSection.tsx` template
2. **Customize data:** Replace placeholder values
3. **Add features:** Try `highlightedMetric` or `summaryLeft`
4. **Experiment:** Try different `accentColor` and `variant` options
5. **Reference:** Check `App.tsx` for complete examples

---

## 🔗 Need More Help?

- **Full Documentation:** See `/guidelines/GridStor-Design-System.md`
- **Working Examples:** See `/App.tsx`
- **Template Library:** See `/components/templates/`
- **Design Tokens:** See `/styles/globals.css`

---

## ⚡ Copy-Paste Starter

```tsx
import React from 'react';
import { MarketCard } from './components/MarketCard';
import { SectionHeader } from './components/SectionHeader';

export default function MyNewSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="My Dashboard"
          description="Description goes here"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MarketCard
            marketName="My First Card"
            accentColor="blue"
            metrics={[
              { label: 'Total', value: '1,234' },
              { label: 'Active', value: '567' },
              { label: 'Rate', value: '45.8%' },
              { label: 'Score', value: '8.9' },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
```

**Now replace the placeholder data and you're done!** 🎉
