# GST Forecast Testing Script
## Manual Testing Guide for QA Team

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## How to Use This Document

This document provides step-by-step testing scripts for all critical workflows in the GST Forecast application. Each test case includes:
- **Prerequisites:** What you need before starting
- **Steps:** Detailed steps to execute
- **Expected Results:** What should happen
- **Actual Results:** Space to record what actually happened
- **Pass/Fail:** Check off the result

**Testing Tips:**
- Test in order (basic functionality before advanced features)
- Record screenshots for any failures
- Note the exact time of any errors for log review
- Test on multiple browsers if possible
- Clear browser cache between major test suites

---

## Pre-Testing Setup

### Environment Access
- [ ] Staging URL: _______________ [Verified accessible]
- [ ] Production URL: _______________ [Verified accessible]
- [ ] Test account credentials received
- [ ] Browser(s) ready: ☐ Chrome ☐ Edge ☐ Firefox ☐ Safari

### Test Data Preparation
- [ ] Downloaded sample valid CSV files
- [ ] Downloaded sample invalid CSV files
- [ ] Have test user information ready

---

## Test Suite 1: Basic Navigation & UI

### Test Case 1.1: Homepage/Admin Dashboard Access
**Objective:** Verify basic site access and navigation

**Prerequisites:** None

**Steps:**
1. Open browser
2. Navigate to https://gridstoranalytics.com/admin/upload
3. Observe page load time
4. Check for any console errors (F12 → Console)

**Expected Results:**
- ✅ Page loads within 3 seconds
- ✅ No JavaScript errors in console
- ✅ Page displays correctly (no broken layout)
- ✅ GST logo visible
- ✅ Navigation menu visible

**Actual Results:**
- Load time: ___ seconds
- Errors: _______________
- Screenshot: [attach if issues]

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 1.2: Navigation Between Pages
**Objective:** Verify all navigation links work

**Steps:**
1. From upload page, click "Inventory" (if nav exists)
2. Navigate to /admin/inventory
3. Navigate to /curve-tracker/calendar
4. Navigate to /curve-schedule/calendar
5. Navigate back to /admin/upload

**Expected Results:**
- ✅ All pages load without errors
- ✅ Navigation is consistent across pages
- ✅ No 404 errors

**Actual Results:**
- Pages tested: _______________
- Issues: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 1.3: Responsive Design
**Objective:** Verify UI works on different screen sizes

**Steps:**
1. Start with browser at 1920x1080
2. Test upload page
3. Resize to 1366x768
4. Test upload page again
5. Resize to tablet (768x1024)
6. Test basic functionality

**Expected Results:**
- ✅ Layout adapts to screen size
- ✅ No horizontal scrolling required
- ✅ All buttons remain clickable
- ✅ Text remains readable

**Actual Results:**
- 1920x1080: ☐ Pass  ☐ Fail
- 1366x768: ☐ Pass  ☐ Fail
- Tablet: ☐ Pass  ☐ Fail

**Result:** ☐ Pass  ☐ Fail

---

## Test Suite 2: Curve Upload - Happy Path

### Test Case 2.1: Create New Curve Definition
**Objective:** Successfully create a new curve definition

**Prerequisites:** Access to /admin/upload

**Steps:**
1. Navigate to /admin/upload
2. In Section 1, select "Create new curve"
3. Fill in the form:
   - **Name:** "QA Test Curve - Power Q1 2025"
   - **Granularity:** Select "Hourly"
   - **Market Type:** "POWER"
   - **Description:** "Test curve for QA validation"
4. Click "Create Curve" button
5. Wait for response

**Expected Results:**
- ✅ Form accepts all inputs
- ✅ Success message appears (green/check icon)
- ✅ Message shows "Curve created successfully" or similar
- ✅ New curve appears in definition dropdown
- ✅ Response time < 2 seconds

**Actual Results:**
- Success message: _______________
- Response time: ___ seconds
- Curve ID (if shown): ___
- Screenshot: [attach]

**Result:** ☐ Pass  ☐ Fail

**Notes:** _______________

---

### Test Case 2.2: Create New Curve Instance
**Objective:** Successfully create a curve instance

**Prerequisites:** 
- Test Case 2.1 completed successfully
- Have a curve definition ID

**Steps:**
1. In Section 2, select "Create new instance"
2. Select the curve definition created in Test Case 2.1
3. Fill in the form:
   - **Delivery Start:** "2025-01-01"
   - **Delivery End:** "2025-03-31"
   - **Created By (Email):** "qa-test@company.com"
   - **Created By (Name):** "QA Tester"
4. Click "Create Instance" button
5. Wait for response

**Expected Results:**
- ✅ Form accepts date inputs
- ✅ Delivery end must be after delivery start (validation)
- ✅ Success message appears
- ✅ Message shows "Instance created successfully" or similar
- ✅ Instance appears in dropdown
- ✅ Response time < 2 seconds

**Actual Results:**
- Success message: _______________
- Response time: ___ seconds
- Instance ID (if shown): ___
- Date range displayed: _______________

**Result:** ☐ Pass  ☐ Fail

**Notes:** _______________

---

### Test Case 2.3: Download Template
**Objective:** Verify template generator works correctly

**Prerequisites:**
- Test Case 2.1 and 2.2 completed
- Have curve definition and instance selected

**Steps:**
1. In Section 3, ensure definition and instance are selected
2. Verify delivery period is displayed
3. Click "Download Template" button
4. Check browser downloads folder
5. Open downloaded CSV file

**Expected Results:**
- ✅ File downloads immediately
- ✅ Filename format: "curve_template_YYYYMMDD_HHMMSS.csv"
- ✅ File contains headers: timestamp, P5, P25, P50, P75, P95
- ✅ File contains rows for entire delivery period
- ✅ Hourly granularity = 2,160 rows (90 days × 24 hours)
- ✅ Timestamps are in ISO 8601 format
- ✅ Timestamps start at delivery start date
- ✅ P-value columns are empty (ready to fill)

**Actual Results:**
- File downloaded: ☐ Yes  ☐ No
- Filename: _______________
- Row count: ___
- First timestamp: _______________
- Last timestamp: _______________
- Headers correct: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail

**Notes:** _______________

---

### Test Case 2.4: Fill Template with Valid Data
**Objective:** Prepare a valid CSV file for upload

**Prerequisites:**
- Template downloaded from Test Case 2.3

**Steps:**
1. Open template CSV in Excel or text editor
2. Fill in sample data:
   - First 10 rows with P50 values: 25.5, 26.0, 24.8, 23.2, 22.1, 21.5, 22.8, 25.0, 27.3, 28.5
   - Optional: Fill P25 and P75 for first 10 rows
   - Leave remaining rows empty OR fill all rows
3. Save file as "qa_test_upload.csv"
4. Verify CSV format is correct (no extra quotes, proper commas)

**Expected Results:**
- ✅ File saved as CSV format
- ✅ No formatting issues
- ✅ Decimal numbers use period (not comma)

**Actual Results:**
- File created: ☐ Yes  ☐ No
- Format verified: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 2.5: Upload Valid CSV File
**Objective:** Successfully upload curve data

**Prerequisites:**
- Test Cases 2.1, 2.2, 2.4 completed
- Have qa_test_upload.csv ready

**Steps:**
1. In Section 3 of upload page
2. Ensure correct definition and instance are selected
3. Click "Choose File" or drag-and-drop area
4. Select qa_test_upload.csv
5. Wait for file to be processed
6. Observe preview table (if shown)
7. Click "Upload Data" button
8. Wait for upload to complete

**Expected Results:**
- ✅ File is accepted (no format errors)
- ✅ Preview shows correct data
- ✅ Preview shows correct number of rows
- ✅ No validation errors
- ✅ Upload completes successfully
- ✅ Success message appears
- ✅ Message shows number of rows uploaded
- ✅ Upload time < 10 seconds for 1000 rows

**Actual Results:**
- File accepted: ☐ Yes  ☐ No
- Preview appeared: ☐ Yes  ☐ No
- Rows in preview: ___
- Upload time: ___ seconds
- Success message: _______________
- Rows uploaded: ___

**Result:** ☐ Pass  ☐ Fail

**Notes:** _______________

---

### Test Case 2.6: Verify Upload in Inventory
**Objective:** Confirm uploaded data is stored correctly

**Prerequisites:**
- Test Case 2.5 completed successfully

**Steps:**
1. Navigate to /admin/inventory (or equivalent)
2. Search or filter for "QA Test Curve - Power Q1 2025"
3. Click on the curve to view details
4. Verify instance shows delivery period 2025-01-01 to 2025-03-31
5. Verify data point count
6. Verify created by information

**Expected Results:**
- ✅ Curve appears in inventory
- ✅ Correct name displayed
- ✅ Correct delivery period
- ✅ Data point count matches upload
- ✅ Created by shows qa-test@company.com
- ✅ Timestamp shows recent upload time

**Actual Results:**
- Curve found: ☐ Yes  ☐ No
- Data points: ___
- All info correct: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail

---

## Test Suite 3: Curve Upload - Error Handling

### Test Case 3.1: Invalid File Format
**Objective:** Verify system rejects non-CSV files

**Steps:**
1. Navigate to /admin/upload
2. Ensure definition and instance are selected
3. Try to upload a .txt file
4. Try to upload a .xlsx file
5. Try to upload a .pdf file

**Expected Results:**
- ✅ System rejects non-CSV files
- ✅ Clear error message appears
- ✅ Error message explains file must be CSV
- ✅ No system crash or error

**Actual Results:**
- .txt rejected: ☐ Yes  ☐ No
- .xlsx rejected: ☐ Yes  ☐ No
- .pdf rejected: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 3.2: Invalid CSV - Wrong Headers
**Objective:** Verify system validates CSV headers

**Test Data:** Create CSV with headers: date,price,volume

**Steps:**
1. Create a CSV file with incorrect headers
2. Try to upload this file
3. Observe error message

**Expected Results:**
- ✅ Upload rejected
- ✅ Error message mentions missing required columns
- ✅ Error specifies which columns are required

**Actual Results:**
- Upload rejected: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 3.3: Invalid CSV - Wrong Date Format
**Objective:** Verify system validates timestamp format

**Test Data:** 
```csv
timestamp,P50
01/01/2025,25.5
01/02/2025,26.0
```

**Steps:**
1. Create CSV with dates in MM/DD/YYYY format (not ISO 8601)
2. Try to upload
3. Observe error message

**Expected Results:**
- ✅ Upload rejected
- ✅ Error mentions invalid date format
- ✅ Error suggests correct format (ISO 8601)

**Actual Results:**
- Upload rejected: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 3.4: Invalid CSV - Negative Prices
**Objective:** Verify system validates price values

**Test Data:**
```csv
timestamp,P50
2025-01-01T00:00:00Z,-10.5
2025-01-01T01:00:00Z,-5.2
```

**Steps:**
1. Create CSV with negative prices
2. Try to upload
3. Observe error message

**Expected Results:**
- ✅ Upload rejected OR warning shown
- ✅ Error indicates negative values found
- ✅ Error shows which rows have issues

**Actual Results:**
- Upload rejected: ☐ Yes  ☐ No
- Warning shown: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

**Notes:** (Negative prices might be valid for some markets - verify business rules)

---

### Test Case 3.5: Invalid CSV - Non-Monotonic Quantiles
**Objective:** Verify system validates quantile relationships

**Test Data:**
```csv
timestamp,P5,P25,P50,P75,P95
2025-01-01T00:00:00Z,50,40,30,20,10
```
(P5 should be <= P25 <= P50 <= P75 <= P95)

**Steps:**
1. Create CSV with non-monotonic quantiles
2. Try to upload
3. Observe error message

**Expected Results:**
- ✅ Upload rejected
- ✅ Error mentions quantile order violation
- ✅ Error shows which row(s) have issues

**Actual Results:**
- Upload rejected: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 3.6: Invalid CSV - Dates Outside Delivery Period
**Objective:** Verify system validates dates are within delivery period

**Prerequisites:**
- Instance with delivery period 2025-01-01 to 2025-03-31

**Test Data:**
```csv
timestamp,P50
2024-12-31T23:00:00Z,25.5
2025-04-01T00:00:00Z,26.0
```

**Steps:**
1. Create CSV with dates outside delivery period
2. Try to upload
3. Observe error message

**Expected Results:**
- ✅ Upload rejected
- ✅ Error mentions dates outside delivery period
- ✅ Error shows delivery period range
- ✅ Error indicates which rows are out of range

**Actual Results:**
- Upload rejected: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 3.7: Invalid CSV - Missing Required Values
**Objective:** Verify at least one P-value is required

**Test Data:**
```csv
timestamp,P5,P25,P50,P75,P95
2025-01-01T00:00:00Z,,,,
```

**Steps:**
1. Create CSV with timestamps but no P-values
2. Try to upload
3. Observe error message

**Expected Results:**
- ✅ Upload rejected
- ✅ Error mentions missing P-values
- ✅ Error explains at least one P-value required per row

**Actual Results:**
- Upload rejected: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 3.8: Very Large File
**Objective:** Test system handles large uploads

**Test Data:** Create CSV with 10,000+ rows

**Steps:**
1. Create or use a large CSV file (10,000 rows)
2. Try to upload
3. Monitor upload progress
4. Note upload time

**Expected Results:**
- ✅ File is accepted
- ✅ Upload completes (no timeout)
- ✅ Progress indicator shown (if implemented)
- ✅ Upload time reasonable (< 60 seconds)
- ✅ Success message appears
- ✅ Correct row count reported

**Actual Results:**
- File size: ___ MB
- Row count: ___
- Upload time: ___ seconds
- Upload successful: ☐ Yes  ☐ No
- Issues: _______________

**Result:** ☐ Pass  ☐ Fail

---

## Test Suite 4: Curve Inventory Management

### Test Case 4.1: View Curve Inventory
**Objective:** View all curves in inventory

**Steps:**
1. Navigate to /admin/inventory
2. Observe page load
3. Check if curves are listed
4. Verify curve information displayed

**Expected Results:**
- ✅ Page loads within 3 seconds
- ✅ Curves displayed in table or grid
- ✅ Shows curve name, market type, last update, etc.
- ✅ Pagination or scroll works if many curves

**Actual Results:**
- Load time: ___ seconds
- Curves displayed: ___ count
- Layout: ☐ Table  ☐ Grid  ☐ Other: ___

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 4.2: Search/Filter Curves
**Objective:** Find specific curves using search/filter

**Prerequisites:** Multiple curves exist in inventory

**Steps:**
1. Locate search/filter UI
2. Search for "QA Test Curve"
3. Apply filter for "POWER" market type (if available)
4. Apply filter for "HOURLY" granularity (if available)
5. Clear filters

**Expected Results:**
- ✅ Search returns matching results
- ✅ Filters work correctly
- ✅ Results update in real-time or on button click
- ✅ Clear filters restores full list

**Actual Results:**
- Search works: ☐ Yes  ☐ No
- Filters work: ☐ Yes  ☐ No
- Results: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 4.3: View Curve Details
**Objective:** View detailed information for a specific curve

**Steps:**
1. From inventory, click on a curve name
2. Observe detail page/modal
3. Check what information is shown

**Expected Results:**
- ✅ Detail view opens
- ✅ Shows curve definition details
- ✅ Shows all instances
- ✅ Shows data point counts
- ✅ Shows creation/update history (if available)

**Actual Results:**
- Detail view opened: ☐ Yes  ☐ No
- Information displayed: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 4.4: Edit Curve Definition (if available)
**Objective:** Modify curve definition metadata

**Steps:**
1. From curve details, click "Edit" button
2. Modify description field
3. Save changes
4. Verify changes persisted

**Expected Results:**
- ✅ Edit form opens
- ✅ Current values pre-filled
- ✅ Can modify allowed fields
- ✅ Cannot modify protected fields (like granularity if data exists)
- ✅ Changes save successfully

**Actual Results:**
- Edit available: ☐ Yes  ☐ No
- Changes saved: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail  ☐ N/A

---

## Test Suite 5: Calendar Views

### Test Case 5.1: View Curve Schedule Calendar
**Objective:** View curves on calendar

**Steps:**
1. Navigate to /curve-schedule/calendar
2. Observe calendar display
3. Check for curves/events on calendar
4. Try changing month (if available)

**Expected Results:**
- ✅ Calendar loads within 3 seconds
- ✅ Events/curves displayed on calendar
- ✅ Can navigate between months
- ✅ Events are clickable

**Actual Results:**
- Load time: ___ seconds
- Events displayed: ☐ Yes  ☐ No
- Navigation works: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 5.2: View Curve Tracker Calendar
**Objective:** View advanced calendar with health scores

**Steps:**
1. Navigate to /curve-tracker/calendar
2. Observe FullCalendar display
3. Check for health score indicators (colors)
4. Click on an event
5. Check event details

**Expected Results:**
- ✅ Calendar loads with FullCalendar UI
- ✅ Events colored by health score (red/yellow/green)
- ✅ Clicking event shows details
- ✅ Can switch between month/week/day view

**Actual Results:**
- Calendar loaded: ☐ Yes  ☐ No
- Color coding works: ☐ Yes  ☐ No
- Event details shown: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 5.3: Filter Calendar by Importance
**Objective:** Filter calendar events

**Steps:**
1. On calendar page, locate filter options
2. Apply importance filter (High/Medium/Low)
3. Verify only matching events shown
4. Clear filter

**Expected Results:**
- ✅ Filter UI is clear
- ✅ Filtering works correctly
- ✅ Event count updates
- ✅ Clear filter restores all events

**Actual Results:**
- Filter available: ☐ Yes  ☐ No
- Filter works: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail  ☐ N/A

---

## Test Suite 6: Performance Testing

### Test Case 6.1: Page Load Times
**Objective:** Verify acceptable page load performance

**Steps:**
1. Clear browser cache
2. Open DevTools (F12) → Network tab
3. Load each major page
4. Note "Load" time from Network tab

**Expected Results:**
- ✅ All pages load < 3 seconds on good connection
- ✅ No large unnecessary assets

**Actual Results:**
| Page | Load Time | Pass/Fail |
|------|-----------|-----------|
| /admin/upload | ___ s | ☐ Pass ☐ Fail |
| /admin/inventory | ___ s | ☐ Pass ☐ Fail |
| /curve-tracker/calendar | ___ s | ☐ Pass ☐ Fail |
| /curve-schedule/calendar | ___ s | ☐ Pass ☐ Fail |

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 6.2: API Response Times
**Objective:** Verify API endpoints respond quickly

**Steps:**
1. Open DevTools (F12) → Network tab
2. Trigger API calls (load curves, upload data)
3. Note API response times

**Expected Results:**
- ✅ GET requests < 1 second
- ✅ POST requests < 2 seconds

**Actual Results:**
| Endpoint | Response Time | Pass/Fail |
|----------|---------------|-----------|
| GET /api/curves/definitions | ___ ms | ☐ Pass ☐ Fail |
| GET /api/curves/instances | ___ ms | ☐ Pass ☐ Fail |
| POST /api/curve-upload/upload-data | ___ ms | ☐ Pass ☐ Fail |

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 6.3: Concurrent Users
**Objective:** Test system with multiple users

**Prerequisites:** Need 3-5 people

**Steps:**
1. Have 3-5 people access system simultaneously
2. Each person performs different tasks
3. Monitor for slowdowns or errors
4. Note any issues

**Expected Results:**
- ✅ System remains responsive
- ✅ No errors occur
- ✅ Each user can complete tasks

**Actual Results:**
- Users tested: ___
- Issues encountered: _______________

**Result:** ☐ Pass  ☐ Fail

---

## Test Suite 7: Browser Compatibility

### Test Case 7.1: Chrome
**Browser Version:** _______________

**Steps:** Run critical test cases 2.1-2.6 in Chrome

**Result:** ☐ Pass  ☐ Fail  
**Issues:** _______________

---

### Test Case 7.2: Edge
**Browser Version:** _______________

**Steps:** Run critical test cases 2.1-2.6 in Edge

**Result:** ☐ Pass  ☐ Fail  
**Issues:** _______________

---

### Test Case 7.3: Firefox
**Browser Version:** _______________

**Steps:** Run critical test cases 2.1-2.6 in Firefox

**Result:** ☐ Pass  ☐ Fail  
**Issues:** _______________

---

### Test Case 7.4: Safari (if Mac users in org)
**Browser Version:** _______________

**Steps:** Run critical test cases 2.1-2.6 in Safari

**Result:** ☐ Pass  ☐ Fail  ☐ N/A  
**Issues:** _______________

---

## Test Suite 8: Data Validation (Advanced)

### Test Case 8.1: Database Data Integrity
**Objective:** Verify uploaded data is stored correctly

**Prerequisites:** Database access, Test Case 2.5 completed

**Steps:**
1. Connect to database
2. Run query to find uploaded data:
```sql
SELECT * FROM "PriceForecast" 
WHERE "curveInstanceId" = [your_test_instance_id]
ORDER BY timestamp
LIMIT 10;
```
3. Verify data matches CSV file uploaded
4. Check data types are correct

**Expected Results:**
- ✅ All uploaded rows present in database
- ✅ Values match CSV exactly
- ✅ Timestamps stored correctly (with timezone)
- ✅ P-values stored as numeric types

**Actual Results:**
- Rows in DB: ___
- Data matches: ☐ Yes  ☐ No
- Issues: _______________

**Result:** ☐ Pass  ☐ Fail

---

## Test Suite 9: Security Testing (Basic)

### Test Case 9.1: SQL Injection Attempt
**Objective:** Verify system is protected against SQL injection

**Steps:**
1. In curve name field, enter: `Test'; DROP TABLE "PriceForecast"; --`
2. Try to create curve
3. Verify system handles it safely

**Expected Results:**
- ✅ Input is sanitized or rejected
- ✅ No SQL error shown to user
- ✅ No database damage

**Actual Results:**
- Input handled: ☐ Safely  ☐ Unsafely
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 9.2: XSS Attempt
**Objective:** Verify system is protected against XSS

**Steps:**
1. In description field, enter: `<script>alert('XSS')</script>`
2. Save curve
3. View curve details
4. Check if script executes

**Expected Results:**
- ✅ Script does not execute
- ✅ Input is escaped or sanitized
- ✅ Text displays as plain text

**Actual Results:**
- Script executed: ☐ Yes  ☐ No
- Input escaped: ☐ Yes  ☐ No

**Result:** ☐ Pass  ☐ Fail

---

### Test Case 9.3: File Upload Size Limit
**Objective:** Verify file size limits are enforced

**Steps:**
1. Create a very large CSV file (>100 MB)
2. Try to upload
3. Observe system behavior

**Expected Results:**
- ✅ Upload rejected if over limit
- ✅ Clear error message about size limit
- ✅ System doesn't hang or crash

**Actual Results:**
- File size: ___ MB
- Upload rejected: ☐ Yes  ☐ No
- Error message: _______________

**Result:** ☐ Pass  ☐ Fail

---

## Test Summary Report

**Tester Name:** _______________  
**Test Date:** _______________  
**Environment:** ☐ Staging  ☐ Production  
**Browser(s):** _______________

### Overall Results

| Test Suite | Total Tests | Passed | Failed | Skipped |
|------------|-------------|--------|--------|---------|
| Suite 1: Navigation & UI | ___ | ___ | ___ | ___ |
| Suite 2: Upload - Happy Path | 6 | ___ | ___ | ___ |
| Suite 3: Upload - Error Handling | 8 | ___ | ___ | ___ |
| Suite 4: Inventory Management | 4 | ___ | ___ | ___ |
| Suite 5: Calendar Views | 3 | ___ | ___ | ___ |
| Suite 6: Performance | 3 | ___ | ___ | ___ |
| Suite 7: Browser Compatibility | 4 | ___ | ___ | ___ |
| Suite 8: Data Validation | 1 | ___ | ___ | ___ |
| Suite 9: Security | 3 | ___ | ___ | ___ |
| **TOTAL** | **___** | **___** | **___** | **___** |

### Pass Rate: ____%

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### High Priority Issues Found
1. _______________________________________________
2. _______________________________________________

### Recommendations
- _______________________________________________
- _______________________________________________
- _______________________________________________

### Sign-off
**Tested By:** _______________ [Signature]  
**Date:** _______________  

**Approved By:** _______________ [Signature]  
**Date:** _______________

---

## Appendix: Sample Test Data Files

### Valid Hourly CSV (small sample)
Save as: `test_valid_hourly.csv`
```csv
timestamp,P5,P25,P50,P75,P95
2025-01-01T00:00:00Z,20.5,25.3,30.1,35.8,42.1
2025-01-01T01:00:00Z,19.8,24.5,29.2,34.9,41.2
2025-01-01T02:00:00Z,18.9,23.1,27.8,33.2,39.5
2025-01-01T03:00:00Z,18.2,22.3,26.9,32.1,38.2
2025-01-01T04:00:00Z,17.8,21.9,26.3,31.5,37.5
```

### Valid Daily CSV
Save as: `test_valid_daily.csv`
```csv
timestamp,P50
2025-01-01T00:00:00Z,30.5
2025-01-02T00:00:00Z,31.2
2025-01-03T00:00:00Z,29.8
2025-01-04T00:00:00Z,28.5
2025-01-05T00:00:00Z,27.9
```

### Invalid CSV - Wrong Headers
Save as: `test_invalid_headers.csv`
```csv
date,price,volume
2025-01-01,30.5,100
2025-01-02,31.2,105
```

### Invalid CSV - Wrong Date Format
Save as: `test_invalid_dates.csv`
```csv
timestamp,P50
01/01/2025,30.5
01/02/2025,31.2
```

### Invalid CSV - Negative Prices
Save as: `test_invalid_negative.csv`
```csv
timestamp,P50
2025-01-01T00:00:00Z,-10.5
2025-01-01T01:00:00Z,-5.2
```

---

**End of Testing Script**


