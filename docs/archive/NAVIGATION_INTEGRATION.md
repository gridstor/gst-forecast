# Navigation Header Integration

**Repository:** gst-forecast  
**Role:** Long-term outlook pages

---

## 🎯 **Current Status**

✅ This repo currently uses **local navigation** in `src/layouts/Layout.astro`

---

## 🔄 **Option 1: Keep Local Navigation (Current)**

**Pros:**
- Full control over navigation
- No external dependencies
- Works offline in development

**Cons:**
- Must manually sync with other repos
- Changes require code updates and deployment

**To Update Navigation:**
1. Edit `src/layouts/Layout.astro` (lines 94-172)
2. Match structure from `gst-homepage/public/shared-header.js`
3. Test locally
4. Deploy

---

## 🌐 **Option 2: Use Shared Navigation** (Recommended)

**Pros:**
- Automatic sync with all GridStor sites
- Changes propagate instantly
- Single source of truth

**Cons:**
- Requires internet connection
- Slight delay loading external script

### **How to Switch:**

**Step 1:** Remove local navigation from Layout.astro

```astro
<!-- Remove the entire <nav> section (lines 94-172) -->
```

**Step 2:** Add shared header script

```astro
---
// In <head> section:
---
<html lang="en">
  <head>
    <!-- Existing head content... -->
    
    <!-- GridStor Shared Navigation -->
    <script src="https://gst-homepage.netlify.app/shared-header.js"></script>
  </head>
  <body>
    <!-- Add this div where navigation should appear -->
    <div id="gridstor-header"></div>
    
    <!-- Rest of your content -->
  </body>
</html>
```

**Step 3:** Test

```bash
npm run dev
# Navigate to http://localhost:4321
# Navigation should appear automatically
```

**Step 4:** Deploy

```bash
git add src/layouts/Layout.astro
git commit -m "Switch to shared navigation header"
git push
```

---

## 📝 **How to Add Pages to Navigation**

When you add a new page to this repo that should appear in navigation:

### **Example: Adding "Curve Tracker"**

1. **Open** `gst-homepage/public/shared-header.js`

2. **Find** the Revenue Forecast submenu configuration:
```javascript
{
  id: 'revenue-forecast',
  label: 'Revenue Forecast',
  type: 'submenu',
  subItems: [
    // existing pages...
  ]
}
```

3. **Add** your new page:
```javascript
subItems: [
  // ... existing items ...
  {
    label: 'Curve Tracker',
    href: '/curve-tracker',
    description: 'Track curve updates and changes'
  }
]
```

4. **Commit and push** to gst-homepage:
```bash
cd /path/to/gst-homepage
git add public/shared-header.js
git commit -m "Nav: Add Curve Tracker"
git push
```

5. **Done!** Navigation updates everywhere automatically.

---

## 🔗 **Current Navigation Structure**

This repo's pages appear under:

```
Long-term outlook
  └── Revenue Forecast
        ├── Revenue Forecast Grapher (/revenue-forecasts)
        ├── Curve Browser (/revenue-forecasts/curves)
        ├── Curve Uploader (/admin/upload)
        ├── Curve Inventory (/admin/inventory)
        └── Curve Schedule (/curve-schedule)
  
  └── Futures Markets (/futures-markets)
```

---

## 🛠️ **Keeping Local Navigation in Sync**

If you choose to keep **local navigation** (Option 1), follow these steps when navigation changes:

### **When gst-homepage Navigation Updates:**

1. **Check** gst-homepage for changes:
```bash
# View the shared header config
curl https://gst-homepage.netlify.app/shared-header.js | grep "NAVIGATION_CONFIG" -A 100
```

2. **Update** `src/layouts/Layout.astro` to match

3. **Look for:**
   - New menu items
   - Changed labels or descriptions
   - Reordered items
   - New nested submenus

4. **Test** locally and deploy

### **When This Repo Adds New Pages:**

1. **Document** the new page and its path
2. **Notify** team to update shared navigation
3. **Or update** shared navigation yourself:
   ```bash
   cd /path/to/gst-homepage
   # Edit public/shared-header.js
   # Add new page under appropriate section
   git push
   ```

---

## 📞 **Need Help?**

- **Navigation not showing?** Check browser console for errors
- **Out of sync?** See [gst-homepage/docs/NAVIGATION_SYNC_GUIDE.md](../gst-homepage/docs/NAVIGATION_SYNC_GUIDE.md)
- **Adding complex menus?** Review shared-header.js examples

---

## 🚀 **Recommendation**

**Switch to Option 2 (Shared Navigation)** to:
- Eliminate manual syncing
- Ensure consistency across all sites
- Simplify future updates

The shared header is production-ready and used by all GridStor sites.

