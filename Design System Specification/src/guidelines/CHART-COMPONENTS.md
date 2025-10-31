# 📊 Chart Components - Quick Reference

This guide covers all chart-related components in the GridStor Design System.

---

## 🎯 Available Chart Types

### 1. Line Charts (`LineChartExample.tsx`)
**Best for:**
- Time-series data
- Trends over time
- Multiple metric comparisons
- Historical analysis

**Example Use Cases:**
- Market price trends
- Performance over time
- Year-over-year comparisons
- Forecast vs actuals

---

### 2. Bar Charts (`BarChartExample.tsx`)
**Best for:**
- Categorical comparisons
- Regional analysis
- Side-by-side comparisons
- Grouped data

**Example Use Cases:**
- Capacity by region
- Revenue by segment
- Market share comparison
- Project status breakdown

---

### 3. Area Charts (`AreaChartExample.tsx`)
**Best for:**
- Cumulative data
- Stacked categories
- Revenue streams
- Composition over time

**Example Use Cases:**
- Revenue breakdown
- Resource allocation
- Energy generation mix
- Cumulative metrics

---

## 🧩 Core Components

### ChartCard Component

A wrapper for charts that provides consistent styling and layout.

**Props:**
```tsx
interface ChartCardProps {
  title: string;                    // Chart title
  accentColor?: AccentColor;        // Left border color
  timestamp?: string;               // Last updated time
  description?: string;             // Subtitle/description
  children: React.ReactNode;        // Your chart
}
```

**Usage:**
```tsx
import { ChartCard } from './components/ChartCard';

<ChartCard
  title="Market Analysis"
  accentColor="blue"
  timestamp="Oct 17, 2025 3:00 PM"
  description="Monthly trends and comparisons"
>
  {/* Your chart component here */}
</ChartCard>
```

---

## 🎨 GridStor Chart Styling

### Color Palette for Charts

```tsx
Blue:    '#3B82F6'  // Primary, CAISO, main metrics
Red:     '#EF4444'  // ERCOT, critical, negative
Green:   '#10B981'  // SPP, success, positive
Purple:  '#8B5CF6'  // Special categories
Orange:  '#F59E0B'  // Warnings, maintenance
Gray:    '#6B7280'  // Neutral, inactive
```

### Typography
- **Axis labels:** Inter, 12px, color `#6B7280`
- **Axis values:** JetBrains Mono (numbers), 12px
- **Legend:** Inter, 14px
- **Tooltips:** Bold monospace for numbers

### Standard Settings
```tsx
// Grid lines
<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

// X Axis
<XAxis
  dataKey="category"
  stroke="#6B7280"
  style={{
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
  }}
/>

// Y Axis
<YAxis
  stroke="#6B7280"
  style={{
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '12px',
  }}
/>
```

---

## 📐 Chart Layouts

### Full Width
```tsx
<div className="grid grid-cols-1 gap-6">
  <ChartCard title="Full Width Chart">
    {/* Chart */}
  </ChartCard>
</div>
```

### Two Charts Side-by-Side
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <ChartCard title="Chart 1">{/* Chart */}</ChartCard>
  <ChartCard title="Chart 2">{/* Chart */}</ChartCard>
</div>
```

### Mixed: Cards + Chart
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <MarketCard {...} />
  <MarketCard {...} />
  <div className="lg:col-span-3">
    <ChartCard title="Full Width Below">
      {/* Chart */}
    </ChartCard>
  </div>
</div>
```

---

## 🎯 Custom Tooltip Template

Use this for all charts to maintain consistency:

```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-gray-900 font-semibold mb-2 m-0">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mt-1">
            <span className="text-gray-600 text-sm uppercase tracking-wide">
              {entry.name}
            </span>
            <span
              className="font-mono font-bold"
              style={{ color: entry.color || entry.fill }}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Usage
<Tooltip content={<CustomTooltip />} />
```

---

## 🚀 Quick Start Examples

### Line Chart
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './components/ChartCard';

const data = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 120 },
  // ...
];

<ChartCard title="Trend Analysis" accentColor="blue">
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
</ChartCard>
```

### Bar Chart
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './components/ChartCard';

const data = [
  { region: 'CAISO', value: 1250 },
  { region: 'ERCOT', value: 2150 },
  // ...
];

<ChartCard title="Regional Comparison" accentColor="green">
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis dataKey="region" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</ChartCard>
```

### Area Chart
```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './components/ChartCard';

const data = [
  { quarter: 'Q1', value: 100 },
  { quarter: 'Q2', value: 120 },
  // ...
];

<ChartCard title="Cumulative Growth" accentColor="purple">
  <ResponsiveContainer width="100%" height={400}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis dataKey="quarter" />
      <YAxis />
      <Tooltip />
      <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
    </AreaChart>
  </ResponsiveContainer>
</ChartCard>
```

---

## 📊 Multiple Series

### Line Chart with 3 Series
```tsx
<LineChart data={data}>
  <Line dataKey="series1" stroke="#3B82F6" strokeWidth={2} />
  <Line dataKey="series2" stroke="#EF4444" strokeWidth={2} />
  <Line dataKey="series3" stroke="#10B981" strokeWidth={2} />
</LineChart>
```

### Grouped Bar Chart
```tsx
<BarChart data={data}>
  <Bar dataKey="group1" fill="#3B82F6" />
  <Bar dataKey="group2" fill="#10B981" />
  <Bar dataKey="group3" fill="#F59E0B" />
</BarChart>
```

### Stacked Area Chart
```tsx
<AreaChart data={data}>
  <Area dataKey="layer1" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} />
  <Area dataKey="layer2" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
  <Area dataKey="layer3" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.8} />
</AreaChart>
```

---

## 📦 Complete Template Files

| Template | File Location | Use Case |
|----------|---------------|----------|
| Line Chart | `/components/templates/LineChartExample.tsx` | Time-series, trends |
| Bar Chart | `/components/templates/BarChartExample.tsx` | Comparisons, categories |
| Area Chart | `/components/templates/AreaChartExample.tsx` | Cumulative, stacked data |

**See detailed guide:** `/components/templates/ChartTemplatesGuide.md`

---

## ✅ Chart Checklist

- [ ] Wrapped in `<ChartCard>`
- [ ] Uses GridStor color palette
- [ ] Has `ResponsiveContainer` with height={400}
- [ ] Grid lines use `#E5E7EB`
- [ ] Custom tooltip implemented
- [ ] Axis labels are clear
- [ ] Numbers use monospace font
- [ ] Legend is positioned properly
- [ ] Works on mobile/tablet/desktop

---

## 🔗 Resources

- **Chart Library:** recharts (https://recharts.org/)
- **Full Examples:** `/App.tsx`
- **Templates:** `/components/templates/`
- **Detailed Guide:** `/components/templates/ChartTemplatesGuide.md`
- **Design System:** `/guidelines/GridStor-Design-System.md`

---

## 💡 Pro Tips

1. **Always use ResponsiveContainer** for mobile compatibility
2. **Set explicit height** (usually 400px) for charts
3. **Use GridStor colors** for consistency
4. **Add custom tooltips** with monospace numbers
5. **Test on different screen sizes**
6. **Keep data formatting consistent** (commas for thousands, etc.)

---

**Ready to create charts?** Copy a template from `/components/templates/` and customize!
