# Chart Templates Guide

This guide shows you how to use charts in the GridStor Design System.

---

## 📊 Available Chart Templates

### `LineChartExample.tsx`
**Best for:** Time-series data, trends over time, historical analysis

**Features:**
- Multiple data series support
- Custom tooltips with GridStor styling
- Monospaced numbers in tooltips
- Responsive container
- Clean grid lines

**Use when:** You need to show trends, changes over time, or multiple data series comparisons.

---

### `BarChartExample.tsx`
**Best for:** Categorical comparisons, grouped data, side-by-side analysis

**Features:**
- Multiple bar groups
- Stacked or grouped bars
- Custom tooltips with formatting
- Region comparisons
- Clear category labels

**Use when:** You need to compare values across categories or show composition.

---

## 🎨 Chart Design Principles

### Colors
Use the GridStor accent colors for consistency:
- **Blue** (`#3B82F6`) - Primary data, CAISO
- **Red** (`#EF4444`) - Critical metrics, ERCOT
- **Green** (`#10B981`) - Success metrics, SPP
- **Purple** (`#8B5CF6`) - Special categories
- **Orange** (`#F59E0B`) - Warning states, maintenance

### Typography
- **Axis labels:** Inter font, 12px
- **Axis values:** JetBrains Mono (numbers), 12px
- **Legend:** Inter font, 14px
- **Tooltips:** Bold monospace numbers

### Spacing
- Chart height: 400px (standard)
- Margins: `{ top: 20, right: 30, left: 20, bottom: 5 }`
- Grid lines: `#E5E7EB` with dashed style

---

## 🚀 Quick Customization

### Change Chart Data

**Line Chart:**
```tsx
const myData = [
  { month: 'Jan', series1: 100, series2: 150 },
  { month: 'Feb', series1: 120, series2: 160 },
  // ... more data
];
```

**Bar Chart:**
```tsx
const myData = [
  { category: 'A', value1: 100, value2: 80 },
  { category: 'B', value1: 150, value2: 120 },
  // ... more data
];
```

### Change Colors

```tsx
<Line
  dataKey="yourData"
  stroke="#3B82F6"  // Change this color
  strokeWidth={2}
/>

<Bar
  dataKey="yourData"
  fill="#10B981"  // Change this color
/>
```

### Change Axis Labels

```tsx
<YAxis
  label={{
    value: 'Your Label Here',
    angle: -90,
    position: 'insideLeft',
  }}
/>
```

---

## 📦 Using ChartCard

The `ChartCard` component wraps charts with consistent styling:

```tsx
import { ChartCard } from '../ChartCard';

<ChartCard
  title="Your Chart Title"
  accentColor="blue"
  timestamp="Oct 17, 2025 3:00 PM"
  description="Optional description"
>
  {/* Your chart component here */}
</ChartCard>
```

### ChartCard Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Chart title (required) |
| `accentColor` | string | Left border color: 'blue', 'red', 'green', 'purple', 'gray' |
| `timestamp` | string | Optional last updated time |
| `description` | string | Optional subtitle/description |
| `children` | ReactNode | Your chart component |

---

## 📐 Chart Layouts

### Full Width Chart
```tsx
<div className="grid grid-cols-1 gap-6">
  <ChartCard title="Wide Chart">
    {/* Chart takes full width */}
  </ChartCard>
</div>
```

### Two-Column Charts
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <ChartCard title="Chart 1">{/* Chart */}</ChartCard>
  <ChartCard title="Chart 2">{/* Chart */}</ChartCard>
</div>
```

### Mixed Layout (Cards + Charts)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <MarketCard {...} />
  <div className="lg:col-span-2">
    <ChartCard title="Wide Chart">{/* Chart */}</ChartCard>
  </div>
</div>
```

---

## 🎯 Common Chart Patterns

### Pattern 1: Time-Series Comparison

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from '../ChartCard';

const data = [
  { date: 'Jan', metricA: 100, metricB: 120 },
  { date: 'Feb', metricA: 110, metricB: 115 },
  // ... more data
];

<ChartCard
  title="Historical Comparison"
  accentColor="blue"
  description="Month-over-month trends"
>
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="metricA" stroke="#3B82F6" strokeWidth={2} />
      <Line type="monotone" dataKey="metricB" stroke="#10B981" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
</ChartCard>
```

### Pattern 2: Regional Comparison

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard } from '../ChartCard';

const data = [
  { region: 'CAISO', value: 1250 },
  { region: 'ERCOT', value: 2150 },
  { region: 'SPP', value: 950 },
];

<ChartCard
  title="Regional Distribution"
  accentColor="green"
  description="Capacity by region (MW)"
>
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

### Pattern 3: Stacked Bar Chart

```tsx
<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
  <XAxis dataKey="category" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="segment1" stackId="a" fill="#3B82F6" />
  <Bar dataKey="segment2" stackId="a" fill="#10B981" />
  <Bar dataKey="segment3" stackId="a" fill="#F59E0B" />
</BarChart>
```

---

## 🎨 Custom Tooltip Styling

Use this template for consistent tooltips:

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

// Use in chart
<Tooltip content={<CustomTooltip />} />
```

---

## 📊 Other Chart Types

### Area Chart
```tsx
import { AreaChart, Area } from 'recharts';

<AreaChart data={data}>
  <Area
    type="monotone"
    dataKey="value"
    stroke="#3B82F6"
    fill="#3B82F6"
    fillOpacity={0.2}
  />
</AreaChart>
```

### Pie Chart
```tsx
import { PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

<PieChart>
  <Pie data={data} dataKey="value" nameKey="name">
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

### Composed Chart (Line + Bar)
```tsx
import { ComposedChart, Bar, Line } from 'recharts';

<ComposedChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="bars" fill="#3B82F6" />
  <Line type="monotone" dataKey="line" stroke="#EF4444" />
</ComposedChart>
```

---

## ✅ Chart Checklist

Before using a chart in production:

- [ ] Data is formatted correctly
- [ ] Colors match GridStor palette
- [ ] Axes have proper labels
- [ ] Numbers use monospace font in tooltips
- [ ] Chart is wrapped in ChartCard
- [ ] Responsive container is used
- [ ] Grid lines use `#E5E7EB` color
- [ ] Tooltips have custom styling
- [ ] Legend is properly positioned

---

## 🔍 Troubleshooting

**Chart not displaying:**
- Check that recharts is installed: `npm install recharts`
- Verify data format matches chart requirements
- Ensure ResponsiveContainer has a height

**Colors look wrong:**
- Use exact hex values from GridStor palette
- Check stroke/fill properties on chart elements

**Tooltip not styled:**
- Ensure you're using the CustomTooltip component
- Check tooltip content prop: `<Tooltip content={<CustomTooltip />} />`

**Layout issues:**
- Add margins to chart: `margin={{ top: 20, right: 30, left: 20, bottom: 5 }}`
- Set explicit height on ResponsiveContainer

---

## 📚 Additional Resources

- **Recharts Documentation:** https://recharts.org/
- **GridStor Design System:** `/guidelines/GridStor-Design-System.md`
- **ChartCard Component:** `/components/ChartCard.tsx`
- **Examples:** `/App.tsx`

---

## 🎓 Next Steps

1. ✅ Copy `LineChartExample.tsx` or `BarChartExample.tsx`
2. ✅ Replace the data array with your data
3. ✅ Customize colors to match your use case
4. ✅ Update title, description, and labels
5. ✅ Test responsiveness on different screen sizes

**Happy charting!** 📊
