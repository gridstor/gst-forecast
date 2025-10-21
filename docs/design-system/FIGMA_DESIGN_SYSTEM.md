# 🎨 **Figma Design System Template**
## GridStor Analytics Design Language

This design system specification is based on the successful GridStor Analytics project. Use this as your reference for creating consistent designs in Figma and other design tools.

---

## **🎯 Design Principles**

### **Core Values**
- **Clean & Minimal** - Reduce visual noise, focus on content
- **Data-Driven** - Prioritize clarity for data visualization
- **Professional** - Enterprise-grade appearance and reliability
- **Accessible** - WCAG 2.1 AA compliant design choices
- **Responsive** - Mobile-first, works on all screen sizes

### **Visual Hierarchy**
1. **Primary Actions** - High contrast, prominent placement
2. **Secondary Actions** - Subtle but discoverable
3. **Tertiary Actions** - Minimal visual weight
4. **Content** - Clear typography hierarchy
5. **Supporting Elements** - Subtle backgrounds and borders

---

## **🌈 Color Palette**

### **Primary Colors**
```
Brand Dark (gs-dark)
HEX: #2A2A2A
RGB: 42, 42, 42
HSL: 0°, 0%, 16%
Usage: Headers, primary text, dark backgrounds
```

```
Brand Blue (gs-blue) 
HEX: #34D5ED
RGB: 52, 213, 237
HSL: 188°, 84%, 57%
Usage: Brand accents, hover states, highlights
```

```
Brand Light (gs-light)
HEX: #FFFFFF
RGB: 255, 255, 255
HSL: 0°, 0%, 100%
Usage: Backgrounds, cards, primary surfaces
```

### **Interactive Colors**
```
Primary Interactive (Indigo)
HEX: #4F46E5
RGB: 79, 70, 229
HSL: 243°, 75%, 59%
Usage: Buttons, links, active states, focus rings
```

```
Primary Interactive Hover
HEX: #4338CA
RGB: 67, 56, 202
HSL: 248°, 73%, 51%
Usage: Hover states for primary interactive elements
```

### **Semantic Colors**
```
Success Green
HEX: #10B981
RGB: 16, 185, 129
HSL: 160°, 84%, 39%
Usage: Success messages, positive indicators
```

```
Warning Orange
HEX: #F59E0B
RGB: 245, 158, 11
HSL: 38°, 92%, 50%
Usage: Warning messages, caution indicators
```

```
Error Red
HEX: #EF4444
RGB: 239, 68, 68
HSL: 0°, 84%, 60%
Usage: Error messages, destructive actions
```

```
Info Blue
HEX: #3B82F6
RGB: 59, 130, 246
HSL: 221°, 91%, 60%
Usage: Information messages, neutral highlights
```

### **Neutral Grays**
```
Gray 50 (Lightest Background)
HEX: #F9FAFB
RGB: 249, 250, 251
Usage: Page backgrounds, subtle containers
```

```
Gray 100 (Light Background)
HEX: #F3F4F6
RGB: 243, 244, 246
Usage: Card backgrounds, disabled states
```

```
Gray 200 (Borders)
HEX: #E5E7EB
RGB: 229, 231, 235
Usage: Borders, dividers, input borders
```

```
Gray 300 (Subtle Borders)
HEX: #D1D5DB
RGB: 209, 213, 219
Usage: Subtle borders, inactive elements
```

```
Gray 400 (Placeholder Text)
HEX: #9CA3AF
RGB: 156, 163, 175
Usage: Placeholder text, disabled text
```

```
Gray 500 (Secondary Text)
HEX: #6B7280
RGB: 107, 114, 128
Usage: Secondary text, captions, labels
```

```
Gray 600 (Body Text)
HEX: #4B5563
RGB: 75, 85, 99
Usage: Body text, descriptions
```

```
Gray 700 (Headings)
HEX: #374151
RGB: 55, 65, 81
Usage: Headings, important text
```

```
Gray 800 (Dark Text)
HEX: #1F2937
RGB: 31, 41, 55
Usage: Primary headings, dark text
```

```
Gray 900 (Darkest Text)
HEX: #111827
RGB: 17, 24, 39
Usage: Primary text, highest contrast
```

---

## **✍️ Typography**

### **Font Families**
```
Primary Font: Inter
- Source: Google Fonts
- Fallback: system-ui, -apple-system, sans-serif
- Usage: All UI text, headings, body content
- Weights Available: 400, 500, 600, 700
```

```
Monospace Font: JetBrains Mono
- Source: Google Fonts  
- Fallback: monospace
- Usage: Code, data values, technical content
- Weights Available: 400, 500, 600, 700
```

### **Type Scale**
```
Display Large (H1)
Font: Inter Bold (700)
Size: 36px (2.25rem)
Line Height: 40px (2.5rem)
Letter Spacing: -0.025em
Usage: Page titles, hero headings
```

```
Display Medium (H2)
Font: Inter SemiBold (600)
Size: 30px (1.875rem)
Line Height: 36px (2.25rem)
Letter Spacing: -0.025em
Usage: Section headings, card titles
```

```
Display Small (H3)
Font: Inter SemiBold (600)
Size: 24px (1.5rem)
Line Height: 32px (2rem)
Letter Spacing: 0
Usage: Subsection headings
```

```
Heading Large (H4)
Font: Inter SemiBold (600)
Size: 20px (1.25rem)
Line Height: 28px (1.75rem)
Letter Spacing: 0
Usage: Component titles, form sections
```

```
Heading Medium (H5)
Font: Inter Medium (500)
Size: 18px (1.125rem)
Line Height: 28px (1.75rem)
Letter Spacing: 0
Usage: Table headers, modal titles
```

```
Heading Small (H6)
Font: Inter Medium (500)
Size: 16px (1rem)
Line Height: 24px (1.5rem)
Letter Spacing: 0
Usage: Form labels, small headings
```

```
Body Large
Font: Inter Regular (400)
Size: 18px (1.125rem)
Line Height: 28px (1.75rem)
Letter Spacing: 0
Usage: Large body text, descriptions
```

```
Body Medium (Default)
Font: Inter Regular (400)
Size: 16px (1rem)
Line Height: 24px (1.5rem)
Letter Spacing: 0
Usage: Default body text, form inputs
```

```
Body Small
Font: Inter Regular (400)
Size: 14px (0.875rem)
Line Height: 20px (1.25rem)
Letter Spacing: 0
Usage: Captions, helper text, metadata
```

```
Caption
Font: Inter Regular (400)
Size: 12px (0.75rem)
Line Height: 16px (1rem)
Letter Spacing: 0.025em
Usage: Timestamps, fine print, labels
```

```
Code/Data
Font: JetBrains Mono Regular (400)
Size: 14px (0.875rem)
Line Height: 20px (1.25rem)
Letter Spacing: 0
Usage: Code blocks, data values, IDs
```

---

## **📐 Spacing & Layout**

### **Spacing Scale (8px Base)**
```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 12px (0.75rem)
lg: 16px (1rem)
xl: 20px (1.25rem)
2xl: 24px (1.5rem)
3xl: 32px (2rem)
4xl: 40px (2.5rem)
5xl: 48px (3rem)
6xl: 64px (4rem)
7xl: 80px (5rem)
8xl: 96px (6rem)
```

### **Container Widths**
```
Mobile: 100% (no max-width)
Tablet: 768px
Desktop: 1024px
Large Desktop: 1280px
Max Width: 1536px (7xl)
```

### **Grid System**
```
Columns: 12-column grid
Gutter: 24px (1.5rem)
Margins: 16px mobile, 24px tablet+
Breakpoints:
- sm: 640px
- md: 768px  
- lg: 1024px
- xl: 1280px
- 2xl: 1536px
```

---

## **🎯 Component Specifications**

### **Buttons**

#### **Primary Button**
```
Background: #4F46E5 (Indigo 600)
Text: #FFFFFF (White)
Border: None
Border Radius: 6px (0.375rem)
Padding: 8px 16px (0.5rem 1rem)
Font: Inter Medium (500), 14px
Height: 36px minimum

States:
- Hover: Background #4338CA (Indigo 700)
- Focus: 2px ring #4F46E5 with 2px offset
- Disabled: Background #9CA3AF, Text #6B7280
- Active: Background #3730A3 (Indigo 800)
```

#### **Secondary Button**
```
Background: Transparent
Text: #4F46E5 (Indigo 600)
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 6px (0.375rem)
Padding: 8px 16px (0.5rem 1rem)
Font: Inter Medium (500), 14px
Height: 36px minimum

States:
- Hover: Background #F9FAFB, Border #D1D5DB
- Focus: 2px ring #4F46E5 with 2px offset
- Disabled: Text #9CA3AF, Border #E5E7EB
```

#### **Ghost Button**
```
Background: Transparent
Text: #6B7280 (Gray 500)
Border: None
Border Radius: 6px (0.375rem)
Padding: 8px 16px (0.5rem 1rem)
Font: Inter Medium (500), 14px
Height: 36px minimum

States:
- Hover: Background #F3F4F6, Text #4B5563
- Focus: 2px ring #4F46E5 with 2px offset
- Disabled: Text #9CA3AF
```

### **Form Elements**

#### **Text Input**
```
Background: #FFFFFF (White)
Border: 1px solid #D1D5DB (Gray 300)
Border Radius: 6px (0.375rem)
Padding: 8px 12px (0.5rem 0.75rem)
Font: Inter Regular (400), 16px
Height: 40px
Text Color: #111827 (Gray 900)
Placeholder: #9CA3AF (Gray 400)

States:
- Focus: Border #4F46E5, 2px ring #4F46E5 with 2px offset
- Error: Border #EF4444, 2px ring #EF4444 with 2px offset
- Disabled: Background #F3F4F6, Border #E5E7EB, Text #9CA3AF
```

#### **Select Dropdown**
```
Same as Text Input with:
- Right padding: 32px (for arrow icon)
- Arrow Icon: 16px, #6B7280 (Gray 500)
- Arrow Position: Right 12px, centered vertically
```

### **Cards**

#### **Standard Card**
```
Background: #FFFFFF (White)
Border: None
Border Radius: 8px (0.5rem)
Shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
Padding: 24px (1.5rem)

Hover State:
- Shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)
- Transform: translateY(-1px)
```

#### **Data Card**
```
Same as Standard Card with:
- Header: 16px bottom margin
- Title: Inter SemiBold (600), 18px, #111827
- Subtitle: Inter Regular (400), 14px, #6B7280
- Content: 16px top margin
```

### **Tables**

#### **Table Header**
```
Background: #F9FAFB (Gray 50)
Border Bottom: 1px solid #E5E7EB (Gray 200)
Text: Inter Medium (500), 12px, #374151 (Gray 700)
Text Transform: Uppercase
Letter Spacing: 0.05em
Padding: 12px 16px (0.75rem 1rem)
Height: 44px
```

#### **Table Row**
```
Background: #FFFFFF (White)
Border Bottom: 1px solid #F3F4F6 (Gray 100)
Text: Inter Regular (400), 14px, #111827 (Gray 900)
Padding: 16px (1rem)
Height: 52px

Hover State:
- Background: #F9FAFB (Gray 50)

Alternate Row:
- Background: #FAFBFC (slightly darker than white)
```

### **Navigation**

#### **Header Navigation**
```
Background: #FFFFFF (White)
Border Bottom: 1px solid #E5E7EB (Gray 200)
Height: 64px (4rem)
Padding: 0 24px (1.5rem)

Logo:
- Height: 32px (2rem)
- Left aligned

Navigation Items:
- Font: Inter Medium (500), 14px
- Color: #6B7280 (Gray 500)
- Padding: 8px 16px
- Border Bottom: 2px transparent

Active State:
- Color: #111827 (Gray 900)
- Border Bottom: 2px solid #4F46E5 (Indigo 600)

Hover State:
- Color: #374151 (Gray 700)
```

#### **Tab Navigation**
```
Border Bottom: 1px solid #E5E7EB (Gray 200)
Tab Item:
- Font: Inter Medium (500), 14px
- Color: #6B7280 (Gray 500)
- Padding: 12px 16px (0.75rem 1rem)
- Border Bottom: 2px transparent

Active Tab:
- Color: #4F46E5 (Indigo 600)
- Border Bottom: 2px solid #4F46E5

Hover Tab:
- Color: #374151 (Gray 700)
```

---

## **📊 Data Visualization**

### **Chart Colors (Chart.js)**
```
Primary Dataset: #4F46E5 (Indigo 600)
Secondary Dataset: #34D5ED (Brand Blue)
Third Dataset: #10B981 (Success Green)
Fourth Dataset: #F59E0B (Warning Orange)
Fifth Dataset: #EF4444 (Error Red)
Sixth Dataset: #8B5CF6 (Purple 500)
```

### **Chart Styling**
```
Grid Lines: #F3F4F6 (Gray 100)
Axis Labels: Inter Regular (400), 12px, #6B7280 (Gray 500)
Legend: Inter Medium (500), 14px, #374151 (Gray 700)
Tooltips: Background #1F2937, Text #FFFFFF, Border Radius 6px
```

---

## **🔧 Figma Setup Instructions**

### **1. Create Color Styles**
1. Create a new Figma file named "Design System - [Project Name]"
2. Add color swatches for each color above
3. Create Figma color styles for each:
   - Name format: "Color/Primary/Brand Blue"
   - Name format: "Color/Neutral/Gray 500"
   - Name format: "Color/Semantic/Success"

### **2. Create Text Styles**
1. Import Inter and JetBrains Mono fonts
2. Create text styles for each typography specification
3. Name format: "Text/Display/Large" or "Text/Body/Medium"

### **3. Create Component Library**
1. Design each component specification above
2. Create component variants for different states
3. Use Auto Layout for responsive behavior
4. Name components clearly: "Button/Primary", "Input/Text"

### **4. Create Grid & Layout Styles**
1. Set up 8px grid system
2. Create layout grids for different breakpoints
3. Set up spacing tokens as Figma variables

### **5. Documentation**
1. Create a cover page with design principles
2. Document each component with usage guidelines
3. Include do's and don'ts for each element
4. Add responsive behavior notes

---

## **📱 Responsive Behavior**

### **Mobile (< 640px)**
- Single column layouts
- Full-width buttons
- Collapsed navigation (hamburger menu)
- Reduced padding: 16px instead of 24px
- Smaller font sizes for headings

### **Tablet (640px - 1024px)**
- Two-column layouts where appropriate
- Maintain button sizes
- Horizontal navigation
- Standard padding: 24px

### **Desktop (> 1024px)**
- Multi-column layouts
- Full navigation
- Hover states active
- Maximum content width: 1280px

---

## **♿ Accessibility Guidelines**

### **Color Contrast**
- Text on white: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 for non-text elements

### **Focus States**
- All interactive elements must have visible focus indicators
- Focus ring: 2px solid #4F46E5 with 2px offset
- Focus ring should be visible on all backgrounds

### **Typography**
- Minimum font size: 12px
- Line height: Minimum 1.4x font size
- Paragraph width: Maximum 75 characters

---

## **🎨 Figma File Structure**

```
📁 Cover & Guidelines
   - Design Principles
   - Usage Instructions
   - Changelog

📁 Foundation
   - Colors
   - Typography
   - Spacing & Grid
   - Icons

📁 Components
   - Buttons
   - Form Elements
   - Cards
   - Navigation
   - Tables
   - Modals
   - Tooltips

📁 Patterns
   - Page Layouts
   - Data Visualization
   - Form Patterns
   - Navigation Patterns

📁 Templates
   - Dashboard Template
   - Form Template
   - Data Table Template
   - Landing Page Template
```

---

This design system ensures consistency across all your projects and provides clear guidelines for any designer working with your brand. Import this into Figma and you'll have a complete design system that matches your successful GridStor Analytics project! 