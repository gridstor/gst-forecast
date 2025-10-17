# GridStor Analytics Design System

## 📚 Documentation Available

This project includes a complete design system for building professional analytics dashboards. All documentation is located in the `/guidelines/` folder.

### Quick Links

- **[Quick Start Guide](./Quick-Reference.md)** - Get started in 5 minutes with copy-paste templates
- **[Complete Documentation](./GridStor-Design-System.md)** - Full design system specification
- **[Main README](./README.md)** - Navigation hub for all documentation

### Component Library

The design system includes:
- **NavigationBar** - Global navigation header with lightning bolt logo
- **MarketCard** - Main data display cards with customizable sections
- **MetricBox** - Individual metric displays with variant backgrounds
- **SectionHeader** - Consistent section titles and descriptions
- **YoYIndicator** - Trend indicators with icons
- **MarketBadge** - Category tags
- **ChartCard** - Wrapper for chart components

### Ready-to-Use Templates

Located in `/components/templates/`:
- `DashboardSection.tsx` - Basic 3-column grid layout
- `MarketOverviewSection.tsx` - Full-featured market cards
- `PerformanceSection.tsx` - System performance tracking
- `TwoColumnSection.tsx` - Wide layout for detailed data

### Key Design Principles

1. **Data-First Approach** - Metrics take center stage
2. **Monospaced Numbers** - All data uses JetBrains Mono font
3. **Consistent Spacing** - 8px base unit system
4. **Professional Aesthetic** - Clean, enterprise-grade design
5. **Responsive by Default** - Works on all screen sizes

### Getting Started

1. Import components: `import { MarketCard, SectionHeader } from './components';`
2. Copy a template from `/components/templates/`
3. Customize with your data
4. Reference documentation as needed

For complete details, see the documentation files in `/guidelines/`.
<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
