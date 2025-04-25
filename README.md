# GridStor Analytics

A streamlined web application for viewing and analyzing curve data.

## Features

- **Curve Viewer**: View, compare, and download curve data with an interactive interface
- **Curve Inventory**: Manage and browse available curves

## Getting Started

### Prerequisites

- Node.js v18 or later
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database?schema=Forecasts"
   ```

### Development

Start the development server:

```
npm run dev
```

The application will be available at http://localhost:4321

### Build

Build the application for production:

```
npm run build
```

## Project Structure

- `/src/pages`: Application routes and pages
- `/src/components`: React components
- `/src/lib`: Utility functions and API clients
- `/prisma`: Database schema and client

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build locally
- `npm run update-curves`: Update default curves

## Deployment

This application is configured for deployment on Netlify. 