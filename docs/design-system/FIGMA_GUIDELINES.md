# 🎯 **GridStor Analytics Design Guidelines**
## Internal Analytics Platform Design System

---

## **🏢 About GridStor Analytics**

### **Our Mission**
GridStor Analytics is the internal intelligence division of GridStor, America's leading utility-scale battery energy storage company. We provide critical market intelligence, revenue forecasting, and risk analysis to support GridStor's strategic decision-making across CAISO, ERCOT, and SPP markets.

### **Our Focus Areas**
- **Revenue Forecasting** - Long, medium, and short-term revenue projections using fundamentals, heuristics, and stochastic modeling
- **Market Fundamentals** - Real-time tracking of supply, demand, transmission, and regulatory factors
- **Risk Metrics** - Comprehensive risk assessment and scenario modeling
- **Transmission & Outages** - Grid reliability monitoring and impact analysis
- **Market Intelligence** - Third-party vendor curve tracking, futures market data, and competitive analysis

### **Our Users**
Internal stakeholders including executives, project developers, financial analysts, operations teams, and trading professionals who need quick access to complex energy market data and forecasts.

---

## **🎨 Design Philosophy**

### **Core Principles**

#### **1. Data-First Design**
- **Clarity Over Decoration** - Every design element serves the data
- **Hierarchy Matters** - Most critical information gets visual priority
- **Context is King** - Always provide context for numbers and trends
- **Progressive Disclosure** - Show summary first, details on demand

#### **2. Professional Intelligence**
- **Enterprise Grade** - Serious, reliable, trustworthy appearance
- **Technical Precision** - Exact specifications, no approximations
- **Clean Aesthetics** - Minimal visual noise, maximum information density
- **Consistent Patterns** - Predictable interactions across all features

#### **3. Operational Efficiency**
- **Speed of Understanding** - Users should grasp key insights in seconds
- **Workflow Optimization** - Support rapid analysis and decision-making
- **Multi-Screen Friendly** - Designed for traders with multiple monitors
- **Always Accessible** - Critical information available 24/7

#### **4. GridStor Brand Alignment**
- **Internal Tool Identity** - Professional but not sales-focused
- **Brand Consistency** - Aligned with GridStor's clean, modern aesthetic
- **Energy Industry Standards** - Familiar patterns for energy professionals
- **Scalable Design** - Grows with our expanding market presence

---

## **🌈 Color Strategy & Psychology**

### **Primary Brand Colors**

#### **GridStor Dark (#2A2A2A)**
- **Psychology**: Authority, reliability, technical precision
- **Usage**: Primary headers, critical alerts, main navigation
- **Energy Context**: Represents the solid foundation of our infrastructure
- **Avoid**: Large backgrounds (can feel overwhelming)

#### **GridStor Blue (#34D5ED)**
- **Psychology**: Innovation, clarity, energy flow
- **Usage**: Brand accents, data highlights, positive indicators
- **Energy Context**: Represents clean energy and forward momentum
- **Avoid**: Text on white (insufficient contrast)

#### **Professional White (#FFFFFF)**
- **Psychology**: Clarity, space, analytical thinking
- **Usage**: Primary backgrounds, card surfaces, clean data presentation
- **Energy Context**: Represents the clean slate for data analysis
- **Avoid**: Pure white on pure white (no definition)

### **Interactive & Functional Colors**

#### **Action Indigo (#4F46E5)**
- **Psychology**: Confidence, decision-making, control
- **Usage**: Primary buttons, links, active states, focus indicators
- **Energy Context**: Represents taking action on market opportunities
- **Accessibility**: Meets WCAG AA standards on white backgrounds

#### **Success Green (#10B981)**
- **Psychology**: Positive outcomes, profitable scenarios, system health
- **Usage**: Positive revenue indicators, successful operations, uptime status
- **Energy Context**: Green energy, positive cash flows, operational success

#### **Warning Orange (#F59E0B)**
- **Psychology**: Attention, caution, important information
- **Usage**: Market alerts, maintenance windows, moderate risk indicators
- **Energy Context**: Grid stress, price volatility, attention needed

#### **Critical Red (#EF4444)**
- **Psychology**: Urgency, risk, system failures
- **Usage**: Outages, high-risk scenarios, critical alerts, negative performance
- **Energy Context**: Grid emergencies, financial losses, system failures

#### **Information Blue (#3B82F6)**
- **Psychology**: Knowledge, analysis, neutral information
- **Usage**: General information, help text, neutral market data
- **Energy Context**: Market intelligence, analytical insights

### **Neutral Gray Palette**

Our 10-step gray system provides sophisticated hierarchy for complex data:

- **Gray 50 (#F9FAFB)**: Page backgrounds, subtle containers
- **Gray 100 (#F3F4F6)**: Card backgrounds, disabled states
- **Gray 200 (#E5E7EB)**: Borders, dividers, table lines
- **Gray 300 (#D1D5DB)**: Subtle borders, inactive elements
- **Gray 400 (#9CA3AF)**: Placeholder text, secondary icons
- **Gray 500 (#6B7280)**: Secondary text, metadata, timestamps
- **Gray 600 (#4B5563)**: Body text, descriptions
- **Gray 700 (#374151)**: Headings, important labels
- **Gray 800 (#1F2937)**: Primary headings, emphasis
- **Gray 900 (#111827)**: Primary text, highest contrast

---

## **📊 Data Visualization Color Strategy**

### **Chart Color Sequence**
1. **Primary (#4F46E5)** - Main dataset, primary forecasts
2. **Brand Blue (#34D5ED)** - Secondary dataset, historical data
3. **Success (#10B981)** - Positive scenarios, best case
4. **Warning (#F59E0B)** - Caution scenarios, volatility
5. **Critical (#EF4444)** - Risk scenarios, worst case
6. **Purple (#8B5CF6)** - Additional datasets, comparisons

### **Market-Specific Colors**
- **CAISO**: Blue tones (reliability, California innovation)
- **ERCOT**: Orange tones (Texas energy, market dynamics)
- **SPP**: Green tones (regional cooperation, wind energy)

### **Financial Data Colors**
- **Revenue**: Green spectrum (profit association)
- **Costs**: Red spectrum (expense association)
- **Margins**: Blue spectrum (analytical neutrality)

---

## **✍️ Typography for Energy Analytics**

### **Font Strategy**

#### **Inter - Primary UI Font**
- **Rationale**: Designed for screens, excellent readability at all sizes
- **Usage**: All interface text, data labels, navigation
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Characteristics**: Clean, modern, professional, highly legible

#### **JetBrains Mono - Data Font**
- **Rationale**: Monospace ensures proper alignment of numerical data
- **Usage**: Data tables, code, IDs, timestamps, technical values
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Characteristics**: Excellent for tabular data, clear number differentiation

### **Hierarchy for Energy Data**

#### **Display Typography (Marketing/Overview)**
- **H1 (36px/40px, Bold)**: Homepage hero, major section titles
- **H2 (30px/36px, SemiBold)**: Page titles, dashboard sections
- **H3 (24px/32px, SemiBold)**: Widget titles, major subsections

#### **Functional Typography (Data/Interface)**
- **H4 (20px/28px, SemiBold)**: Form sections, table headers
- **H5 (18px/28px, Medium)**: Card titles, data group labels
- **H6 (16px/24px, Medium)**: Form labels, small headings

#### **Content Typography**
- **Body Large (18px/28px)**: Important descriptions, key insights
- **Body Default (16px/24px)**: Standard text, form inputs
- **Body Small (14px/20px)**: Helper text, metadata, secondary info
- **Caption (12px/16px)**: Timestamps, fine print, data sources

#### **Data Typography**
- **Data Large (16px/24px, Mono)**: Primary data values, key metrics
- **Data Default (14px/20px, Mono)**: Table data, secondary metrics
- **Data Small (12px/16px, Mono)**: Compact tables, IDs, codes

---

## **📐 Spacing & Layout for Analytics**

### **8px Grid System**
Based on multiples of 8px for consistent, harmonious spacing:
- **4px (xs)**: Tight spacing, icon padding
- **8px (sm)**: Component internal spacing
- **12px (md)**: Related element spacing
- **16px (lg)**: Standard component spacing
- **24px (xl)**: Section spacing
- **32px (2xl)**: Major section breaks
- **48px (3xl)**: Page section spacing

### **Data-Dense Layout Principles**

#### **Information Density**
- **High-Value Real Estate**: Above-the-fold for critical metrics
- **Scannable Layouts**: F-pattern and Z-pattern reading flows
- **Grouped Information**: Related data clustered together
- **White Space**: Strategic use to prevent cognitive overload

#### **Dashboard Layout Patterns**
- **Hero Metrics**: Top row, largest visual weight
- **Supporting Data**: Secondary rows, consistent sizing
- **Detailed Analysis**: Expandable sections, progressive disclosure
- **Context Information**: Sidebars, timestamps, data sources

---

## **🎯 Component Design Standards**

### **Buttons for Analytics Actions**

#### **Primary Button**
- **Use Case**: Main actions (Generate Forecast, Run Analysis, Export Data)
- **Appearance**: #4F46E5 background, white text, 6px radius
- **States**: Hover (#4338CA), Focus (ring), Disabled (gray)
- **Sizing**: Minimum 36px height, 8px/16px padding

#### **Secondary Button**
- **Use Case**: Alternative actions (View Details, Compare, Filter)
- **Appearance**: Transparent background, #4F46E5 text, gray border
- **States**: Hover (light background), Focus (ring)

#### **Danger Button**
- **Use Case**: Destructive actions (Delete Forecast, Reset Data)
- **Appearance**: #EF4444 background, white text
- **Usage**: Require confirmation dialogs

### **Data Input Components**

#### **Form Fields**
- **Standard Input**: White background, gray border, 40px height
- **Focus State**: Indigo border with focus ring
- **Error State**: Red border with error message
- **Disabled State**: Gray background, reduced opacity

#### **Dropdowns & Selects**
- **Market Selector**: CAISO, ERCOT, SPP options
- **Time Range**: Predefined ranges plus custom
- **Data Sources**: Third-party vendors, internal models
- **Forecast Types**: Revenue, risk, fundamentals

### **Data Display Components**

#### **Metric Cards**
- **Primary Metrics**: Large numbers, clear labels, trend indicators
- **Secondary Metrics**: Smaller format, grouped display
- **Status Indicators**: Color-coded health/status dots
- **Trend Arrows**: Up/down indicators with percentage changes

#### **Tables for Energy Data**
- **Header Styling**: Gray background, uppercase labels, sorting indicators
- **Row Styling**: Alternating backgrounds, hover states
- **Number Alignment**: Right-aligned for proper comparison
- **Units**: Consistently displayed, abbreviated when space limited

#### **Charts & Visualizations**
- **Line Charts**: Time series data, forecasts vs actuals
- **Bar Charts**: Comparative data, market performance
- **Heat Maps**: Geographic data, correlation matrices
- **Scatter Plots**: Risk/return analysis, correlation studies

---

## **📱 Responsive Design for Multi-Screen Trading**

### **Desktop-First Approach**
Energy traders and analysts typically use multiple large monitors:

#### **Large Desktop (>1280px)**
- **Multi-column layouts**: 3-4 column dashboards
- **Dense data tables**: Full detail visibility
- **Side-by-side comparisons**: Multiple charts/datasets
- **Persistent navigation**: Always visible menu

#### **Standard Desktop (1024px-1280px)**
- **Two-column layouts**: Main content + sidebar
- **Condensed tables**: Essential columns only
- **Stacked charts**: Vertical arrangement
- **Collapsible navigation**: Space optimization

#### **Tablet (768px-1024px)**
- **Single column**: Stacked layout
- **Touch-friendly**: Larger tap targets
- **Swipe navigation**: Horizontal scrolling for tables
- **Modal details**: Overlay pattern for deep data

#### **Mobile (< 768px)**
- **Card-based layout**: Stacked information cards
- **Summary focus**: Key metrics only
- **Progressive disclosure**: Tap to expand details
- **Native patterns**: iOS/Android conventions

---

## **♿ Accessibility for Professional Users**

### **Color Accessibility**
- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: Never rely solely on color to convey information
- **Status Indicators**: Use icons + color for system status
- **Data Visualization**: Patterns + color for chart differentiation

### **Keyboard Navigation**
- **Tab Order**: Logical flow through interface
- **Focus Indicators**: Clear visual focus states
- **Keyboard Shortcuts**: Power user efficiency
- **Skip Links**: Quick navigation to main content

### **Screen Reader Support**
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Descriptive labels for complex data
- **Table Headers**: Proper association for data tables
- **Live Regions**: Dynamic content announcements

---

## **🏠 Homepage Design Direction**

### **Homepage Objectives**
1. **Quick Access Hub**: Fast navigation to key analytics areas
2. **System Status Overview**: At-a-glance operational health
3. **Market Snapshot**: Current conditions across CAISO, ERCOT, SPP
4. **Recent Insights**: Latest forecasts, alerts, and analysis
5. **Professional Identity**: Clearly GridStor Analytics, not external sales

### **Content Strategy**

#### **Hero Section**
- **Title**: "GridStor Analytics Intelligence Platform"
- **Subtitle**: "Real-time market intelligence and revenue forecasting for utility-scale battery storage across CAISO, ERCOT, and SPP markets"
- **Visual**: Clean, data-focused design with subtle energy imagery
- **No CTA**: This is an internal tool, not a sales page

#### **Key Analytics Areas** (Inspired by GridStor's Services Layout)
1. **Revenue Forecasting**
   - Long, medium, and short-term revenue projections
   - Fundamentals, heuristics, and stochastic modeling
   - Scenario analysis and risk assessment

2. **Market Fundamentals**
   - Supply and demand analysis
   - Regulatory impact assessment
   - Price formation analysis

3. **Risk Metrics**
   - Portfolio risk assessment
   - Scenario modeling
   - Stress testing and sensitivity analysis

4. **Transmission & Outages**
   - Grid reliability monitoring
   - Outage impact analysis
   - Transmission constraint tracking

5. **Market Intelligence**
   - Third-party vendor curve tracking
   - Futures market data integration
   - Competitive landscape analysis

#### **Our Markets** (Inspired by GridStor's Markets Section)
- **CAISO**: California Independent System Operator
- **ERCOT**: Electric Reliability Council of Texas
- **SPP**: Southwest Power Pool

#### **Live Data Previews**
- **Current Market Conditions**: Real-time price indicators
- **System Status**: Operational health across all systems
- **Recent Forecasts**: Latest model runs and updates
- **Alert Summary**: Active warnings and notifications

### **Visual Approach**
- **Clean, Professional**: More analytical than the main GridStor site
- **Data Visualization**: Subtle charts and metrics as visual interest
- **GridStor Brand**: Consistent with parent company but clearly internal
- **Functional Beauty**: Every element serves the user's analytical needs

---

## **🎨 Figma Implementation Guide**

### **File Organization**
```
📁 GridStor Analytics Design System
├── 📄 Cover & Guidelines (this document)
├── 📁 Foundation
│   ├── Colors (all swatches with usage notes)
│   ├── Typography (text styles for all scales)
│   ├── Spacing (8px grid system)
│   └── Icons (energy and analytics specific)
├── 📁 Components
│   ├── Buttons (all variants and states)
│   ├── Forms (inputs, selects, validation)
│   ├── Data Display (tables, cards, metrics)
│   ├── Navigation (headers, tabs, breadcrumbs)
│   └── Charts (visualization components)
├── 📁 Patterns
│   ├── Dashboard Layouts
│   ├── Data Tables
│   ├── Form Patterns
│   └── Modal/Dialog Patterns
└── 📁 Templates
    ├── Homepage Template
    ├── Dashboard Template
    ├── Analysis Page Template
    └── Data Table Template
```

### **Component Naming Convention**
- **Colors**: `Color/Brand/GridStor Blue` or `Color/Functional/Success`
- **Typography**: `Text/Display/Large` or `Text/Data/Default`
- **Components**: `Button/Primary/Default` or `Input/Text/Focus`
- **Layouts**: `Layout/Dashboard/3-Column` or `Layout/Page/Standard`

### **Responsive Variants**
- **Desktop**: Primary design target
- **Tablet**: Condensed layouts
- **Mobile**: Simplified, card-based

---

## **✅ Design Review Checklist**

### **Brand Alignment**
- [ ] Consistent with GridStor's professional energy focus
- [ ] Clearly internal tool (not sales-oriented)
- [ ] Appropriate for energy industry professionals

### **Functionality**
- [ ] Data-first design approach
- [ ] Clear information hierarchy
- [ ] Efficient workflows for analysts
- [ ] Accessible to all users

### **Technical Standards**
- [ ] Meets WCAG 2.1 AA accessibility standards
- [ ] Proper color contrast ratios
- [ ] Consistent spacing using 8px grid
- [ ] Responsive across all target devices

### **Energy Industry Context**
- [ ] Familiar patterns for energy professionals
- [ ] Appropriate data visualization techniques
- [ ] Clear market and time context
- [ ] Professional analytical appearance

---

This design system ensures GridStor Analytics maintains a professional, data-focused identity that supports our mission of providing critical market intelligence for America's energy storage future.