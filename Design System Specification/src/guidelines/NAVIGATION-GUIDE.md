# 🗺️ GridStor Design System - Navigation Guide

**Not sure where to find something? Use this guide to navigate the design system.**

---

## 📍 Where Do I Find...?

### Documentation

| What You Need | File Location | Purpose |
|---------------|---------------|---------|
| **Quick start guide** | `/guidelines/Quick-Reference.md` | Fast answers, copy-paste snippets |
| **Complete documentation** | `/guidelines/GridStor-Design-System.md` | Full system specification |
| **Navigation hub** | `/guidelines/README.md` | Overview and directory |
| **This guide** | `/guidelines/NAVIGATION-GUIDE.md` | You are here! |

---

### Components

| Component | File Location | What It Does |
|-----------|---------------|--------------|
| **MarketCard** | `/components/MarketCard.tsx` | Main data display card |
| **MetricBox** | `/components/MetricBox.tsx` | Individual metric display |
| **SectionHeader** | `/components/SectionHeader.tsx` | Section titles |
| **YoYIndicator** | `/components/YoYIndicator.tsx` | Trend indicators (+/-) |
| **MarketBadge** | `/components/MarketBadge.tsx` | Category badges |
| **All components** | `/components/index.ts` | Centralized exports |

---

### Templates

| Template | File Location | Best For |
|----------|---------------|----------|
| **Basic Dashboard** | `/components/templates/DashboardSection.tsx` | Simple 3-card dashboards |
| **Market Overview** | `/components/templates/MarketOverviewSection.tsx` | Detailed market analysis |
| **Performance** | `/components/templates/PerformanceSection.tsx` | System monitoring |
| **Two-Column** | `/components/templates/TwoColumnSection.tsx` | Wide, detailed layouts |
| **Showcase** | `/components/templates/TemplateShowcase.tsx` | See all patterns |
| **Template Guide** | `/components/templates/README.md` | How to use templates |

---

### Examples & Demos

| What | File Location | Purpose |
|------|---------------|---------|
| **Live examples** | `/App.tsx` | Working code you can reference |
| **Design tokens** | `/styles/globals.css` | CSS variables and system tokens |

---

## 🎯 Common Journeys

### Journey 1: "I want to build something NOW"

```
1. /guidelines/Quick-Reference.md
   └─> Find the "Copy-Paste Starter" section
   
2. /components/templates/DashboardSection.tsx
   └─> Copy this file
   
3. Replace the data with yours
   └─> Done! 🎉
```

---

### Journey 2: "I need to understand the system"

```
1. /guidelines/README.md
   └─> Start here for overview
   
2. /guidelines/GridStor-Design-System.md
   └─> Read the complete documentation
   
3. /App.tsx
   └─> Study working examples
   
4. /components/templates/TemplateShowcase.tsx
   └─> See all patterns in action
```

---

### Journey 3: "I have a specific question"

```
1. /guidelines/Quick-Reference.md
   └─> Check cheat sheets first
   
2. /guidelines/GridStor-Design-System.md
   └─> Search for detailed answer
   
3. /App.tsx
   └─> Look for working example
```

---

### Journey 4: "I want to customize the design"

```
1. /guidelines/GridStor-Design-System.md
   └─> Read "Customization Guide" section
   
2. /styles/globals.css
   └─> Review design tokens
   
3. /components/MarketCard.tsx
   └─> See how components use tokens
```

---

### Journey 5: "I'm onboarding a new team member"

```
Share these files in order:

1. /guidelines/README.md
   └─> Overview and orientation
   
2. /guidelines/Quick-Reference.md
   └─> Quick start guide
   
3. /components/templates/README.md
   └─> Template usage guide
   
4. /App.tsx
   └─> Working examples
```

---

## 📂 Complete File Map

```
project/
│
├── 📁 guidelines/                         ← DOCUMENTATION HUB
│   ├── README.md                          ← Start here!
│   ├── Quick-Reference.md                 ← Fast answers
│   ├── GridStor-Design-System.md          ← Complete guide
│   ├── NAVIGATION-GUIDE.md                ← This file
│   └── Guidelines.md                      ← System overview
│
├── 📁 components/                         ← COMPONENT LIBRARY
│   ├── index.ts                           ← Easy imports
│   ├── MarketCard.tsx                     ← Main card
│   ├── MetricBox.tsx                      ← Metrics
│   ├── SectionHeader.tsx                  ← Headers
│   ├── YoYIndicator.tsx                   ← Trends
│   ├── MarketBadge.tsx                    ← Badges
│   │
│   └── 📁 templates/                      ← READY-TO-USE TEMPLATES
│       ├── README.md                      ← Template guide
│       ├── DashboardSection.tsx           ← Basic template
│       ├── MarketOverviewSection.tsx      ← Market template
│       ├── PerformanceSection.tsx         ← Performance template
│       ├── TwoColumnSection.tsx           ← Wide layout
│       └── TemplateShowcase.tsx           ← All patterns
│
├── 📁 styles/                             ← DESIGN SYSTEM TOKENS
│   └── globals.css                        ← CSS variables, tokens
│
└── 📄 App.tsx                             ← LIVE EXAMPLES
```

---

## 🎨 Design System Structure

```
Design System
│
├── 🎨 Design Tokens (in /styles/globals.css)
│   ├── Colors (accent, grays, tints)
│   ├── Typography (sizes, weights)
│   ├── Spacing (8px grid)
│   ├── Shadows (3 levels)
│   └── Transitions (timing)
│
├── 🧩 Core Components (in /components/)
│   ├── MarketCard (main container)
│   ├── MetricBox (data display)
│   ├── SectionHeader (titles)
│   ├── YoYIndicator (trends)
│   └── MarketBadge (tags)
│
├── 📐 Templates (in /components/templates/)
│   ├── 3-column layouts
│   ├── 2-column layouts
│   ├── Performance dashboards
│   └── Market overviews
│
└── 📚 Documentation (in /guidelines/)
    ├── Quick reference
    ├── Complete guide
    ├── Navigation (this)
    └── Examples
```

---

## 🔍 Search Index

Use Ctrl+F / Cmd+F to search for:

### By Topic
- **Colors** → `/guidelines/GridStor-Design-System.md` (Color Palette section)
- **Spacing** → `/guidelines/GridStor-Design-System.md` (Spacing System section)
- **Typography** → `/guidelines/GridStor-Design-System.md` (Typography System section)
- **Shadows** → `/styles/globals.css` (look for `--shadow-*`)
- **Responsive** → `/guidelines/GridStor-Design-System.md` (Responsive Behavior section)

### By Component
- **MarketCard API** → `/guidelines/GridStor-Design-System.md` (search "MarketCard")
- **MetricBox API** → `/guidelines/GridStor-Design-System.md` (search "MetricBox")
- **Accent colors** → `/guidelines/Quick-Reference.md` (Accent Colors table)
- **Variants** → `/guidelines/Quick-Reference.md` (Metric Box Variants table)

### By Use Case
- **Dashboard** → `/components/templates/DashboardSection.tsx`
- **Market data** → `/components/templates/MarketOverviewSection.tsx`
- **Performance** → `/components/templates/PerformanceSection.tsx`
- **Wide layout** → `/components/templates/TwoColumnSection.tsx`

---

## 📞 Quick Help Lookup

### "How do I...?"

| Question | Answer Location |
|----------|----------------|
| ...get started quickly? | `/guidelines/Quick-Reference.md` |
| ...import components? | `/components/index.ts` |
| ...use a template? | `/components/templates/README.md` |
| ...customize colors? | `/guidelines/GridStor-Design-System.md` → Customization |
| ...understand the system? | `/guidelines/GridStor-Design-System.md` |
| ...see examples? | `/App.tsx` |
| ...find design tokens? | `/styles/globals.css` |

---

## 🎓 Learning Resources by Experience Level

### 👶 Beginner (Just Getting Started)
1. `/guidelines/README.md` - Overview
2. `/guidelines/Quick-Reference.md` - Quick start
3. `/components/templates/DashboardSection.tsx` - Copy this
4. `/App.tsx` - See it in action

### 🧑 Intermediate (Building Custom Layouts)
1. `/guidelines/GridStor-Design-System.md` - Full guide
2. `/components/templates/TemplateShowcase.tsx` - All patterns
3. `/styles/globals.css` - Design tokens
4. Component source files - See implementation

### 👨‍🎓 Advanced (Extending the System)
1. `/guidelines/GridStor-Design-System.md` - Complete spec
2. Component source files - Study implementation
3. `/styles/globals.css` - Modify tokens
4. Create your own templates

---

## 🚀 Workflow Recommendations

### For Individual Developers
```
Quick task:    Quick-Reference.md → Copy template → Done
Deep work:     GridStor-Design-System.md → Custom components
Learning:      README.md → Full guide → Examples
```

### For Teams
```
Onboarding:    README.md → Quick-Reference.md → Templates
Standards:     GridStor-Design-System.md → Team guidelines
Reviews:       Check against design system spec
```

### For Designers
```
Tokens:        /styles/globals.css
Patterns:      /App.tsx + /components/templates/
Specs:         GridStor-Design-System.md
```

---

## 💡 Pro Navigation Tips

1. **Bookmark these files** in your IDE:
   - `/guidelines/Quick-Reference.md`
   - `/components/index.ts`
   - `/App.tsx`

2. **Use your IDE's search** to find specific topics across all docs

3. **Keep `/App.tsx` open** as a reference while building

4. **Start with templates** (`/components/templates/`) then customize

5. **Reference the spec** (`GridStor-Design-System.md`) when unsure

---

## 📍 You Are Here

```
GridStor Design System
│
├── 📚 Documentation
│   └── NAVIGATION-GUIDE.md ← YOU ARE HERE
│
├── 🧩 Components
├── 📐 Templates
└── 🎨 Examples
```

**Where do you want to go?**

- **Get started fast** → `/guidelines/Quick-Reference.md`
- **Learn the system** → `/guidelines/GridStor-Design-System.md`
- **Copy a template** → `/components/templates/`
- **See examples** → `/App.tsx`
- **Back to overview** → `/guidelines/README.md`

---

**Lost? Start at `/guidelines/README.md`** 🏠
