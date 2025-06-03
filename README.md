# GST-Forecast

A forecasting application for tracking and managing curve schedules and updates.

## Features

### Calendar Views
- **Curve Schedule Calendar** (`/curve-schedule/calendar`)
  - Monthly view of curve update schedules
  - Color-coded importance levels
  - Quick access to curve details
  - Visual indicators for update status

- **Curve Tracker Calendar** (`/curve-tracker/calendar`)
  - FullCalendar integration for advanced calendar features
  - Health score tracking and visualization
  - Drag-and-drop schedule updates
  - Detailed curve information on click

### Components
- **CurveCalendarView**: Main calendar component using FullCalendar
  - Supports day and month views
  - Event color coding based on health scores
  - Interactive event handling
  - Tooltip information display

- **DateFilter**: Date selection component
  - Optional date filtering
  - Clear date selection
  - Error handling for invalid dates

### Curve Details Page (`/curve-schedule/[id]`)
- Detailed view of individual curves
- Update history tracking
- Comment system with resolution status
- Receipt tracking
- Status indicators
  - Red: Overdue
  - Yellow: Due within 7 days
  - Green: Healthy

## Current Issues

### TypeScript/Linter Errors
1. Fragment Syntax Issues (Fixed)
   - Resolved issues with JSX fragment syntax in Astro files
   - Implemented proper conditional logic to avoid syntax conflicts

2. Remaining TypeScript Errors
   - Variable scope issues in Astro templates
   - Type definitions needed for curve data
   - Implicit any types in map callbacks
   - Missing type declarations for utility functions

### Known Issues to Address
1. Type Safety
   - Need to add proper TypeScript interfaces for curve data
   - Add type definitions for component props
   - Implement proper error boundaries

2. Data Fetching
   - Add error handling for database queries
   - Implement loading states
   - Add retry logic for failed requests

3. Component Structure
   - Consider splitting large components
   - Add proper prop validation
   - Implement proper state management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## Technologies Used
- Astro
- React
- TypeScript
- Prisma
- FullCalendar
- Tailwind CSS

## Contributing
1. Branch naming: `feature/description` or `fix/description`
2. Commit messages should be clear and descriptive
3. Add tests for new features
4. Update documentation as needed

## License

[Add your license information here] 

## Code Architecture

### Key File Structure

```
src/
├── pages/
│   ├── curve-schedule/
│   │   ├── index.astro      # Main schedule list
│   │   ├── calendar.astro   # Basic calendar view
│   │   └── [id].astro       # Individual curve details
│   ├── curve-tracker/
│   │   ├── inventory.astro  # Curve inventory management
│   │   └── calendar.astro   # Advanced calendar
│   └── api/curves/          # API endpoints
├── components/curve-tracker/
│   ├── CurveCalendarView.tsx # FullCalendar component
│   ├── CurveDetails.tsx      # Detailed curve view
│   ├── CurveGrid.tsx         # Grid layout
│   └── [other components]
└── types/
    └── curve.ts              # TypeScript definitions
```

### Data Model (Prisma Schema)

```typescript
// Main entities:
- CurveSchedule         # Schedule tracking
- CurveDefinition       # Curve metadata
- CurveUpdateHistory    # Update logs
- CurveReceipt         # Receipt tracking
- CurveComment         # Comments/notes
- PriceForecast        # Actual price data
```

### Key Integration Points

1. **Database Layer**: Prisma ORM connects to PostgreSQL
2. **API Routes**: Astro pages in `/api` handle data operations
3. **Component Communication**: Custom events and props
4. **State Management**: Local component state with React hooks
5. **Calendar Integration**: FullCalendar for advanced scheduling UI

### Current Implementation Status

**Fully Functional:**
- Basic CRUD operations for schedules
- Calendar views (both basic and advanced)
- Status tracking and health scores
- Comment system
- Update history

**Needs Work:**
- Complete TypeScript type coverage
- Error boundaries and loading states
- Data import/export functionality (buttons exist but routes missing)
- Comprehensive testing
- Better state management solution

The curve scheduler appears to be the central feature of your application, providing a comprehensive system for tracking when market curve data needs updating and managing the workflow around those updates. 