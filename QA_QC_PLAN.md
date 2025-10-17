# QA/QC Plan - GST Forecast Application
## Quality Assurance & Quality Control Strategy

**Document Version:** 1.0  
**Last Updated:** October 17, 2025  
**Application:** GST Forecast - Energy Curve Management System

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Quality Standards](#quality-standards)
3. [Testing Strategy](#testing-strategy)
4. [Code Quality Assurance](#code-quality-assurance)
5. [Database Quality Control](#database-quality-control)
6. [Security & Compliance](#security--compliance)
7. [Deployment Procedures](#deployment-procedures)
8. [User Acceptance Testing (UAT)](#user-acceptance-testing-uat)
9. [Training & Documentation](#training--documentation)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Rollout Plan](#rollout-plan)
12. [Issue Management](#issue-management)

---

## Executive Summary

### Purpose
This QA/QC plan ensures the GST Forecast application meets quality standards before and after deployment to your organization. It covers testing procedures, code quality, security, deployment, and ongoing maintenance.

### Scope
- **Application:** GST Forecast (Curve Management & Scheduling System)
- **Users:** Internal organization members (admin, analysts, traders)
- **Deployment:** Netlify (gridstor.netlify.app → gridstoranalytics.com)
- **Environment:** Production, Staging, Development

### Quality Objectives
- ✅ **Reliability:** 99.5% uptime
- ✅ **Data Accuracy:** 100% data integrity in curve uploads
- ✅ **Performance:** Page load < 3 seconds
- ✅ **Security:** No critical vulnerabilities
- ✅ **Usability:** User tasks completable without training (intuitive UI)

---

## Quality Standards

### 1. Code Quality Standards

#### TypeScript Standards
```typescript
// ✅ REQUIRED: All new code must have proper types
// ❌ NO implicit 'any' types
// ❌ NO type assertions without justification

// Good Example:
interface CurveDefinition {
  id: number;
  name: string;
  granularity: 'HOURLY' | 'DAILY' | 'MONTHLY';
  marketType: string;
}

// Bad Example:
const curve: any = {}; // ❌ Never use 'any'
```

#### File Organization Standards
```
src/
├── components/          # Reusable React/Astro components
│   ├── [feature]/      # Group by feature
│   └── common/         # Shared components
├── pages/              # Route pages (Astro)
│   ├── admin/         # Admin pages
│   ├── api/           # API endpoints
│   └── [feature]/     # Feature pages
├── lib/               # Utility functions
├── types/             # TypeScript type definitions
└── config/            # Configuration files
```

#### Naming Conventions
- **Components:** PascalCase (`CurveUpload.tsx`, `DateFilter.tsx`)
- **Files:** kebab-case (`curve-upload.astro`, `date-filter.tsx`)
- **Variables:** camelCase (`curveDefinition`, `selectedDate`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`, `API_BASE_URL`)
- **Types/Interfaces:** PascalCase (`CurveData`, `UploadResponse`)

### 2. Documentation Standards

#### Required Documentation for Each Feature
1. **Inline Code Comments** - Complex logic explanations
2. **Function Documentation** - JSDoc format
3. **Component Props** - TypeScript interfaces with descriptions
4. **API Endpoints** - Request/response examples
5. **Database Schema** - Entity relationships and constraints

#### Example:
```typescript
/**
 * Uploads curve data with validation
 * @param definitionId - The curve definition ID
 * @param instanceId - The curve instance ID
 * @param data - CSV parsed data array
 * @returns Upload result with validation errors
 * @throws {ValidationError} If data format is invalid
 */
async function uploadCurveData(
  definitionId: number,
  instanceId: number,
  data: CurveDataPoint[]
): Promise<UploadResult> {
  // Implementation...
}
```

### 3. Database Standards

#### Required for All Schema Changes
- ✅ Migration script with rollback
- ✅ Schema documentation update
- ✅ Test data for development
- ✅ Performance index analysis
- ✅ Backup before production deployment

#### Data Integrity Rules
1. All foreign keys must have proper constraints
2. Required fields must have NOT NULL constraints
3. Date fields must have timezone handling
4. Audit fields (createdAt, updatedAt) on all tables
5. Soft delete preferred over hard delete

---

## Testing Strategy

### Testing Pyramid

```
           /\
          /  \         E2E Tests (5%)
         /____\        - Full user workflows
        /      \       - Critical paths only
       /        \      
      /  Integration  \  Integration Tests (15%)
     /    Tests       \ - API endpoints
    /__________________\- Database operations
   /                    \
  /    Unit Tests        \ Unit Tests (80%)
 /________________________\- Functions & components
```

### 1. Unit Testing

#### What to Test
- ✅ Utility functions (`lib/` directory)
- ✅ Data validation functions
- ✅ Business logic calculations
- ✅ Date/time parsing functions
- ✅ CSV parsing logic

#### Testing Framework
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Target: 80% code coverage
```

#### Example Test Structure
```typescript
// lib/dateUtils.test.ts
import { describe, it, expect } from 'vitest';
import { isWithinDeliveryPeriod, formatTimestamp } from './dateUtils';

describe('dateUtils', () => {
  describe('isWithinDeliveryPeriod', () => {
    it('should return true for dates within period', () => {
      const result = isWithinDeliveryPeriod(
        new Date('2025-01-15'),
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
      expect(result).toBe(true);
    });

    it('should return false for dates outside period', () => {
      const result = isWithinDeliveryPeriod(
        new Date('2025-02-15'),
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
      expect(result).toBe(false);
    });
  });
});
```

### 2. Integration Testing

#### Critical API Endpoints to Test
```typescript
// Test file: src/pages/api/curves/definitions.test.ts

describe('GET /api/curves/definitions', () => {
  it('should return all curve definitions', async () => {
    const response = await fetch('/api/curves/definitions');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('POST /api/curve-upload/create-definition', () => {
  it('should create a new curve definition', async () => {
    const payload = {
      name: 'Test Curve',
      granularity: 'HOURLY',
      marketType: 'POWER'
    };
    const response = await fetch('/api/curve-upload/create-definition', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(response.status).toBe(201);
  });

  it('should reject invalid granularity', async () => {
    const payload = {
      name: 'Test Curve',
      granularity: 'INVALID',
      marketType: 'POWER'
    };
    const response = await fetch('/api/curve-upload/create-definition', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(response.status).toBe(400);
  });
});
```

#### Database Integration Tests
```typescript
// Test database operations
describe('Curve Upload Flow', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDB();
  });

  afterEach(async () => {
    // Cleanup
    await cleanupTestDB();
  });

  it('should create definition, instance, and upload data', async () => {
    // 1. Create definition
    const definition = await createDefinition({...});
    
    // 2. Create instance
    const instance = await createInstance({...});
    
    // 3. Upload data
    const result = await uploadData({...});
    
    // 4. Verify data in database
    const stored = await fetchCurveData(definition.id, instance.id);
    expect(stored.length).toBeGreaterThan(0);
  });
});
```

### 3. End-to-End Testing

#### Critical User Workflows

**Test Case 1: Upload New Curve (Complete Flow)**
```
1. Navigate to /admin/upload
2. Select "Create new curve" in Section 1
3. Fill in curve details:
   - Name: "Test Power Curve Q1 2025"
   - Granularity: Hourly
   - Market Type: Power
4. Click "Create Curve"
5. Verify: Success message appears
6. Select "Create new instance" in Section 2
7. Fill in instance details:
   - Delivery start: 2025-01-01
   - Delivery end: 2025-03-31
   - Created by: test@company.com
8. Click "Create Instance"
9. Verify: Success message appears
10. Download template in Section 3
11. Verify: Template has correct date range and headers
12. Upload filled template with test data
13. Verify: Data preview shows correctly
14. Click "Upload Data"
15. Verify: Success message and confirmation
16. Navigate to /admin/inventory
17. Verify: New curve appears in list
```

**Test Case 2: Edit Existing Curve**
```
1. Navigate to /curve-tracker/calendar
2. Click on existing curve event
3. Edit curve details
4. Save changes
5. Verify: Changes reflected in calendar
6. Verify: Update recorded in history
```

**Test Case 3: Schedule Management**
```
1. Navigate to /curve-schedule/calendar
2. View monthly schedule
3. Filter by importance level
4. Click on scheduled update
5. Mark as completed
6. Add comment
7. Verify: Status updated
8. Verify: Comment saved
```

#### E2E Testing Tools
```bash
# Option 1: Playwright (Recommended)
npm install -D @playwright/test

# Option 2: Cypress
npm install -D cypress
```

### 4. Manual Testing Checklist

#### Pre-Deployment Checklist

**Functionality Testing**
- [ ] All pages load without errors
- [ ] Navigation between pages works
- [ ] Forms validate correctly
- [ ] Upload accepts valid CSV files
- [ ] Upload rejects invalid CSV files
- [ ] Calendar views display events correctly
- [ ] Filter and search functionality works
- [ ] Data exports successfully

**UI/UX Testing**
- [ ] Responsive design works on desktop (1920x1080, 1366x768)
- [ ] Responsive design works on tablet (768x1024)
- [ ] All buttons have hover states
- [ ] Loading states display during async operations
- [ ] Error messages are clear and helpful
- [ ] Success messages confirm actions
- [ ] Modal dialogs close properly
- [ ] Date pickers work correctly

**Browser Compatibility**
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - if Mac users in org

**Performance Testing**
- [ ] Initial page load < 3 seconds
- [ ] API responses < 1 second
- [ ] Large CSV upload completes without timeout
- [ ] Calendar renders 100+ events smoothly
- [ ] No memory leaks during extended use

**Security Testing**
- [ ] API endpoints require authentication (if implemented)
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] CSRF protection in place
- [ ] File upload limited to CSV only
- [ ] File size limits enforced

---

## Code Quality Assurance

### 1. Static Analysis Tools

#### TypeScript Type Checking
```bash
# Run type checker before every commit
npm run type-check

# Expected: 0 errors
```

#### ESLint Configuration
```bash
# Install ESLint (if not already)
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Run linter
npx eslint src/ --ext .ts,.tsx,.astro

# Auto-fix simple issues
npx eslint src/ --fix
```

#### Prettier Configuration
```bash
# Install Prettier
npm install -D prettier

# Format all code
npx prettier --write "src/**/*.{ts,tsx,astro,js,jsx,css}"
```

### 2. Code Review Standards

#### Every Pull Request Must Have:
1. ✅ **Description** - What and why
2. ✅ **Testing Evidence** - Screenshots or test results
3. ✅ **Type Safety** - No TypeScript errors
4. ✅ **No Console Logs** - Remove debug statements
5. ✅ **Documentation** - Update relevant docs
6. ✅ **Review Approval** - At least one approver

#### Code Review Checklist
```markdown
## Code Review Checklist

**Functionality**
- [ ] Code does what PR description says
- [ ] Edge cases handled
- [ ] Error handling implemented

**Code Quality**
- [ ] Follows naming conventions
- [ ] No duplicate code
- [ ] Functions are single-purpose
- [ ] Complex logic is commented

**Testing**
- [ ] Unit tests added/updated
- [ ] Tests pass locally
- [ ] Manual testing completed

**Security**
- [ ] No sensitive data in code
- [ ] Input validation present
- [ ] No SQL injection vulnerabilities

**Performance**
- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] Large lists virtualized/paginated
```

### 3. Git Workflow Standards

#### Branch Naming
```bash
# Feature branches
feature/curve-upload-validation
feature/calendar-drag-drop

# Bug fixes
fix/upload-validation-error
fix/calendar-display-issue

# Hotfixes (production)
hotfix/critical-api-error
```

#### Commit Message Format
```bash
# Format: type(scope): description

feat(upload): add multi-file upload support
fix(calendar): correct date range calculation
docs(readme): update installation instructions
test(api): add integration tests for curves endpoint
chore(deps): update dependencies
```

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

---

## Database Quality Control

### 1. Schema Change Process

#### Before Any Schema Change:
```bash
# 1. Backup production database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).sql

# 2. Test migration on local database
npx prisma migrate dev --name descriptive_migration_name

# 3. Review generated SQL
cat prisma/migrations/[timestamp]_descriptive_migration_name/migration.sql

# 4. Test rollback capability
# Create a down.sql file for complex migrations
```

#### Migration Checklist
- [ ] Migration has descriptive name
- [ ] Migration is idempotent (can run multiple times safely)
- [ ] Default values provided for new required fields
- [ ] Indexes added for foreign keys
- [ ] Rollback script created (for production)
- [ ] Tested on copy of production data
- [ ] Performance impact assessed
- [ ] Documentation updated

### 2. Data Validation Rules

#### Curve Definition Validation
```typescript
// Must validate on both client and server
interface CurveDefinitionValidation {
  name: string;          // Required, 3-200 chars, unique
  granularity: string;   // Must be: HOURLY, DAILY, MONTHLY
  marketType: string;    // Required, 2-50 chars
  description?: string;  // Optional, max 1000 chars
}
```

#### Curve Instance Validation
```typescript
interface CurveInstanceValidation {
  definitionId: number;     // Must exist in CurveDefinition
  deliveryStart: Date;      // Required, must be valid date
  deliveryEnd: Date;        // Required, must be > deliveryStart
  createdBy: string;        // Required, email format
  createdByName?: string;   // Optional
}
```

#### Price Forecast Data Validation
```typescript
interface PriceForecastValidation {
  timestamp: Date;          // Required, ISO 8601 format
  // Must be within deliveryStart and deliveryEnd
  
  P5?: number;             // Optional, but at least one P* required
  P25?: number;
  P50?: number;            // Most common
  P75?: number;
  P95?: number;
  
  // All P-values must be >= 0
  // P5 <= P25 <= P50 <= P75 <= P95 (monotonic)
}
```

### 3. Data Integrity Monitoring

#### Daily Automated Checks
```sql
-- Check 1: Orphaned records
SELECT COUNT(*) as orphaned_forecasts
FROM "PriceForecast" pf
LEFT JOIN "CurveInstance" ci ON pf."curveInstanceId" = ci.id
WHERE ci.id IS NULL;
-- Expected: 0

-- Check 2: Invalid date ranges
SELECT COUNT(*) as invalid_ranges
FROM "CurveInstance"
WHERE "deliveryEnd" <= "deliveryStart";
-- Expected: 0

-- Check 3: Data outside delivery period
SELECT COUNT(*) as outside_period
FROM "PriceForecast" pf
JOIN "CurveInstance" ci ON pf."curveInstanceId" = ci.id
WHERE pf.timestamp < ci."deliveryStart" 
   OR pf.timestamp > ci."deliveryEnd";
-- Expected: 0

-- Check 4: Negative prices (if not allowed)
SELECT COUNT(*) as negative_prices
FROM "PriceForecast"
WHERE P50 < 0 OR P25 < 0 OR P75 < 0;
-- Expected: 0 (or validate per market type)

-- Check 5: Non-monotonic quantiles
SELECT COUNT(*) as non_monotonic
FROM "PriceForecast"
WHERE (P5 IS NOT NULL AND P25 IS NOT NULL AND P5 > P25)
   OR (P25 IS NOT NULL AND P50 IS NOT NULL AND P25 > P50)
   OR (P50 IS NOT NULL AND P75 IS NOT NULL AND P50 > P75)
   OR (P75 IS NOT NULL AND P95 IS NOT NULL AND P75 > P95);
-- Expected: 0
```

#### Weekly Data Quality Report
```sql
-- Generate weekly report
SELECT 
  cd.name as curve_name,
  COUNT(DISTINCT ci.id) as num_instances,
  COUNT(pf.id) as num_data_points,
  MIN(pf.timestamp) as earliest_data,
  MAX(pf.timestamp) as latest_data,
  AVG(pf."P50") as avg_p50,
  COUNT(CASE WHEN pf."P50" IS NULL THEN 1 END) as missing_p50
FROM "CurveDefinition" cd
LEFT JOIN "CurveInstance" ci ON cd.id = ci."curveDefinitionId"
LEFT JOIN "PriceForecast" pf ON ci.id = pf."curveInstanceId"
WHERE ci."deliveryStart" >= NOW() - INTERVAL '7 days'
GROUP BY cd.id, cd.name
ORDER BY cd.name;
```

---

## Security & Compliance

### 1. Security Checklist

#### Application Security
- [ ] **Authentication** - Implement user authentication (if not already)
- [ ] **Authorization** - Role-based access control for admin pages
- [ ] **Input Validation** - All user inputs validated and sanitized
- [ ] **SQL Injection** - Use parameterized queries (Prisma handles this)
- [ ] **XSS Protection** - All user content escaped before rendering
- [ ] **CSRF Protection** - Anti-CSRF tokens on forms
- [ ] **File Upload Security** - Validate file type, size, content
- [ ] **Error Messages** - Don't expose stack traces in production
- [ ] **API Rate Limiting** - Prevent abuse
- [ ] **HTTPS Only** - All traffic encrypted

#### Environment Variables Security
```bash
# NEVER commit these to git
# Store in Netlify environment variables

DATABASE_URL=postgresql://...
API_SECRET_KEY=...
ADMIN_PASSWORD=...

# Use .env.example for documentation only
# .env should be in .gitignore
```

#### Dependency Security
```bash
# Run security audit regularly
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated

# Update dependencies
npm update
```

### 2. Data Privacy & Compliance

#### Sensitive Data Handling
```typescript
// ✅ DO: Store user email/name only
interface UserInfo {
  email: string;
  name: string;
}

// ❌ DON'T: Store unnecessary personal info
interface UserInfo {
  email: string;
  name: string;
  ssn: string;        // ❌ Never needed
  birthday: Date;     // ❌ Not necessary
  address: string;    // ❌ Not required
}
```

#### Audit Logging
```typescript
// Log all critical actions
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string;        // 'CREATE', 'UPDATE', 'DELETE', 'UPLOAD'
  resourceType: string;  // 'CurveDefinition', 'CurveInstance', 'PriceForecast'
  resourceId: number;
  changes?: object;      // Before/after for updates
  ipAddress?: string;
  userAgent?: string;
}

// Example usage
await logAudit({
  userId: user.email,
  action: 'UPLOAD',
  resourceType: 'PriceForecast',
  resourceId: instanceId,
  metadata: { rowCount: data.length }
});
```

#### Data Retention Policy
```markdown
**Production Data Retention:**
- Price Forecast Data: Keep indefinitely (business requirement)
- Curve Instances: Keep indefinitely
- Audit Logs: Keep for 2 years
- Error Logs: Keep for 90 days
- User Sessions: Expire after 24 hours

**Development/Staging Data:**
- Refresh from production monthly
- Anonymize user data (if any PII)
- Delete after 30 days of inactivity
```

---

## Deployment Procedures

### 1. Environment Setup

#### Environments
```
Development  → Local machine (npm run dev)
    ↓
Staging      → staging-gridstor.netlify.app (preview deployments)
    ↓
Production   → gridstor.netlify.app → gridstoranalytics.com
```

### 2. Pre-Deployment Checklist

#### Developer Checklist
- [ ] All tests pass locally
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Migration scripts tested (if applicable)
- [ ] Environment variables documented

#### QA Checklist
- [ ] All test cases pass
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Browser compatibility verified
- [ ] Accessibility checked
- [ ] Mobile responsiveness verified

### 3. Deployment Process

#### Step 1: Staging Deployment
```bash
# 1. Create deployment branch
git checkout -b deploy/staging-v1.x.x

# 2. Run final tests
npm run test
npm run type-check

# 3. Build for production
npm run build

# 4. Test build locally
npm run preview

# 5. Push to staging
git push origin deploy/staging-v1.x.x
# Netlify auto-deploys preview

# 6. Smoke test staging environment
# - Visit key pages
# - Test critical workflows
# - Check database connectivity
```

#### Step 2: Database Migration (if needed)
```bash
# PRODUCTION DATABASE CHANGES

# 1. Backup database
pg_dump -h $PROD_DB_HOST -U $DB_USER -d $DB_NAME > backup_pre_migration.sql

# 2. Verify backup
wc -l backup_pre_migration.sql

# 3. Run migration
npx prisma migrate deploy

# 4. Verify migration
psql -h $PROD_DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"

# 5. Test critical queries
# Run validation queries from Data Integrity section
```

#### Step 3: Production Deployment
```bash
# 1. Merge to main branch
git checkout main
git merge deploy/staging-v1.x.x

# 2. Tag release
git tag -a v1.x.x -m "Release version 1.x.x: [description]"
git push origin main --tags

# 3. Netlify auto-deploys main branch

# 4. Monitor deployment
# - Check Netlify deploy logs
# - Verify site is live
# - Check error monitoring
```

### 4. Post-Deployment Verification

#### Smoke Tests (Run immediately after deployment)
```bash
# Test 1: Site is accessible
curl -I https://gridstoranalytics.com/admin/upload
# Expected: 200 OK

# Test 2: API endpoints responding
curl https://gridstoranalytics.com/api/curves/definitions
# Expected: JSON array

# Test 3: Database connectivity
curl https://gridstoranalytics.com/api/health
# Expected: {"status": "ok", "database": "connected"}

# Test 4: Static assets loading
curl -I https://gridstoranalytics.com/logo.svg
# Expected: 200 OK
```

#### Monitor for First 24 Hours
- [ ] Error rate < 1%
- [ ] Response times normal
- [ ] No database deadlocks
- [ ] No memory leaks
- [ ] User feedback positive

### 5. Rollback Procedure

#### If Critical Issue Found:
```bash
# Option 1: Netlify instant rollback
# 1. Go to Netlify dashboard
# 2. Select previous deployment
# 3. Click "Publish deploy"

# Option 2: Git revert
git revert HEAD
git push origin main

# Option 3: Database rollback (if migration failed)
# 1. Restore from backup
psql -h $PROD_DB_HOST -U $DB_USER -d $DB_NAME < backup_pre_migration.sql

# 2. Revert application to previous version
```

#### Rollback Decision Criteria
- **Critical Bug:** Prevents core functionality → Immediate rollback
- **Data Loss Risk:** Potential data corruption → Immediate rollback
- **Security Issue:** Vulnerability exposed → Immediate rollback
- **Minor Bug:** Doesn't block users → Fix forward, deploy patch
- **Performance Issue:** Slowdown but functional → Monitor, schedule fix

---

## User Acceptance Testing (UAT)

### 1. UAT Planning

#### UAT Team
- **Product Owner** - Approves functionality
- **Power Users** (2-3) - Test workflows extensively
- **End Users** (5-7) - Test realistic scenarios
- **QA Lead** - Coordinates testing, tracks issues

#### UAT Timeline
```
Week 1: UAT Planning & Setup
- Prepare UAT environment
- Create test accounts
- Distribute test plan

Week 2: UAT Execution
- Users perform test scenarios
- Log issues in tracking system
- Daily standup to discuss blockers

Week 3: Issue Resolution
- Fix critical and high issues
- Retest fixed issues
- Update documentation based on feedback

Week 4: Final Approval
- Sign-off from product owner
- Final smoke tests
- Go/no-go decision
```

### 2. UAT Test Scenarios

#### Scenario 1: First-Time User - Upload Curve
**User Profile:** Analyst who has never used the system  
**Success Criteria:** Complete upload without assistance in < 10 minutes

**Steps:**
1. Login to system
2. Navigate to upload page
3. Understand the 3-section workflow
4. Create a new curve definition
5. Create a new instance
6. Download template
7. Fill template with test data
8. Upload completed template
9. Verify data in inventory

**Metrics:**
- Time to complete: Target < 10 minutes
- Help requests: Target 0
- Errors encountered: Target 0
- User satisfaction: Target 4/5 stars

#### Scenario 2: Power User - Bulk Operations
**User Profile:** Daily user managing multiple curves  
**Success Criteria:** Efficiently manage 10+ curves

**Steps:**
1. View curve inventory
2. Filter/search for specific curves
3. Update multiple curve schedules
4. Add comments to curves
5. Export curve data
6. View calendar to check upcoming deadlines

**Metrics:**
- Time to update 10 curves: Target < 5 minutes
- Clicks required: Minimize
- User satisfaction: Target 4.5/5 stars

#### Scenario 3: Manager - Reporting & Monitoring
**User Profile:** Manager who needs oversight  
**Success Criteria:** Get complete picture of curve status

**Steps:**
1. View dashboard/summary
2. Identify overdue curves
3. Check curve health scores
4. Review recent updates
5. Understand team workload

**Metrics:**
- Time to get status report: Target < 2 minutes
- Completeness of information: Target 100%
- User satisfaction: Target 4.5/5 stars

### 3. UAT Feedback Collection

#### Feedback Form Template
```markdown
## UAT Feedback Form

**Tester Name:** _______________
**Date:** _______________
**Test Scenario:** _______________

### Functionality (1-5)
- Works as expected: ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5
- Easy to understand: ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5
- Meets my needs: ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

### Usability (1-5)
- Interface is intuitive: ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5
- Navigation is clear: ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5
- Error messages helpful: ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

### Issues Encountered
Issue #1: _______________
Severity: ☐ Critical  ☐ High  ☐ Medium  ☐ Low

Issue #2: _______________
Severity: ☐ Critical  ☐ High  ☐ Medium  ☐ Low

### Suggestions for Improvement
1. _______________
2. _______________
3. _______________

### Overall Satisfaction
☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

**Would you recommend this tool to colleagues?**
☐ Yes  ☐ No  ☐ Maybe

**Comments:**
_________________________________
```

---

## Training & Documentation

### 1. User Documentation

#### Required Documentation

**1. Quick Start Guide** (1-page, visual)
```markdown
# GST Forecast - Quick Start

## Uploading Your First Curve (5 minutes)

1. Go to /admin/upload
2. Section 1: Select or create curve
3. Section 2: Select or create instance
4. Section 3: Upload your data

[Include screenshots for each step]

## Need Help?
- Full guide: [link]
- Video tutorial: [link]
- Contact: support@company.com
```

**2. User Manual** (Comprehensive)
```markdown
Table of Contents:
1. Introduction & Overview
2. Getting Started
   2.1 Accessing the System
   2.2 Navigation Overview
   2.3 User Interface Tour
3. Core Features
   3.1 Uploading Curves
   3.2 Managing Curve Inventory
   3.3 Viewing Schedules
   3.4 Monitoring Health Scores
4. Advanced Features
   4.1 Bulk Operations
   4.2 Data Export
   4.3 Comment System
   4.4 Calendar Views
5. Troubleshooting
6. FAQs
7. Glossary
8. Contact Information
```

**3. Administrator Guide**
```markdown
Table of Contents:
1. System Administration
   1.1 User Management
   1.2 Database Maintenance
   1.3 Backup Procedures
2. Configuration
   2.1 Environment Variables
   2.2 Feature Flags
3. Monitoring
   3.1 Performance Metrics
   3.2 Error Tracking
   3.3 Usage Analytics
4. Troubleshooting
5. Common Admin Tasks
```

### 2. Training Program

#### Training Levels

**Level 1: Basic User Training (30 minutes)**
- Audience: All users
- Format: Video + hands-on practice
- Topics:
  - System overview
  - Upload workflow
  - Viewing curve inventory
  - Basic navigation

**Level 2: Power User Training (1 hour)**
- Audience: Daily users
- Format: Interactive workshop
- Topics:
  - Advanced upload features
  - Bulk operations
  - Calendar management
  - Data validation
  - Troubleshooting common issues

**Level 3: Administrator Training (2 hours)**
- Audience: System administrators
- Format: Technical workshop
- Topics:
  - System architecture
  - Database management
  - Deployment procedures
  - Monitoring and alerts
  - User support

#### Training Materials Checklist
- [ ] Video tutorials (5-10 minutes each)
- [ ] Interactive demos
- [ ] Practice environment with test data
- [ ] Cheat sheets (printable/downloadable)
- [ ] FAQ document
- [ ] Troubleshooting guide
- [ ] Knowledge base articles

### 3. Video Tutorial Scripts

#### Tutorial 1: "Uploading Your First Curve" (7 min)
```
[0:00-0:30] Introduction
"Welcome to GST Forecast. Today I'll show you how to upload your first curve in under 7 minutes."

[0:30-1:30] Overview of Upload Page
"The upload page has 3 clear sections..."
[Show UI, highlight sections]

[1:30-3:00] Section 1: Define the Curve
"First, we define what type of curve we're uploading..."
[Demo creating new definition]

[3:00-4:30] Section 2: Create Instance
"Now we create a specific instance for our delivery period..."
[Demo creating instance]

[4:30-6:00] Section 3: Upload Data
"Finally, we upload our data. You can download a pre-filled template..."
[Demo template download and upload]

[6:00-7:00] Verification & Next Steps
"You can verify your upload in the inventory page..."
[Show inventory, wrap up]
```

#### Tutorial 2: "Using the Calendar View" (5 min)
```
[0:00-0:30] Introduction
[0:30-2:00] Calendar Navigation
[2:00-3:30] Understanding Health Scores
[3:30-4:30] Updating Schedules
[4:30-5:00] Wrap-up
```

---

## Monitoring & Maintenance

### 1. Performance Monitoring

#### Key Metrics to Track

**Application Performance**
```javascript
// Metrics to monitor
const metrics = {
  // Response Times
  pageLoadTime: 'Target: < 3 seconds',
  apiResponseTime: 'Target: < 1 second',
  databaseQueryTime: 'Target: < 500ms',
  
  // Throughput
  requestsPerSecond: 'Monitor for spikes',
  concurrentUsers: 'Baseline: X users',
  
  // Errors
  errorRate: 'Target: < 1%',
  failedUploads: 'Target: < 2%',
  apiErrors: 'Alert on 5xx errors',
  
  // Resources
  memoryUsage: 'Monitor for leaks',
  cpuUsage: 'Baseline: X%',
  databaseConnections: 'Monitor pool'
};
```

#### Monitoring Tools Setup

**1. Netlify Analytics** (Built-in)
- Page views
- Unique visitors
- Top pages
- Bandwidth usage

**2. Error Tracking: Sentry** (Recommended)
```bash
# Install Sentry
npm install @sentry/react @sentry/astro

# Initialize in application
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**3. Database Monitoring**
```sql
-- Create monitoring view
CREATE VIEW system_health AS
SELECT
  'total_definitions' as metric,
  COUNT(*)::text as value
FROM "CurveDefinition"
UNION ALL
SELECT
  'total_instances',
  COUNT(*)::text
FROM "CurveInstance"
UNION ALL
SELECT
  'total_forecasts',
  COUNT(*)::text
FROM "PriceForecast"
UNION ALL
SELECT
  'active_instances',
  COUNT(*)::text
FROM "CurveInstance"
WHERE "deliveryEnd" >= NOW();

-- Query this view for health checks
SELECT * FROM system_health;
```

**4. Uptime Monitoring**
```bash
# Use service like UptimeRobot or Pingdom
# Monitor these endpoints:

# Main page
https://gridstoranalytics.com/admin/upload

# API health check
https://gridstoranalytics.com/api/health

# Database connectivity
https://gridstoranalytics.com/api/db-health

# Frequency: Every 5 minutes
# Alert on: 2 consecutive failures
```

### 2. Alert Configuration

#### Alert Priorities

**P0 - Critical (Page immediately)**
- Site completely down
- Database unavailable
- Data loss detected
- Security breach

**P1 - High (Alert within 15 min)**
- Key features broken (upload fails)
- API error rate > 5%
- Response times > 10 seconds
- Database performance degraded

**P2 - Medium (Alert within 1 hour)**
- Non-critical feature broken
- Error rate 2-5%
- Response times 5-10 seconds
- Disk space > 80%

**P3 - Low (Daily digest)**
- Minor UI issues
- Error rate 1-2%
- Performance trending downward
- Warning logs

#### Alert Routing
```yaml
alerts:
  P0_Critical:
    channels:
      - SMS to on-call engineer
      - Phone call if no acknowledgment in 5 min
      - Slack #critical-alerts
      - Email to engineering@company.com
  
  P1_High:
    channels:
      - Slack #eng-alerts
      - Email to on-call engineer
      - PagerDuty
  
  P2_Medium:
    channels:
      - Slack #eng-alerts
      - Email to team
  
  P3_Low:
    channels:
      - Daily digest email
      - Weekly report
```

### 3. Maintenance Schedule

#### Daily
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backup completion
- [ ] Monitor disk space

#### Weekly
- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Check for security updates
- [ ] Review and triage issues
- [ ] Update documentation if needed

#### Monthly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Dependency updates
- [ ] Database optimization (VACUUM, ANALYZE)
- [ ] Review and update monitoring thresholds
- [ ] Capacity planning

#### Quarterly
- [ ] User satisfaction survey
- [ ] Feature usage analysis
- [ ] Infrastructure cost review
- [ ] Disaster recovery drill
- [ ] Documentation audit
- [ ] Training material updates

### 4. Backup & Recovery

#### Backup Strategy

**Database Backups**
```bash
# Automated daily backups (run via cron)
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
BACKUP_FILE="$BACKUP_DIR/gst_forecast_$DATE.sql"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3 or similar
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/database/

# Keep local backups for 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Keep S3 backups for 90 days (configure lifecycle policy)
```

**Backup Schedule:**
- **Hourly:** Transaction log backup (if supported)
- **Daily:** Full database backup at 2 AM
- **Weekly:** Full system backup (Sunday 1 AM)
- **Monthly:** Archival backup (retain 1 year)

**Backup Verification:**
```bash
# Weekly restore test (on staging)
#!/bin/bash
# test-restore.sh

# Restore latest backup to staging
LATEST_BACKUP=$(ls -t /backups/database/*.gz | head -1)
gunzip -c $LATEST_BACKUP | psql -h $STAGING_DB_HOST -U $DB_USER -d staging_db

# Run validation queries
psql -h $STAGING_DB_HOST -U $DB_USER -d staging_db -f validation_queries.sql

# Email results
mail -s "Backup Restore Test Results" ops@company.com < results.txt
```

#### Disaster Recovery Plan

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours

**Recovery Procedures:**

**Scenario 1: Application Failure**
```bash
# 1. Verify issue is with application, not infrastructure
curl https://gridstoranalytics.com

# 2. Check Netlify deployment status
# Go to Netlify dashboard

# 3. Roll back to last known good deployment
# Via Netlify UI or:
netlify deploy --prod --dir=dist

# 4. Monitor for recovery
# Time estimate: 5-10 minutes
```

**Scenario 2: Database Corruption**
```bash
# 1. Stop application (set maintenance mode)
# 2. Assess corruption extent
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > test_dump.sql
# If this fails, corruption is severe

# 3. Restore from latest backup
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < latest_backup.sql

# 4. Verify data integrity
# Run validation queries

# 5. Restart application
# Time estimate: 1-2 hours
```

**Scenario 3: Complete Infrastructure Loss**
```bash
# 1. Provision new database
# Via cloud provider UI

# 2. Restore latest backup
# Upload backup file to new database

# 3. Update environment variables
# In Netlify: DATABASE_URL=new_connection_string

# 4. Deploy application
netlify deploy --prod

# 5. Verify functionality
# Run smoke tests

# Time estimate: 2-4 hours
```

---

## Rollout Plan

### Phase 1: Internal Alpha (Week 1-2)
**Participants:** 2-3 team members  
**Goal:** Identify critical bugs and usability issues

**Activities:**
- [ ] Deploy to staging environment
- [ ] Provide training to alpha testers
- [ ] Alpha testers use system for real work
- [ ] Daily feedback sessions
- [ ] Fix critical and high-priority issues
- [ ] Update documentation based on feedback

**Success Criteria:**
- All P0 and P1 issues resolved
- Core workflows function correctly
- Alpha testers can complete tasks without support

### Phase 2: Internal Beta (Week 3-4)
**Participants:** 10-15 users across different roles  
**Goal:** Validate system with broader user base

**Activities:**
- [ ] Deploy to production with limited access
- [ ] Conduct training sessions (Level 1 & 2)
- [ ] Beta users transition from old system
- [ ] Monitor usage and performance
- [ ] Collect feedback via surveys
- [ ] Fix medium-priority issues
- [ ] Refine documentation and training materials

**Success Criteria:**
- Users complete core tasks independently
- Error rate < 2%
- Response times meet targets
- User satisfaction > 4/5

### Phase 3: Organization-Wide Rollout (Week 5-6)
**Participants:** All organization members  
**Goal:** Full deployment with ongoing support

**Activities:**
- [ ] Announce rollout to organization
- [ ] Conduct training for all users
- [ ] Migrate all users from old system
- [ ] Provide dedicated support channel
- [ ] Monitor usage and errors closely
- [ ] Daily status updates to stakeholders
- [ ] Address issues promptly
- [ ] Decommission old system (if applicable)

**Success Criteria:**
- 90% of users onboarded
- <1% error rate
- Positive user feedback
- Old system successfully retired

### Phase 4: Post-Rollout Support (Week 7-8)
**Goal:** Stabilize and optimize

**Activities:**
- [ ] Continue monitoring metrics
- [ ] Address remaining issues
- [ ] Collect feature requests for roadmap
- [ ] Conduct retrospective with team
- [ ] Update documentation with lessons learned
- [ ] Plan for Phase 2 features

### Communication Plan

#### Before Rollout (2 weeks prior)
```markdown
**Email to All Users:**

Subject: New GST Forecast System Coming Soon

Dear Team,

We're excited to announce that we're rolling out a new GST Forecast system 
to make curve management easier and more efficient.

**What's New:**
- Streamlined upload process
- Interactive calendar views
- Better tracking and monitoring
- Improved data validation

**Timeline:**
- [Date]: Training sessions begin
- [Date]: Beta access for volunteers
- [Date]: Full rollout to everyone

**Training:**
We'll offer multiple training sessions. Sign up here: [link]

**Questions?**
Contact: [support email]

Looking forward to your feedback!
```

#### During Rollout
- Daily Slack updates in #announcements
- Office hours for live support
- FAQ document updated in real-time
- Issue tracking board visible to all

#### After Rollout (1 week post)
```markdown
**Survey to All Users:**

We'd love your feedback on the new GST Forecast system!

1. How often have you used the new system?
2. What features do you use most?
3. What's working well?
4. What needs improvement?
5. Rate your overall experience (1-5)
6. Would you recommend any specific changes?

[Link to survey]
```

---

## Issue Management

### 1. Issue Tracking System

#### Issue Categories
```yaml
Bug:
  - Critical: System unusable
  - High: Major feature broken
  - Medium: Minor feature broken
  - Low: Cosmetic issue

Feature Request:
  - High: Frequently requested, high impact
  - Medium: Moderate impact
  - Low: Nice to have

Improvement:
  - Performance: Speed/efficiency
  - UX: User experience
  - Documentation: Docs/training

Question:
  - How-to
  - Clarification
```

#### Issue Template
```markdown
## Issue Description
Clear description of the problem

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- Browser: [e.g. Chrome 118]
- OS: [e.g. Windows 11]
- Date/Time: [when issue occurred]
- User: [email or ID]

## Severity
- [ ] Critical (P0)
- [ ] High (P1)
- [ ] Medium (P2)
- [ ] Low (P3)

## Additional Context
Any other relevant information
```

### 2. Issue Resolution SLA

```yaml
Critical (P0):
  ResponseTime: 15 minutes
  ResolutionTime: 4 hours
  Examples:
    - Site completely down
    - Data loss occurring
    - Security vulnerability

High (P1):
  ResponseTime: 2 hours
  ResolutionTime: 24 hours
  Examples:
    - Upload feature broken
    - API returning errors
    - Cannot access key pages

Medium (P2):
  ResponseTime: 8 hours
  ResolutionTime: 1 week
  Examples:
    - Minor feature not working
    - UI display issue
    - Slow performance

Low (P3):
  ResponseTime: 24 hours
  ResolutionTime: 2 weeks
  Examples:
    - Cosmetic issues
    - Feature requests
    - Documentation updates
```

### 3. Support Channels

#### Level 1: Self-Service
- **Documentation** - User manual, FAQs
- **Video Tutorials** - Step-by-step guides
- **Knowledge Base** - Searchable articles

#### Level 2: Team Support
- **Slack Channel** - #gst-forecast-support
  - Response time: Within 2 hours during business hours
  - For quick questions and minor issues

#### Level 3: Email Support
- **Email** - gst-support@company.com
  - Response time: Within 8 hours
  - For detailed issues requiring investigation

#### Level 4: Direct Engineering
- **Critical Issues Only** - Page on-call engineer
- **Schedule** - Rotating on-call schedule
- **Escalation** - Via Slack or phone for P0/P1 issues

### 4. Root Cause Analysis (RCA)

#### RCA Template for Major Incidents
```markdown
# Root Cause Analysis: [Issue Title]

## Incident Summary
- **Date:** [Date of incident]
- **Duration:** [How long was system affected]
- **Impact:** [How many users affected, what functionality]
- **Severity:** [P0/P1/P2]

## Timeline
- **[Time]** - Issue first detected
- **[Time]** - Team notified
- **[Time]** - Investigation started
- **[Time]** - Root cause identified
- **[Time]** - Fix deployed
- **[Time]** - Issue resolved
- **[Time]** - Post-mortem completed

## Root Cause
Detailed explanation of what caused the issue

## Contributing Factors
- Factor 1
- Factor 2

## Resolution
What was done to fix the issue

## Prevention Measures
**Immediate:**
- [ ] Action item 1
- [ ] Action item 2

**Short-term (1-2 weeks):**
- [ ] Action item 3
- [ ] Action item 4

**Long-term (1-3 months):**
- [ ] Action item 5
- [ ] Action item 6

## Lessons Learned
What we learned from this incident

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Item 1 | Name  | Date     | ☐      |
| Item 2 | Name  | Date     | ☐      |

## Sign-off
- **Prepared by:** [Name]
- **Reviewed by:** [Manager Name]
- **Date:** [Date]
```

---

## Appendices

### Appendix A: Quick Reference Checklist

#### Pre-Launch Checklist
```
Code Quality
[ ] No TypeScript errors
[ ] No ESLint warnings
[ ] Code review completed
[ ] All tests pass
[ ] Test coverage > 80%

Functionality
[ ] All features work as expected
[ ] Edge cases handled
[ ] Error messages clear
[ ] Loading states present
[ ] Success confirmations shown

Performance
[ ] Page load < 3 seconds
[ ] API response < 1 second
[ ] Large file upload works
[ ] Calendar renders smoothly

Security
[ ] Input validation present
[ ] No SQL injection vulnerabilities
[ ] No XSS vulnerabilities
[ ] File uploads validated
[ ] Environment variables secure

Database
[ ] Migrations tested
[ ] Backup completed
[ ] Rollback plan ready
[ ] Data integrity verified

Documentation
[ ] User manual updated
[ ] API docs current
[ ] README accurate
[ ] Training materials ready

Deployment
[ ] Staging tested
[ ] Database migrated
[ ] Environment variables set
[ ] Monitoring configured
[ ] Rollback plan ready

Post-Launch
[ ] Smoke tests passed
[ ] Monitoring active
[ ] Support channel ready
[ ] Team notified
[ ] Backup verified
```

### Appendix B: Testing Data Sets

#### Test Data for Upload Feature

**Test Set 1: Valid Hourly Data**
```csv
timestamp,P5,P25,P50,P75,P95
2025-01-01T00:00:00Z,20.5,25.3,30.1,35.8,42.1
2025-01-01T01:00:00Z,19.8,24.5,29.2,34.9,41.2
2025-01-01T02:00:00Z,18.9,23.1,27.8,33.2,39.5
```

**Test Set 2: Invalid Data (for error testing)**
```csv
# Missing required column
timestamp,P50
2025-01-01T00:00:00Z,30.1

# Invalid date format
timestamp,P50
01/01/2025,30.1

# Negative prices
timestamp,P50
2025-01-01T00:00:00Z,-10.5

# Non-monotonic quantiles
timestamp,P5,P50,P95
2025-01-01T00:00:00Z,50,30,20
```

### Appendix C: Useful SQL Queries

```sql
-- Query 1: Most active curves (by data points)
SELECT 
  cd.name,
  COUNT(pf.id) as total_data_points,
  MAX(pf.timestamp) as last_update
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON cd.id = ci."curveDefinitionId"
JOIN "PriceForecast" pf ON ci.id = pf."curveInstanceId"
GROUP BY cd.id, cd.name
ORDER BY total_data_points DESC
LIMIT 10;

-- Query 2: Upcoming delivery periods
SELECT 
  cd.name,
  ci."deliveryStart",
  ci."deliveryEnd",
  ci."createdByName"
FROM "CurveInstance" ci
JOIN "CurveDefinition" cd ON ci."curveDefinitionId" = cd.id
WHERE ci."deliveryStart" >= NOW()
  AND ci."deliveryStart" <= NOW() + INTERVAL '30 days'
ORDER BY ci."deliveryStart";

-- Query 3: Curves with missing data
SELECT 
  cd.name,
  ci."deliveryStart",
  ci."deliveryEnd",
  COUNT(pf.id) as actual_points,
  EXTRACT(EPOCH FROM (ci."deliveryEnd" - ci."deliveryStart")) / 3600 as expected_hours
FROM "CurveInstance" ci
JOIN "CurveDefinition" cd ON ci."curveDefinitionId" = cd.id
LEFT JOIN "PriceForecast" pf ON ci.id = pf."curveInstanceId"
WHERE cd.granularity = 'HOURLY'
GROUP BY cd.id, cd.name, ci.id
HAVING COUNT(pf.id) < EXTRACT(EPOCH FROM (ci."deliveryEnd" - ci."deliveryStart")) / 3600
ORDER BY cd.name;

-- Query 4: Daily statistics
SELECT 
  DATE(pf.timestamp) as date,
  COUNT(DISTINCT ci."curveDefinitionId") as unique_curves,
  COUNT(pf.id) as total_data_points,
  AVG(pf."P50") as avg_p50,
  MIN(pf."P50") as min_p50,
  MAX(pf."P50") as max_p50
FROM "PriceForecast" pf
JOIN "CurveInstance" ci ON pf."curveInstanceId" = ci.id
WHERE pf.timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(pf.timestamp)
ORDER BY date DESC;
```

### Appendix D: Contact Information

```markdown
## Support Contacts

**Primary Support**
- Email: gst-support@company.com
- Slack: #gst-forecast-support
- Hours: Monday-Friday, 8 AM - 6 PM

**On-Call Engineering**
- For P0/P1 issues only
- Page via PagerDuty
- Phone: [On-call number]

**Product Owner**
- Name: [Name]
- Email: [email]
- For: Feature requests, roadmap questions

**Database Administrator**
- Name: [Name]
- Email: [email]
- For: Database performance, schema questions

**DevOps/Infrastructure**
- Name: [Name]
- Email: [email]
- For: Deployment, hosting, monitoring
```

---

## Document Control

**Version History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 17, 2025 | [Your Name] | Initial version |

**Review Schedule:**
- Review this document quarterly
- Update after major incidents
- Update after significant feature releases

**Next Review Date:** January 17, 2026

---

**End of QA/QC Plan**


