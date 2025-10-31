# NavigationBar Component - Quick Reference

Complete guide to using the GridStor Market Sight navigation bar component.

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { NavigationBar } from './components/NavigationBar';

export default function App() {
  return (
    <div>
      <NavigationBar currentPath="/" />
      {/* Your page content */}
    </div>
  );
}
```

### With Settings Callback

```tsx
<NavigationBar
  currentPath="/long-term-outlook"
  onSettingsClick={() => {
    // Handle settings click
    console.log('Settings clicked');
  }}
/>
```

---

## 🎨 Component Specifications

### Visual Design

**Header:**
- Background: `#2A2A2A` (near-black)
- Height: `72px` (including padding)
- Shadow: Subtle `0 1px 3px rgba(0,0,0,0.1)`
- Text: White with gray hover states

**Logo:**
- Lightning bolt icon: `32×32px`, cyan (`#06B6D4`)
- Site name: "GridStor Market Sight", 20px Inter Bold
- Gap between icon and text: `12px`

**Navigation Links:**
- Font: 16px Inter Medium
- Color: White, hover `#D1D5DB` (gray-300)
- Gap between links: `32px`
- Hidden on mobile (< 1024px)

**Settings Button:**
- Size: `40×40px` button
- Icon: `20×20px` settings gear
- Hover: Gray-700 background

---

## 📐 Layout

### Desktop (>= 1024px)

```
┌────────────────────────────────────────────────────────────┐
│ [⚡] GridStor Market Sight  │  Long Term │ Short Term │ ⚙️ │
│ [Logo + Text - 32px tall]   │  [Navigation Links]    │[40]│
└────────────────────────────────────────────────────────────┘
```

**Visible:**
- ✅ Logo (icon + text)
- ✅ All navigation links
- ✅ Settings button

### Mobile (< 1024px)

```
┌────────────────────────────────────┐
│ [⚡] GridStor Market Sight      ⚙️│
│ [Logo + text only]   [Settings only]│
└────────────────────────────────────┘
```

**Visible:**
- ✅ Logo (icon + text)
- ❌ Navigation links (hidden)
- ✅ Settings button

---

## 🎯 Props

### NavigationBarProps

```typescript
interface NavigationBarProps {
  /** Current page path for active state highlighting */
  currentPath?: string;
  
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
}
```

### Examples

**Highlight active page:**
```tsx
<NavigationBar currentPath="/long-term-outlook" />
// "Long Term Outlook" link will be gray-300
```

**Handle settings:**
```tsx
<NavigationBar
  onSettingsClick={() => {
    // Open settings modal
    setSettingsOpen(true);
  }}
/>
```

**Default (no highlighting):**
```tsx
<NavigationBar />
// All links white, no active state
```

---

## 🔗 Navigation Links

### Available Routes

The component includes three navigation links:

| Link Text | Route | Color Association | Purpose |
|-----------|-------|-------------------|---------|
| Long Term Outlook | `/long-term-outlook` | Blue (`#3B82F6`) | Strategic planning |
| Short Term Outlook | `/short-term-outlook` | Green (`#10B981`) | Daily operations |
| Risk/Structuring | `/risk-structuring` | Purple (`#8B5CF6`) | Risk analytics |

### Active State Logic

The component automatically highlights the active page based on `currentPath`:

```typescript
// Long Term active if path starts with:
/long-term-outlook
/long-term-outlook/any-subpage

// Short Term active if path starts with:
/short-term-outlook
/short-term-outlook/any-subpage

// Risk active if path starts with:
/risk-structuring
/risk-structuring/any-subpage
```

**Active styling:**
- Text color changes to `#D1D5DB` (gray-300)
- `aria-current="page"` attribute added

---

## 🎨 Visual States

### Logo Hover

**Default:**
- Icon: Cyan `#06B6D4`
- Text: White `#FFFFFF`

**Hover:**
- Both change to: Gray-300 `#D1D5DB`
- Transition: `200ms ease-in-out`

### Navigation Link States

**Default:**
```css
color: #FFFFFF (white)
font-weight: 500 (medium)
```

**Hover:**
```css
color: #D1D5DB (gray-300)
transition: 200ms
```

**Active (current page):**
```css
color: #D1D5DB (gray-300)
aria-current: page
```

### Settings Button States

**Default:**
```css
background: transparent
color: white
```

**Hover:**
```css
background: #374151 (gray-700)
border-radius: 6px
```

---

## 💻 Implementation Examples

### React Router

```tsx
import { useLocation } from 'react-router-dom';
import { NavigationBar } from './components/NavigationBar';

function App() {
  const location = useLocation();
  
  return (
    <div>
      <NavigationBar currentPath={location.pathname} />
      {/* Routes */}
    </div>
  );
}
```

### Next.js

```tsx
import { useRouter } from 'next/router';
import { NavigationBar } from './components/NavigationBar';

export default function Layout({ children }) {
  const router = useRouter();
  
  return (
    <>
      <NavigationBar currentPath={router.pathname} />
      <main>{children}</main>
    </>
  );
}
```

### Astro

```astro
---
import { NavigationBar } from './components/NavigationBar';
const currentPath = Astro.url.pathname;
---

<NavigationBar currentPath={currentPath} client:load />
<main>
  <slot />
</main>
```

### Plain React (Single Page)

```tsx
import { NavigationBar } from './components/NavigationBar';

export default function App() {
  return (
    <div>
      <NavigationBar currentPath="/" />
      {/* Page content */}
    </div>
  );
}
```

---

## 🎨 Customization

### Changing Navigation Links

To modify the navigation links, edit `/components/NavigationBar.tsx`:

```tsx
// Find the navigation section and update:
<nav className="hidden lg:flex items-center gap-8">
  <a href="/your-route" className={getLinkClass(isActive)}>
    Your Link Text
  </a>
  {/* Add more links */}
</nav>
```

### Adding a Mobile Menu

For mobile hamburger menu, add before settings button:

```tsx
{/* Mobile Menu Button */}
<button
  className="lg:hidden p-2 hover:bg-gray-700 rounded-md"
  aria-label="Menu"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
</button>
```

### Adding More Action Buttons

To add notifications, user menu, etc.:

```tsx
<div className="flex items-center gap-2 ml-4">
  <button className="p-2 hover:bg-gray-700 rounded-md" title="Notifications">
    {/* Notification icon */}
  </button>
  <button className="p-2 hover:bg-gray-700 rounded-md" title="Settings">
    {/* Settings icon */}
  </button>
</div>
```

---

## ♿ Accessibility

### Features

✅ **Semantic HTML**
- `<header role="banner">` for main header
- `<nav role="navigation" aria-label="Primary">` for navigation

✅ **ARIA Attributes**
- `aria-label="GridStor Market Sight Home"` on logo link
- `aria-current="page"` on active navigation link
- `aria-label="Settings"` on settings button

✅ **Keyboard Navigation**
- All interactive elements focusable
- Focus indicators visible (cyan outline)
- Logical tab order: Logo → Nav Links → Settings

✅ **Screen Reader Support**
- Logo image has presentation role (text is read)
- Active page announced to screen readers
- Button labels properly announced

### Tab Order

1. Logo (focusable link)
2. Long Term Outlook (focusable link)
3. Short Term Outlook (focusable link)
4. Risk/Structuring (focusable link)
5. Settings button (focusable button)

---

## 📱 Responsive Behavior

### Breakpoints

| Screen Size | Nav Links Visibility |
|-------------|---------------------|
| < 1024px | Hidden |
| >= 1024px | Visible |

### Padding

| Screen Size | Horizontal Padding |
|-------------|-------------------|
| < 640px | 16px (`px-4`) |
| 640-1024px | 24px (`sm:px-6`) |
| >= 1024px | 32px (`lg:px-8`) |

### Content Width

- Maximum: `1280px` (`max-w-7xl`)
- Always centered with `mx-auto`

---

## 🎨 Design Tokens

### Colors

```css
--nav-bg: #2A2A2A;              /* Header background */
--nav-text: #FFFFFF;            /* Default text */
--nav-text-hover: #D1D5DB;      /* Hover/active text */
--nav-logo-cyan: #06B6D4;       /* Lightning bolt */
--nav-button-hover: #374151;    /* Settings hover */
```

### Spacing

```css
--nav-height: 72px;             /* Total header height */
--nav-padding-y: 16px;          /* Vertical padding */
--nav-logo-gap: 12px;           /* Logo icon/text gap */
--nav-link-gap: 32px;           /* Gap between links */
--nav-section-gap: 32px;        /* Logo to nav gap */
```

### Typography

```css
--nav-logo-size: 20px;          /* Logo text */
--nav-logo-weight: 700;         /* Logo weight (bold) */
--nav-link-size: 16px;          /* Nav link text */
--nav-link-weight: 500;         /* Nav link weight (medium) */
```

---

## ✅ Validation Checklist

Before shipping any page with the navigation bar:

**Visual:**
- [ ] Header background is `#2A2A2A` (near-black)
- [ ] Lightning bolt is cyan (`#06B6D4`)
- [ ] All text is white by default
- [ ] Hover states show gray-300
- [ ] Active page link is gray-300
- [ ] Subtle shadow visible under header

**Functional:**
- [ ] Logo links to home (`/`)
- [ ] All nav links work correctly
- [ ] Settings button has click handler
- [ ] Active page highlighting works
- [ ] Navigation hidden on mobile

**Accessibility:**
- [ ] All ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Active page announced to screen readers

**Responsive:**
- [ ] Nav links hidden below 1024px
- [ ] Proper padding at all breakpoints
- [ ] Content centered at all sizes
- [ ] Height consistent (72px)

---

## 🚨 Common Issues

### Active highlighting not working

**Problem:** Links don't highlight when on the page

**Solution:** Make sure you're passing `currentPath` prop:
```tsx
<NavigationBar currentPath="/long-term-outlook" />
```

### Navigation links always hidden

**Problem:** Links don't show on desktop

**Solution:** Check that screen width is >= 1024px. The `lg:flex` class shows links only on large screens.

### Settings button doesn't do anything

**Problem:** Clicking settings has no effect

**Solution:** Pass an `onSettingsClick` callback:
```tsx
<NavigationBar
  onSettingsClick={() => {
    // Your settings logic
  }}
/>
```

---

## 📚 Related Documentation

- **Full Specification:** See navigation bar spec document
- **Design System:** `/guidelines/GridStor-Design-System.md`
- **Component Code:** `/components/NavigationBar.tsx`
- **Usage Examples:** `/App.tsx`

---

## 💡 Best Practices

1. **Always use in a layout component** - Don't duplicate the nav on every page
2. **Pass currentPath for highlighting** - Improves user orientation
3. **Handle settings click** - Provide actual functionality or remove button
4. **Test responsive behavior** - Check navigation on mobile/tablet/desktop
5. **Maintain color consistency** - Use exact hex values from spec
6. **Don't modify the logo** - Keep lightning bolt cyan, 32×32px
7. **Follow spacing rules** - 32px gaps, 72px height

---

## 🎓 Examples

### Complete Layout Example

```tsx
import React from 'react';
import { NavigationBar } from './components/NavigationBar';
import { SectionHeader } from './components/SectionHeader';
import { MarketCard } from './components/MarketCard';

export default function LongTermOutlook() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <NavigationBar
        currentPath="/long-term-outlook"
        onSettingsClick={() => console.log('Settings')}
      />

      {/* Page Content */}
      <main>
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Long Term Outlook"
              description="Strategic market analysis and forecasts"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MarketCard {...} />
              {/* More cards */}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

### With State Management

```tsx
import React, { useState } from 'react';
import { NavigationBar } from './components/NavigationBar';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div>
      <NavigationBar
        currentPath="/"
        onSettingsClick={() => setSettingsOpen(true)}
      />
      
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      
      {/* Page content */}
    </div>
  );
}
```

---

**The NavigationBar is now part of your GridStor Design System!** ⚡

Use it consistently across all pages to maintain a professional, cohesive user experience.
