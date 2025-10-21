# GridStor Analytics Main Site Setup

This guide will help you set up the main site at `gridstoranalytics.com` that will host all your sub-sites.

## 1. Create Main Site Repository

Create a new repository for your main site with this structure:

```
gridstoranalytics-main/
├── src/
│   ├── pages/
│   │   ├── index.astro          # Landing page
│   │   └── [...slug].astro      # Catch-all for sub-site routing
│   ├── layouts/
│   │   └── Layout.astro         # Main layout
│   └── components/
│       └── Navigation.astro     # Site navigation
├── public/
├── astro.config.mjs
├── netlify.toml                 # Key: Proxy configuration
├── package.json
└── README.md
```

## 2. Main Site Files

### package.json
```json
{
  "name": "gridstoranalytics-main",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/netlify": "^6.3.4",
    "@astrojs/tailwind": "^6.0.2",
    "astro": "^5.8.1",
    "tailwindcss": "^3.4.1"
  }
}
```

### astro.config.mjs
```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [tailwind()]
});
```

### netlify.toml (CRITICAL - This handles the routing)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

# Proxy to forecasts sub-site
[[redirects]]
  from = "/forecasts/*"
  to = "https://gst-forecast-subsite.netlify.app/:splat"
  status = 200
  force = false

# Add more redirects for each sub-site
# [[redirects]]
#   from = "/analytics/*"
#   to = "https://your-analytics-subsite.netlify.app/:splat"
#   status = 200
#   force = false

# [[redirects]]
#   from = "/reports/*"
#   to = "https://your-reports-subsite.netlify.app/:splat"
#   status = 200
#   force = false

# Catch-all for main site (must be last)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### src/pages/index.astro
```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="GridStor Analytics">
  <main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-16">
        <h1 class="text-5xl font-bold text-gray-900 mb-6">
          GridStor Analytics
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive energy market forecasting and curve management platform
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <!-- Forecasts Section -->
        <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Forecasting</h3>
            <p class="text-gray-600 mb-6">
              Track and manage curve schedules and updates with advanced calendar views and status monitoring.
            </p>
            <a href="/forecasts/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Access Forecasts
            </a>
          </div>
        </div>

        <!-- Analytics Section (Placeholder) -->
        <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Analytics</h3>
            <p class="text-gray-600 mb-6">
              Deep insights and analysis tools for energy market data and trends.
            </p>
            <a href="/analytics/" class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              Coming Soon
            </a>
          </div>
        </div>

        <!-- Reports Section (Placeholder) -->
        <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Reports</h3>
            <p class="text-gray-600 mb-6">
              Generate comprehensive reports and documentation for stakeholders.
            </p>
            <a href="/reports/" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              Coming Soon
            </a>
          </div>
        </div>
      </div>
    </div>
  </main>
</Layout>
```

### src/layouts/Layout.astro
```astro
---
export interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="GridStor Analytics Platform" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <a href="/" class="text-xl font-bold text-gray-900">GridStor Analytics</a>
            <div class="hidden md:flex space-x-6">
              <a href="/forecasts/" class="text-gray-600 hover:text-gray-900">Forecasts</a>
              <a href="/analytics/" class="text-gray-600 hover:text-gray-900">Analytics</a>
              <a href="/reports/" class="text-gray-600 hover:text-gray-900">Reports</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <slot />
  </body>
</html>
```

## 3. Deployment Steps

### Step 1: Deploy Your Current Sub-Site (GST-Forecast)
1. Push your current repo to GitHub
2. Connect it to Netlify
3. Deploy it (it will get a subdomain like `gst-forecast-abc123.netlify.app`)
4. Note the subdomain URL

### Step 2: Create and Deploy Main Site
1. Create the main site repository with the files above
2. Connect it to Netlify
3. Set up custom domain `gridstoranalytics.com`
4. Update the `netlify.toml` redirects with your actual sub-site URLs

### Step 3: Configure Password Protection
In Netlify dashboard for the MAIN site:
1. Go to Site Settings → Access Control
2. Enable "Password Protection"
3. Set a password
4. This will protect the entire domain including proxied sub-sites

## 4. Testing

After deployment:
- `gridstoranalytics.com` → Main landing page
- `gridstoranalytics.com/forecasts/` → Your GST-Forecast site
- Navigation should work seamlessly
- Password protection applies to all paths

## 5. Adding More Sub-Sites

For each new sub-site:
1. **DO NOT** configure `base` in `astro.config.mjs` - let it serve from root
2. Deploy to Netlify (it gets its own domain like `subsite.netlify.app`)
3. Add redirect rule to main site's `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/sitename/*"
     to = "https://your-subsite.netlify.app/:splat"
     status = 200
     force = false
   ```

## ⚠️ CRITICAL: Asset Loading Configuration

**For Netlify Proxies to work correctly:**
- ❌ **WRONG**: Set `base: '/forecasts/'` in sub-site (causes asset loading errors)
- ✅ **CORRECT**: No `base` in sub-site, let it serve from its own root domain

The main site's proxy handles the path routing, while each sub-site serves its assets from its own domain. This prevents the MIME type errors and 404s you were experiencing.

## 6. How The Proxy Magic Works

1. User visits `gridstoranalytics.com/forecasts/`
2. Main site's Netlify proxy forwards request to `gst-forecast.netlify.app/`
3. Sub-site serves content from its own domain (assets work correctly)
4. User sees `gridstoranalytics.com/forecasts/` in address bar
5. All assets load from `gst-forecast.netlify.app/_astro/` (no MIME errors!)

The key is that each sub-site is deployed independently at its own root domain, but the main site proxies requests to them seamlessly!
