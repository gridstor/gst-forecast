# GST Forecast Analytics Platform

A modern web application for analyzing and visualizing energy storage and forecasting data, built with Astro, React, and TypeScript.

## Tech Stack

### Frontend
- **Astro** - Modern static site builder and web framework
- **React** - UI component library
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js/Recharts** - Data visualization libraries

### Backend & Data
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Primary database
- **Netlify** - Deployment and hosting platform

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── common/     # Shared components
│   ├── CurveViewer/ # Curve visualization components
│   └── admin/      # Admin-specific components
├── pages/          # Astro pages and routes
├── layouts/        # Page layout components
├── presentations/  # Presentation-specific components
├── lib/           # Utility functions and helpers
├── types/         # TypeScript type definitions
├── config/        # Configuration files
└── scripts/       # Utility scripts and data processing
```

## Key Features

1. **Curve Visualization**
   - Interactive time-series data visualization
   - Multiple curve comparison
   - Real-time data updates
   - Hover interactions and tooltips

2. **Admin Interface**
   - Curve inventory management
   - Data import/export capabilities
   - User management

3. **Presentation System**
   - Custom presentation components
   - Dynamic data binding
   - Responsive layouts

## Data Flow

1. **Data Sources**
   - PostgreSQL database via Prisma
   - External API integrations
   - Local data processing scripts

2. **Processing Pipeline**
   - Data ingestion through scripts
   - Transformation and normalization
   - Storage in PostgreSQL
   - Real-time updates via API

3. **Frontend Integration**
   - Data fetching via Prisma client
   - State management in React components
   - Real-time updates and caching
   - Visualization rendering with Chart.js/Recharts

## Development

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- pnpm (recommended)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables
4. Run database migrations:
   ```bash
   pnpm prisma migrate dev
   ```
5. Start development server:
   ```bash
   pnpm dev
   ```

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm update-curves` - Update default curves data

## Deployment

The application is deployed on Netlify with automatic deployments from the main branch. The build process includes:
1. Prisma schema generation
2. Astro static site generation
3. Asset optimization
4. Netlify deployment

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Ensure all tests pass
5. Update documentation as needed

## License

[Add your license information here] 