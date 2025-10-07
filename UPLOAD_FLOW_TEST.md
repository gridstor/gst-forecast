# Upload Flow Test & Verification

## ✅ Pre-Flight Checklist

### 1. Verify Routing (Production)
```bash
# Test API endpoint returns JSON (not 404)
curl https://gridstoranalytics.com/api/curves/definitions

# Should return: JSON array of curve definitions
# Should NOT return: HTML 404 page
```

### 2. Verify Local Dev
```bash
# Local dev server
curl http://localhost:4321/api/curves/definitions

# Should return: JSON array with test data
```

---

## 🧪 Complete Upload Flow Test

### Test Scenario: Upload New Revenue Curve

#### Step 1: Definition Selection ✅
**Actions:**
1. Navigate to `/admin/upload`
2. Section 1 should show "Use existing Curve Definition (select below)"
3. Search box should be visible and functional
4. List should load existing definitions

**Expected Result:**
- ✅ Definitions list populates (no console errors)
- ✅ Can search/filter definitions
- ✅ Clicking a definition populates form fields
- ✅ Form fields are grayed out (disabled)
- ✅ Toggle button switches to "Create New" mode

**Test API Call:**
```javascript
// Browser console should show:
GET /api/curves/definitions → 200 OK
Response: [{ id: 12, curveName: "...", market: "CAISO", ... }]
```

#### Step 2: Instance Selection ✅
**Actions:**
1. After selecting a definition, instances list should load
2. Section 2 shows "Use existing Curve Instance"
3. Can toggle to "Create New"

**Expected Result:**
- ✅ Instances load for selected definition
- ✅ Can select existing instance
- ✅ Can switch to create new mode
- ✅ Form fields populate when instance selected

**Test API Call:**
```javascript
GET /api/curves/instances?definitionId=12 → 200 OK
Response: { instances: [{ id: 5, instanceVersion: "v1.0", ... }] }
```

#### Step 3: CSV Upload ✅
**Actions:**
1. Click "Download CSV Template"
2. Select date range and granularity
3. Generate template
4. Fill in values
5. Upload CSV file

**Expected Result:**
- ✅ Template modal opens
- ✅ Template generates with correct timestamps
- ✅ CSV preview shows after file selection
- ✅ Submit button enables
- ✅ Upload succeeds with confirmation

**Test API Call:**
```javascript
POST /api/curve-upload/upload-data
Body: { curveInstanceId: 5, priceData: [...] }
Response: { success: true, recordsCreated: 120 }
```

---

## 🔍 Console Tests

### Test 1: Page Load
```javascript
// Open browser console (F12)
// Navigate to /admin/upload
// Should see:

✅ Page loads without errors
✅ No 404 errors for API calls
✅ "Loaded definitions: Array(X)" in console
✅ Definition list renders
```

### Test 2: Definition Selection
```javascript
// Click on a definition
// Should see:

✅ "selectDefinition called with: { id: X, ... }"
✅ "Loading instances for definition: X"
✅ GET /api/curves/instances?definitionId=X → 200
✅ Instances list updates
```

### Test 3: CSV Upload
```javascript
// Select CSV file
// Should see:

✅ CSV parsed successfully
✅ Preview table renders
✅ "X rows loaded" message
✅ Submit button enabled
```

### Test 4: Final Upload
```javascript
// Click "Upload Complete Curve"
// Should see:

✅ "Creating curve..." (if new definition)
✅ "Creating instance..." (if new instance)
✅ "Uploading data..."
✅ POST /api/curve-upload/create-definition → 200 (if new)
✅ POST /api/curve-upload/create-instance → 200 (if new)
✅ POST /api/curve-upload/upload-data → 200
✅ Success message displays
```

---

## 🐛 Common Issues & Fixes

### Issue 1: 404 on /api/curves/definitions
**Symptom:**
```
GET /api/curves/definitions 404 (Not Found)
Error: Unexpected token '<', "<!doctype "... is not valid JSON
```

**Cause:** API routing not configured in netlify.toml

**Fix:** Add to netlify.toml (already done):
```toml
[[redirects]]
  from = "/api/curves*"
  to = "https://gridstor.netlify.app/api/curves:splat"
  status = 200
  force = true
```

### Issue 2: Empty Definitions List
**Symptom:**
```
Loaded definitions: []
"No definitions found"
```

**Cause:** Database is empty or connection issue

**Fix:**
1. Check Prisma connection
2. Run: `npx prisma studio` to view database
3. Create test definition via API or Prisma Studio
4. Verify `isActive = true` on definitions

### Issue 3: CSV Upload Fails
**Symptom:**
```
POST /api/curve-upload/upload-data 400
"Validation errors in price data"
```

**Cause:** CSV format incorrect or timestamps invalid

**Fix:**
1. Verify CSV format: `timestamp,value,pvalue,units`
2. Use ISO 8601 timestamps: `2024-01-01T00:00:00Z`
3. Ensure timestamps within delivery period
4. Verify P50 values exist

### Issue 4: Template Not Downloading
**Symptom:** Click "Download Template" - nothing happens

**Cause:** Modal JavaScript not binding

**Fix:**
1. Check console for errors
2. Verify modal event listeners attached
3. Ensure dates/granularity selected

---

## 📊 Database Verification

### Check Definitions Exist
```sql
-- Via Prisma Studio or direct query
SELECT id, "curveName", market, location, "isActive"
FROM "Forecasts"."CurveDefinition"
WHERE "isActive" = true
ORDER BY "createdAt" DESC;
```

### Check Instances Exist
```sql
SELECT i.id, i."instanceVersion", d."curveName", i.status
FROM "Forecasts"."CurveInstance" i
JOIN "Forecasts"."CurveDefinition" d ON i."curveDefinitionId" = d.id
ORDER BY i."createdAt" DESC;
```

### Check Uploaded Data
```sql
SELECT COUNT(*) as data_points, MIN(timestamp), MAX(timestamp)
FROM "Forecasts"."CurveData"
WHERE "curveInstanceId" = 5;
```

---

## 🎯 Test Data Creation

### Create Test Definition (via Prisma Studio or API)
```json
POST /api/curve-upload/create-definition
{
  "curveName": "Test_CAISO_NP15_Revenue_4H_P50",
  "market": "CAISO",
  "location": "NP15",
  "product": "Optimized Revenue",
  "curveType": "REVENUE",
  "batteryDuration": "FOUR_H",
  "granularity": "MONTHLY",
  "units": "$/MWh"
}
```

### Create Test Instance
```json
POST /api/curve-upload/create-instance
{
  "curveDefinitionId": 12,
  "instanceVersion": "test_v1.0",
  "deliveryPeriodStart": "2025-01-01",
  "deliveryPeriodEnd": "2025-12-31",
  "createdBy": "Test User",
  "modelType": "Manual",
  "notes": "Test upload"
}
```

### Create Test CSV
```csv
timestamp,value,pvalue,units
2025-01-01T00:00:00Z,45.50,50,$/MWh
2025-02-01T00:00:00Z,47.30,50,$/MWh
2025-03-01T00:00:00Z,48.90,50,$/MWh
2025-04-01T00:00:00Z,46.20,50,$/MWh
2025-05-01T00:00:00Z,44.10,50,$/MWh
```

---

## ✅ Success Criteria

### Page Load Success ✅
- [ ] Admin upload page loads without errors
- [ ] Definitions list populates
- [ ] No 404 errors in console
- [ ] No CORS errors
- [ ] UI renders correctly

### Selection Success ✅
- [ ] Can select existing definition
- [ ] Form fields auto-populate
- [ ] Can toggle to create new mode
- [ ] Instances load after definition selected
- [ ] Can select existing instance

### Upload Success ✅
- [ ] Template generator works
- [ ] CSV file accepts upload
- [ ] Preview displays correctly
- [ ] Upload completes without errors
- [ ] Success message displays
- [ ] Data appears in database

---

## 🚀 Quick Test Script

Run this in browser console on `/admin/upload`:

```javascript
// Test 1: Check definitions loaded
console.log('Definitions loaded:', window.selectedDefinition);

// Test 2: Manually trigger API call
fetch('/api/curves/definitions')
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
  .catch(e => console.error('API Error:', e));

// Test 3: Check form elements exist
console.log({
  definitionForm: !!document.getElementById('newCurveSection'),
  instanceForm: !!document.getElementById('instance-section'),
  uploadSection: !!document.getElementById('upload-section'),
  submitBtn: !!document.getElementById('upload-final')
});

// Test 4: Check event listeners
console.log('Upload final button:', document.getElementById('upload-final'));
```

---

## 📈 Performance Checks

### API Response Times
- `/api/curves/definitions` → < 500ms ✅
- `/api/curves/instances` → < 300ms ✅
- `/api/curve-upload/upload-data` → < 2s (depends on data size) ✅

### Page Load Metrics
- First Contentful Paint → < 1s ✅
- Time to Interactive → < 2s ✅
- Definitions list rendered → < 1.5s ✅

---

## 🎉 Final Verification

### Production Test
1. ✅ Navigate to `https://gridstoranalytics.com/admin/upload`
2. ✅ Open browser console (F12)
3. ✅ Verify no errors
4. ✅ Definitions load successfully
5. ✅ Select definition → instances load
6. ✅ Upload CSV → success message

### If All Tests Pass ✅
**Your upload page is fully functional!**

You can now:
- Create new curve definitions
- Create curve instances
- Upload price data with multiple P-values
- Download templates for easy data entry
- Select and edit existing curves

**Ready to upload curves!** 🚀

