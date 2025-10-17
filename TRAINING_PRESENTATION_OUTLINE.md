# GST Forecast Training Presentation Outlines
## Ready-to-Use Training Slide Decks

These outlines provide complete structure for your training presentations. Just add your company branding and screenshots!

---

## Level 1: Basic User Training (30 minutes)

**Audience:** All users  
**Goal:** Get users comfortable with basic operations  
**Format:** Presentation + hands-on practice

### Slide Deck Structure (20 slides)

---

**Slide 1: Title**
```
GST Forecast Training
Basic User Guide

[Your Company Logo]
```

---

**Slide 2: Agenda**
```
What We'll Cover Today:
1. What is GST Forecast? (2 min)
2. Navigating the system (3 min)
3. Uploading curves (15 min)
   - Live demo
   - Hands-on practice
4. Viewing your curves (5 min)
5. Q&A (5 min)
```

---

**Slide 3: What is GST Forecast?**
```
Purpose:
Streamlined system for managing energy curve forecasts

What you can do:
✓ Upload curve data easily
✓ Track curve schedules
✓ View data in calendar format
✓ Monitor data quality
✓ Collaborate with comments

Who uses it:
Analysts, Traders, Forecasters, Managers
```

---

**Slide 4: Accessing the System**
```
URL: https://gridstoranalytics.com/admin/upload

Your account: [Explain how users get access]

Bookmark it!
```

---

**Slide 5: System Overview**
```
Three Main Areas:

1. Upload Page (/admin/upload)
   - Create and upload curves

2. Inventory (/admin/inventory)
   - View all your curves

3. Calendar Views
   - See schedules and deadlines
```

---

**Slide 6: Upload Page - The 3-Section Flow**
```
Simple 3-Step Process:

Section 1: Define the Curve
└─> What type of curve?

Section 2: Create Instance  
└─> What time period?

Section 3: Upload Data
└─> Your forecast data

[Include screenshot of upload page]
```

---

**Slide 7: Section 1 - Define the Curve**
```
Two Options:

Option A: Select Existing Curve
- Choose from dropdown
- Use for recurring curves

Option B: Create New Curve
- First time uploading this type
- Fill in: Name, Granularity, Market Type

[Include screenshot]
```

---

**Slide 8: Understanding Granularity**
```
Three Types:

Hourly
└─> 24 data points per day
└─> Example: Power demand

Daily  
└─> 1 data point per day
└─> Example: Daily prices

Monthly
└─> 1 data point per month
└─> Example: Long-term forecasts
```

---

**Slide 9: Section 2 - Create Instance**
```
Instance = Specific time period for this curve

Required Information:
- Delivery Start Date
- Delivery End Date
- Your name/email

Example:
"Power Curve Q1 2025"
Delivery: Jan 1 - Mar 31, 2025

[Include screenshot]
```

---

**Slide 10: Section 3 - Upload Data**
```
Three Easy Steps:

1. Download template
2. Fill with your data
3. Upload completed file

The system validates everything!

[Include screenshot]
```

---

**Slide 11: Template Format**
```
CSV file with these columns:

timestamp           - When
P5, P25, P50, P75, P95  - Your forecast values

Example:
timestamp,P5,P25,P50,P75,P95
2025-01-01T00:00:00Z,20.5,25.3,30.1,35.8,42.1
2025-01-01T01:00:00Z,19.8,24.5,29.2,34.9,41.2

[Include sample screenshot]
```

---

**Slide 12: Understanding P-Values**
```
P-values = Probability Percentiles

P5:  5% chance price is below this
P25: 25% chance price is below this  
P50: Median forecast (most common)
P75: 75% chance price is below this
P95: 95% chance price is below this

You need at least one P-value (usually P50)
```

---

**Slide 13: LIVE DEMO**
```
Watch me upload a curve:

1. Create new curve definition
2. Create new instance
3. Download template
4. Upload sample data
5. Verify in inventory

[Actual demonstration]
```

---

**Slide 14: YOUR TURN - Hands-On Practice**
```
Practice Exercise (10 min):

1. Log in to system
2. Navigate to upload page
3. Create a test curve
4. Download template
5. Upload provided sample data
6. Verify it worked

Instructors available to help!
```

---

**Slide 15: Viewing Your Curves**
```
Inventory Page: /admin/inventory

What you see:
- All your curves
- Last update time
- Status indicators
- Data point counts

Actions:
- Search/filter
- View details
- Edit metadata

[Include screenshot]
```

---

**Slide 16: Calendar Views**
```
Two Calendar Options:

Basic Calendar (/curve-schedule/calendar)
└─> Simple monthly view
└─> Color-coded by importance

Advanced Calendar (/curve-tracker/calendar)
└─> Interactive FullCalendar
└─> Health score indicators
└─> Drag-and-drop updates

[Include screenshots]
```

---

**Slide 17: Common Questions**
```
Q: What if I make a mistake?
A: You can re-upload to overwrite data

Q: Can I upload partial data?
A: Yes! Fill what you have, leave blanks for rest

Q: What file format?
A: CSV only. Excel files won't work.

Q: How long does upload take?
A: Usually < 10 seconds

Q: Who can see my curves?
A: [Explain your permission model]
```

---

**Slide 18: Error Messages**
```
If upload fails, you'll see why:

Common errors:
- Wrong date format (use ISO 8601)
- Dates outside delivery period
- Non-monotonic quantiles (P5 > P50)
- Negative prices (if not allowed)

Error messages are helpful!
```

---

**Slide 19: Getting Help**
```
Support Resources:

1. Quick Start Guide
   [Link to guide]

2. Video Tutorials  
   [Link to videos]

3. Slack Support
   #gst-forecast-support

4. Email
   gst-support@company.com

5. FAQ Document
   [Link to FAQ]

We're here to help!
```

---

**Slide 20: Recap & Next Steps**
```
You Learned:
✓ How to access GST Forecast
✓ How to upload curves (3-step process)
✓ How to view your curves
✓ Where to get help

Next Steps:
1. Try uploading a real curve
2. Bookmark the system
3. Join #gst-forecast-support
4. Share feedback

Questions?

Thank you!
```

---

## Level 2: Power User Training (60 minutes)

**Audience:** Daily users, analysts  
**Goal:** Advanced features and efficiency  
**Format:** Interactive workshop

### Slide Deck Structure (30 slides)

---

**Slide 1: Title**
```
GST Forecast Power User Training
Advanced Features & Best Practices

[Your Company Logo]
```

---

**Slide 2: Agenda**
```
1. Quick Recap (5 min)
2. Advanced Upload Features (15 min)
3. Data Management (15 min)
4. Calendar Mastery (10 min)
5. Troubleshooting (10 min)
6. Tips & Tricks (5 min)
```

---

**Slide 3: Prerequisites**
```
You should already know:
✓ Basic upload workflow
✓ How to navigate the system
✓ Where to find your curves

If not, complete Level 1 training first
```

---

**Slide 4: Advanced Upload - Multiple P-Values**
```
Include full probability distribution:

timestamp,P5,P25,P50,P75,P95
2025-01-01T00:00:00Z,20.5,25.3,30.1,35.8,42.1

Tips:
- Ensure monotonic (P5 ≤ P25 ≤ P50 ≤ P75 ≤ P95)
- System validates this automatically
- Can use just P50 if that's all you have
```

---

**Slide 5: Advanced Upload - Handling Large Files**
```
Best Practices for 10,000+ row uploads:

1. Keep file size reasonable (<10 MB)
2. Validate locally before uploading
3. Remove unnecessary columns
4. Use consistent decimal precision
5. Don't keep connection open too long

Upload limit: [Your limit] MB
```

---

**Slide 6: Template Optimization**
```
Speed up your workflow:

1. Save a master template
2. Use Excel formulas for repeated patterns
3. Set up data validation in Excel
4. Copy-paste from your models
5. Use macros if you're comfortable

Show: Excel setup demo
```

---

**Slide 7: Updating Existing Data**
```
Need to update a curve?

Option 1: Re-upload entire period
- System overwrites old data
- Use same instance

Option 2: Upload partial update
- Only upload changed timestamps
- System updates those rows

Example use case: Correcting errors
```

---

**Slide 8: Versioning Strategy**
```
Managing multiple versions:

Create separate instances for:
- Different forecast dates
- Major revisions
- Alternative scenarios

Naming convention examples:
- "Power Q1 2025 - Jan 15 Forecast"
- "Power Q1 2025 - Feb 1 Update"
- "Power Q1 2025 - High Case"
```

---

**Slide 9: Bulk Operations**
```
Managing many curves efficiently:

Inventory page features:
- Filter by market type
- Search by name
- Sort by last update
- Export selected curves
- Batch actions (if available)

[Demo: Finding and exporting multiple curves]
```

---

**Slide 10: Search & Filter Techniques**
```
Power search tips:

1. Use partial names: "Power" finds all power curves
2. Combine filters: Market + Date range
3. Sort by last update to find stale data
4. Use wildcards (if supported)

Practice: Find all hourly curves updated last week
```

---

**Slide 11-15: Calendar Deep Dive**
```
[5 slides covering:]
- Calendar views comparison
- Health score indicators
- Schedule management
- Drag-and-drop updates (if available)
- Filtering and search on calendar
```

---

**Slide 16-20: Troubleshooting**
```
[5 slides covering:]
- Common error messages and fixes
- Data validation failures
- Performance issues
- Browser compatibility
- When to contact support
```

---

**Slide 21-25: Tips & Tricks**
```
[5 slides covering:]
- Keyboard shortcuts
- Excel formulas for date generation
- Data quality checks before upload
- Collaboration best practices
- Integrating with your existing workflows
```

---

**Slide 26-29: Real-World Scenarios**
```
[4 slides with case studies:]
- Scenario 1: Monthly forecast updates
- Scenario 2: Correcting historical data
- Scenario 3: Multiple analysts, one curve
- Scenario 4: Deadline-driven workflows
```

---

**Slide 30: Recap & Resources**
```
You Mastered:
✓ Advanced upload techniques
✓ Efficient data management
✓ Calendar features
✓ Troubleshooting

Resources:
- Advanced User Guide: [link]
- Video Tutorials: [link]
- Cheat Sheet: [link]

Keep practicing!
```

---

## Level 3: Administrator Training (2 hours)

**Audience:** System administrators, DevOps  
**Goal:** System management and maintenance  
**Format:** Technical workshop

### Slide Deck Structure (40 slides)

---

**Slide 1: Title**
```
GST Forecast Administrator Training
System Management & Operations

[Your Company Logo]
```

---

**Slide 2: Agenda**
```
Part 1: System Architecture (30 min)
Part 2: Database Management (30 min)
Part 3: Deployment & Monitoring (30 min)
Part 4: User Support (30 min)
```

---

**Slides 3-12: System Architecture**
```
Topics:
- Technology stack (Astro, React, Prisma, PostgreSQL)
- Application structure
- API endpoints
- Authentication & authorization
- Environment configuration
- File structure
- Dependencies
- Build process
- Hosting on Netlify
- Database hosting
```

---

**Slides 13-22: Database Management**
```
Topics:
- Schema overview
- Key tables and relationships
- Running migrations
- Backup procedures
- Restore procedures
- Data integrity checks
- Performance monitoring
- Query optimization
- Indexing strategy
- Maintenance tasks
```

---

**Slides 23-32: Deployment & Monitoring**
```
Topics:
- Deployment process
- Environment management (dev/staging/prod)
- CI/CD pipeline (if applicable)
- Monitoring setup (Netlify, Sentry)
- Error tracking
- Performance metrics
- Alert configuration
- Log analysis
- Rollback procedures
- Disaster recovery
```

---

**Slides 33-38: User Support**
```
Topics:
- Common user issues
- Debug techniques
- Support channel management
- Escalation procedures
- Creating knowledge base articles
- Training new users
```

---

**Slides 39-40: Wrap Up**
```
Resources for Admins:
- QA/QC Plan document
- Database schema documentation
- Deployment runbook
- Troubleshooting guide
- On-call procedures

Contact: [Admin team contact]
```

---

## Presentation Delivery Tips

### Before the Session
- [ ] Test all live demos beforehand
- [ ] Prepare test data and accounts
- [ ] Load system in browser tabs
- [ ] Have backup plan if demo fails
- [ ] Print handouts (optional)

### During the Session
- [ ] Start on time
- [ ] Introduce yourself and agenda
- [ ] Ask about experience levels
- [ ] Encourage questions throughout
- [ ] Monitor time on each section
- [ ] Show, don't just tell (live demos!)
- [ ] Have participants follow along
- [ ] Check for understanding

### After the Session
- [ ] Share slides with participants
- [ ] Send follow-up email with resources
- [ ] Collect feedback
- [ ] Answer remaining questions
- [ ] Update materials based on feedback

---

## Hands-On Exercises

### Exercise 1: First Upload (Basic Training)
**Time:** 10 minutes

**Setup:**
- Provide sample CSV file
- Give test account credentials

**Steps:**
1. Log in to system
2. Navigate to upload page
3. Create curve: "Training - [Your Name]"
4. Set granularity: Hourly
5. Create instance for next month
6. Upload provided CSV
7. Verify in inventory

**Success:** Curve appears in inventory with correct data

---

### Exercise 2: Error Handling (Power User Training)
**Time:** 15 minutes

**Setup:**
- Provide intentionally broken CSV files

**Steps:**
1. Try to upload CSV with wrong headers
2. Observe error message
3. Fix the error
4. Try to upload CSV with invalid dates
5. Observe error message
6. Fix the error
7. Successfully upload corrected file

**Success:** Understand error messages and how to fix them

---

### Exercise 3: Calendar Management (Power User Training)
**Time:** 15 minutes

**Steps:**
1. Navigate to calendar
2. Find curves due this month
3. Apply filters
4. Click on an event
5. View event details
6. Update schedule (if feature available)
7. Add comment to curve

**Success:** Comfortable navigating and using calendar

---

## Training Environment Setup

### Required Setup
- [ ] Test environment accessible to all trainees
- [ ] Test accounts created (one per trainee)
- [ ] Sample data loaded
- [ ] Sample CSV files prepared and distributed
- [ ] Screen sharing setup for demos
- [ ] Backup internet connection
- [ ] Contact list for technical issues

### Sample Data to Prepare
```
Curves:
- "Example Power Curve Q1"
- "Example Gas Curve Q2"
- "Example Renewable Forecast"

Instances:
- Various delivery periods
- Mix of completed and upcoming

CSV Files:
- valid_hourly_sample.csv
- valid_daily_sample.csv
- invalid_headers_sample.csv
- invalid_dates_sample.csv
```

---

## Post-Training Follow-Up

### Day After Training
**Email to participants:**
```
Subject: GST Forecast Training - Resources & Next Steps

Hi everyone,

Thank you for attending yesterday's training!

Resources:
- Training slides: [link]
- Quick Start Guide: [link]
- Video tutorials: [link]
- FAQ: [link]

Next Steps:
1. Try uploading a real curve this week
2. Join #gst-forecast-support on Slack
3. Share feedback on training: [survey link]

Need help?
Just ask in #gst-forecast-support!

Thanks,
[Your name]
```

---

### Week After Training
**Check-in survey:**
```
1. Have you used GST Forecast since training?
   ☐ Yes, multiple times
   ☐ Yes, once
   ☐ Not yet

2. Rate your confidence level (1-5): ___

3. What's still unclear?

4. What additional training would help?

5. Any features you'd like to see?
```

---

## Training Materials Checklist

### Create These
- [ ] Slide decks (PowerPoint/Google Slides)
- [ ] Quick reference card (1-page printable)
- [ ] Sample CSV files (valid and invalid)
- [ ] Hands-on exercise instructions
- [ ] Training video recordings
- [ ] FAQ document
- [ ] Troubleshooting guide

### Distribute These
- [ ] Calendar invites for training sessions
- [ ] Pre-training email with logistics
- [ ] Login credentials for test accounts
- [ ] Links to all resources
- [ ] Post-training survey
- [ ] Certificate of completion (optional)

---

## Continuous Improvement

### After Each Session
- [ ] Collect participant feedback
- [ ] Note which parts were confusing
- [ ] Update slides based on questions
- [ ] Refine timing of sections
- [ ] Add real-world examples from users
- [ ] Update screenshots if UI changed

### Quarterly Review
- [ ] Review all training materials
- [ ] Update for new features
- [ ] Re-record outdated videos
- [ ] Refresh sample data
- [ ] Compare user performance: trained vs untrained

---

**End of Training Presentation Outlines**

Use these outlines as starting points. Customize with your company branding, specific examples, and screenshots from your actual system!


