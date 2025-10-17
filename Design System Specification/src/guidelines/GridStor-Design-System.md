# GridStor Analytics Design System

## Quick Start Guide

This design system provides a complete set of components and patterns for building data-rich analytics interfaces with a professional, enterprise aesthetic.

---

## 🎨 Core Design Principles

1. **Clean & Professional** - Minimalist with purposeful accents
2. **Data-First** - Clear hierarchy and readable metrics
3. **Consistent Spacing** - 8px base unit system
4. **Monospaced Numbers** - All data values use JetBrains Mono
5. **Floating Cards** - Subtle shadows and hover effects

---

## 📦 Available Components

### Primary Components

#### `<MarketCard>`
The main data display card with customizable sections and accent colors.

**Props:**
- `marketName` - Card title (required)
- `badge` - Optional category badge
- `accentColor` - Left border color: 'blue' | 'red' | 'green' | 'purple' | 'gray'
- `timestamp` - Last updated timestamp
- `yoyChange` - Year-over-year percentage change (shows +/- indicator)
- `metrics` - Array of metric objects (2x2 grid)
- `highlightedMetric` - Full-width highlighted metric
- `summaryLeft` - Left summary metric
- `summaryRight` - Right summary metric
- `finalHighlight` - Bottom 2-column highlight box

#### `<MetricBox>`
Individual metric display with label, value, and unit.

**Props:**
- `label` - Metric label (displayed uppercase)
- `value` - Numeric or text value
- `unit` - Optional unit display
- `variant` - Background: 'neutral' | 'success' | 'warning' | 'info'

#### `<SectionHeader>`
Consistent section titles and descriptions.

**Props:**
- `title` - Section title
- `description` - Optional description text

#### `<YoYIndicator>`
Trend indicator with icon and value.

**Props:**
- `value` - Positive or negative number
- `format` - 'percentage' | 'value'

#### `<MarketBadge>`
Small category tag.

**Props:**
- `text` - Badge text

---

## 🎨 Color System

### Accent Colors (for MarketCard borders)

```tsx
blue:   '#3B82F6'  // CAISO, Tech, Primary
red:    '#EF4444'  // ERCOT, Alerts, Critical
green:  '#10B981'  // SPP, Success, Revenue
purple: '#8B5CF6'  // Admin, Special
gray:   '#6B7280'  // Neutral, Inactive
```

### Metric Box Variants

```tsx
neutral: Gray-50 background   // Default data
success: Green-50 background  // Positive metrics, revenue
warning: Yellow-50 background // Important alerts, potential
info:    Blue-50 background   // Informational metrics
```

---

## 📐 Layout Patterns

### Standard Section Layout

```tsx
<section className="py-12 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeader
      title="Your Section Title"
      description="Optional description"
    />
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Your cards here */}
    </div>
  </div>
</section>
```

### Alternating Backgrounds

```tsx
// White section
<section className="py-12 bg-white">

// Off-white section
<section className="py-12 bg-[#F9FAFB]">
```

---

## 📊 Common Card Patterns

### Pattern 1: Basic Metrics Card

**Use for:** Simple metric display with 2x2 grid

```tsx
<MarketCard
  marketName="Your Title"
  accentColor="blue"
  metrics={[
    { label: 'Metric 1', value: '$7.85', unit: 'unit' },
    { label: 'Metric 2', value: '42,851', unit: 'unit' },
    { label: 'Metric 3', value: '$6.42', unit: 'unit' },
    { label: 'Metric 4', value: '87.3%' },
  ]}
/>
```

### Pattern 2: Full-Featured Market Card

**Use for:** Market performance, comprehensive dashboards

```tsx
<MarketCard
  marketName="Market Name"
  badge="REGION"
  accentColor="blue"
  timestamp="Oct 17, 2025 2:45 PM"
  yoyChange={12.5}
  metrics={[
    { label: 'Current Price', value: '$7.85', unit: '$/kW-month' },
    { label: 'Peak Demand', value: '42,851', unit: 'MW' },
    { label: 'Avg Settlement', value: '$6.42', unit: '$/kW-month' },
    { label: 'Utilization', value: '87.3%' },
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
```

### Pattern 3: Status/Performance Card

**Use for:** System status, performance tracking

```tsx
<MarketCard
  marketName="System Status"
  accentColor="purple"
  timestamp="Oct 17, 2025 2:50 PM"
  metrics={[
    { label: 'Total Capacity', value: '4,350', unit: 'MW' },
    { label: 'Available', value: '4,102', unit: 'MW' },
    { label: 'In Maintenance', value: '248', unit: 'MW' },
    { label: 'Efficiency', value: '94.3%' },
  ]}
  finalHighlight={{
    leftLabel: 'Uptime',
    leftValue: '99.7%',
    rightLabel: 'Total Sites',
    rightValue: '54',
  }}
/>
```

### Pattern 4: Revenue/Financial Card

**Use for:** Financial metrics, revenue tracking

```tsx
<MarketCard
  marketName="Revenue Summary"
  accentColor="green"
  yoyChange={15.3}
  metrics={[
    { label: 'Energy Arbitrage', value: '$42.5M', variant: 'success' },
    { label: 'Capacity Revenue', value: '$78.3M', variant: 'success' },
    { label: 'Ancillary Services', value: '$18.7M', variant: 'success' },
    { label: 'Total Revenue', value: '$139.5M' },
  ]}
  highlightedMetric={{
    label: 'Projected Annual Revenue',
    value: '$314.8M',
    variant: 'success',
  }}
/>
```

---

## 🎯 Responsive Grid System

The system automatically adapts based on screen size:

- **Mobile (< 640px):** 1 column, cards stack vertically
- **Tablet (640-1024px):** 2 columns
- **Desktop (> 1024px):** 3 columns

```tsx
// Standard 3-column grid (responsive)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 2-column grid (for larger cards)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// 4-column grid (for smaller metrics)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
```

---

## ✨ Design Tokens

All design tokens are available in `styles/globals.css`:

### Spacing
```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
```

### Typography
```css
--text-xs: 0.75rem    (12px)
--text-sm: 0.875rem   (14px)
--text-base: 1rem     (16px)
--text-lg: 1.125rem   (18px)
--text-xl: 1.25rem    (20px)
--text-2xl: 1.5rem    (24px)
```

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1)
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--shadow-lg: 0 12px 30px rgba(0,0,0,0.1)
```

---

## 🔍 Typography Rules

### DO's
- ✅ Use monospace font for all numeric values
- ✅ Use uppercase for all data labels
- ✅ Use semibold (600) for card titles
- ✅ Use bold (700) for metric values
- ✅ Include units below values in smaller text

### DON'Ts
- ❌ Don't mix font families within a card
- ❌ Don't use custom font sizes (stick to the scale)
- ❌ Don't use regular weight for metric values
- ❌ Don't put units inline with values (use separate line)

---

## 🎨 Best Practices

### When to Use Which Accent Color

| Color | Use Case | Examples |
|-------|----------|----------|
| **Blue** | Primary data, technology, CAISO | Market prices, system metrics, general analytics |
| **Red** | Critical metrics, ERCOT, alerts | High-priority issues, ERCOT market, warnings |
| **Green** | Revenue, success, SPP | Financial gains, positive outcomes, SPP market |
| **Purple** | Administrative, special | System settings, admin tools, special categories |
| **Gray** | Neutral, inactive | Archived data, disabled states, general info |

### When to Use Metric Box Variants

| Variant | Background | Use Case |
|---------|------------|----------|
| **neutral** | Gray-50 | Default metrics, standard data |
| **success** | Green-50 | Positive results, revenue, gains |
| **warning** | Yellow-50 | Important alerts, projections, targets |
| **info** | Blue-50 | Informational metrics, references |

### Card Complexity Guidelines

**Simple Card (4-6 metrics):**
- Use basic metrics array only
- Good for quick overviews
- Ideal for secondary data

**Medium Card (6-8 metrics):**
- Add highlighted metric
- Include summary section
- Good for primary dashboards

**Complex Card (8-10+ metrics):**
- Full feature set
- Timestamp, YoY, highlights, summary
- Reserved for key performance indicators

---

## 🚀 Quick Copy-Paste Templates

### Template 1: Three-Card Dashboard Section

```tsx
<section className="py-12 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeader
      title="Dashboard Title"
      description="Brief description of this section"
    />
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MarketCard
        marketName="Card 1"
        accentColor="blue"
        metrics={[
          { label: 'Metric A', value: '1,234', unit: 'units' },
          { label: 'Metric B', value: '56.7%' },
          { label: 'Metric C', value: '$890', unit: 'per unit' },
          { label: 'Metric D', value: '12.3' },
        ]}
      />
      
      <MarketCard
        marketName="Card 2"
        accentColor="green"
        metrics={[
          { label: 'Metric A', value: '1,234', unit: 'units' },
          { label: 'Metric B', value: '56.7%' },
          { label: 'Metric C', value: '$890', unit: 'per unit' },
          { label: 'Metric D', value: '12.3' },
        ]}
      />
      
      <MarketCard
        marketName="Card 3"
        accentColor="purple"
        metrics={[
          { label: 'Metric A', value: '1,234', unit: 'units' },
          { label: 'Metric B', value: '56.7%' },
          { label: 'Metric C', value: '$890', unit: 'per unit' },
          { label: 'Metric D', value: '12.3' },
        ]}
      />
    </div>
  </div>
</section>
```

### Template 2: Two-Column Wide Cards

```tsx
<section className="py-12 bg-[#F9FAFB]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeader
      title="Detailed Analytics"
      description="In-depth performance metrics"
    />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MarketCard
        marketName="Performance Overview"
        accentColor="blue"
        timestamp="Oct 17, 2025 2:45 PM"
        yoyChange={8.5}
        metrics={[
          { label: 'Total Volume', value: '1,234,567', unit: 'units' },
          { label: 'Growth Rate', value: '12.5%' },
          { label: 'Revenue', value: '$4.2M', variant: 'success' },
          { label: 'Margin', value: '34.8%' },
        ]}
        highlightedMetric={{
          label: 'Projected Annual Target',
          value: '$52.5M',
          variant: 'warning',
        }}
      />
      
      <MarketCard
        marketName="Market Analysis"
        accentColor="green"
        timestamp="Oct 17, 2025 2:43 PM"
        metrics={[
          { label: 'Market Share', value: '28.5%' },
          { label: 'Competitors', value: '14' },
          { label: 'Customer Sat.', value: '4.7/5' },
          { label: 'NPS Score', value: '+42' },
        ]}
      />
    </div>
  </div>
</section>
```

---

## 📱 Accessibility & Responsiveness

### Mobile Considerations
- Cards stack vertically on mobile
- All text remains readable at 16px base size
- Touch targets are minimum 44px
- Hover effects don't interfere with touch

### Performance
- Components use CSS transforms for animations
- Shadow changes use GPU acceleration
- No unnecessary re-renders
- Optimized for 60fps interactions

---

## 🔧 Customization Guide

### Adding New Accent Colors

1. Add color to `accentColors` in `MarketCard.tsx`:
```tsx
const accentColors: Record<AccentColor, string> = {
  // ... existing colors
  orange: '#F97316',  // Add new color
};
```

2. Update the `AccentColor` type:
```tsx
export type AccentColor = 'blue' | 'red' | 'green' | 'purple' | 'gray' | 'orange';
```

### Creating Custom Metric Layouts

Use CSS Grid to create custom layouts:
```tsx
// 3-column metrics
<div className="grid grid-cols-3 gap-4">
  <MetricBox {...} />
  <MetricBox {...} />
  <MetricBox {...} />
</div>

// 1 large + 2 small
<div className="grid grid-cols-2 gap-4">
  <div className="col-span-2">
    <MetricBox {...} />
  </div>
  <MetricBox {...} />
  <MetricBox {...} />
</div>
```

---

## 📚 Component Import Paths

```tsx
import { MarketCard } from './components/MarketCard';
import { MetricBox } from './components/MetricBox';
import { SectionHeader } from './components/SectionHeader';
import { YoYIndicator } from './components/YoYIndicator';
import { MarketBadge } from './components/MarketBadge';
```

---

## ✅ Design Checklist

Before shipping any new section using this system:

- [ ] All numbers use monospace font
- [ ] All labels are uppercase
- [ ] Cards have 24px padding
- [ ] Left border is 4px wide
- [ ] Hover animation works smoothly
- [ ] Responsive grid behavior tested
- [ ] Accent colors are meaningful
- [ ] Metric boxes have appropriate backgrounds
- [ ] Section follows max-width: 1280px
- [ ] Spacing uses 16px or 24px increments

---

## 🎓 Examples

See `App.tsx` for complete working examples including:
- Market Performance Overview (3-column grid)
- Energy Storage Analytics (6 cards with various patterns)
- Both white and off-white section backgrounds
- All component variations in action

---

## 🆘 Common Issues & Solutions

**Issue:** Cards not hovering properly  
**Solution:** Ensure parent has proper z-index context

**Issue:** Numbers not monospaced  
**Solution:** Check that values are wrapped in elements with `font-mono` class or inline style

**Issue:** Grid not responsive  
**Solution:** Verify you're using the standard responsive grid classes

**Issue:** Colors don't match  
**Solution:** Use exact hex values from the color system, don't approximate

---

**Questions?** Check the complete specification in `GridStor-Design-System-Specification.md` or review working examples in `App.tsx`.
