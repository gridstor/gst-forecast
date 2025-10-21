# 🚀 **Template Usage Guide**

This guide shows you exactly how to use the template files from your successful GridStor Analytics project to create new websites with the same design and tech stack.

## **📁 Files Created for Template**

In your current project, I've created these template files:
- `TEMPLATE_SPECIFICATION.md` - Complete tech stack and design documentation
- `TEMPLATE_package.json` - Dependencies and scripts template
- `TEMPLATE_astro.config.mjs` - Astro configuration template
- `TEMPLATE_tailwind.config.js` - Tailwind CSS configuration template
- `TEMPLATE_GUIDE.md` - This usage guide

## **🎯 How to Use This Template**

### **Step 1: Open New Cursor Project**
1. Open Cursor and create a new project folder
2. Copy this `TEMPLATE_SPECIFICATION.md` file to the new project
3. Copy all the `TEMPLATE_*` files to the new project

### **Step 2: Initialize New Astro Project**
```bash
# In your new project directory
npm create astro@latest . -- --template minimal --typescript --yes

# This creates the basic Astro structure
```

### **Step 3: Replace Configuration Files**
```bash
# Copy template configurations (remove TEMPLATE_ prefix)
cp TEMPLATE_package.json package.json
cp TEMPLATE_astro.config.mjs astro.config.mjs  
cp TEMPLATE_tailwind.config.js tailwind.config.js

# Update project name in package.json
# Edit package.json and change "your-project-name" to your actual project name
```

### **Step 4: Install Dependencies**
```bash
# Install all dependencies from template
npm install
```

### **Step 5: Copy Key Files from Original Project**

#### **A. Copy Layout and Components**
From your GridStor project, copy these to your new project:

```bash
# Create directories
mkdir -p src/components/common
mkdir -p src/lib
mkdir -p src/config

# Copy essential files
cp /path/to/gridstor/src/layouts/Layout.astro src/layouts/
cp /path/to/gridstor/src/components/common/* src/components/common/
cp /path/to/gridstor/src/lib/db.ts src/lib/
```

#### **B. Copy Database Setup**
```bash
# Copy Prisma configuration
cp /path/to/gridstor/prisma/schema.prisma prisma/
cp /path/to/gridstor/.env.example .env.example

# Create your .env file
cp .env.example .env
# Edit .env with your database credentials
```

#### **C. Copy Deployment Configuration**
```bash
# Copy Netlify configuration
cp /path/to/gridstor/netlify.toml .
```

### **Step 6: Customize for Your Project**

#### **A. Update Branding**
1. **Edit `src/layouts/Layout.astro`**:
   - Change "GridStor Analytics" to your app name
   - Update navigation menu items
   - Replace logo.svg with your logo

2. **Edit `tailwind.config.js`**:
   - Update color scheme if needed
   - Customize fonts if different

#### **B. Update Database Schema**
1. **Edit `prisma/schema.prisma`**:
   - Change schema name from "Forecasts" to your domain
   - Add your specific models
   - Remove GridStor-specific models

2. **Setup Database**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Create and run initial migration
   npx prisma migrate dev --name init
   ```

### **Step 7: Create Your Pages and Components**

#### **A. Create Your Homepage**
Edit `src/pages/index.astro` with your content:

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Home">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-900 mb-8">
      Welcome to Your App
    </h1>
    <p class="text-xl text-gray-600 mb-8">
      Built with the proven GridStor template
    </p>
  </div>
</Layout>
```

#### **B. Create Your Feature Pages**
```bash
# Create feature directories
mkdir -p src/pages/your-feature
mkdir -p src/pages/api/your-feature
mkdir -p src/components/your-feature

# Copy and adapt existing components as needed
```

### **Step 8: Test and Deploy**

#### **A. Test Locally**
```bash
# Start development server
npm run dev

# Visit http://localhost:4321
# Test all functionality
```

#### **B. Deploy to Netlify**
1. Push code to GitHub
2. Connect to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

## **🎨 Design System Reference**

Your template includes these design elements:

### **Colors**
- `gs-dark: #2A2A2A` - Primary dark
- `gs-blue: #34D5ED` - Brand blue  
- `gs-light: #FFFFFF` - Primary light
- `text-indigo-600` - Interactive elements

### **Typography**
- **Inter** font family (Google Fonts)
- Font weights: 400, 500, 600, 700

### **Component Patterns**
- **Cards**: `bg-white rounded-lg shadow p-6`
- **Buttons**: `bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700`
- **Forms**: `border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-600`

## **🔧 Common Customizations**

### **Change Color Scheme**
Edit `tailwind.config.js`:
```javascript
colors: {
  'primary': '#YOUR_COLOR',
  'secondary': '#YOUR_COLOR',
  'accent': '#YOUR_COLOR',
}
```

### **Add New Database Models**
Edit `prisma/schema.prisma`:
```prisma
model YourModel {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(255)
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  
  @@schema("YourDomain")
}
```

### **Add New API Endpoints**
Create `src/pages/api/your-endpoint.ts`:
```typescript
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/db';

export const GET: APIRoute = async () => {
  // Your API logic
};
```

## **✅ Success Checklist**

- [ ] New Astro project created
- [ ] Template files copied and renamed
- [ ] Dependencies installed successfully
- [ ] Layout and components copied
- [ ] Database configured and connected
- [ ] Environment variables set up
- [ ] Branding updated (app name, colors, logo)
- [ ] Homepage customized
- [ ] Development server running
- [ ] Ready to build your features!

## **🆘 Troubleshooting**

### **Database Connection Issues**
- Check DATABASE_URL in .env
- Ensure database is accessible
- Run `npx prisma generate` after schema changes

### **Build Errors**
- Check all imports are correct
- Ensure all dependencies are installed
- Run `npm run type-check` to find TypeScript issues

### **Styling Issues**
- Verify Tailwind classes are correct
- Check if custom CSS is conflicting
- Ensure fonts are loading properly

---

## **🎉 You're Ready!**

Your new project now has:
- ✅ Modern Astro.js + React + TypeScript setup
- ✅ Tailwind CSS with your design system
- ✅ PostgreSQL + Prisma database integration
- ✅ Chart.js for data visualization
- ✅ Netlify deployment configuration
- ✅ All the proven patterns from GridStor

**Start building your features and enjoy the productivity boost from this proven template!** 