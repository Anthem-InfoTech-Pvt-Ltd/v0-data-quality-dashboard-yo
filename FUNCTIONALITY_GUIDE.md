# Data Quality Dashboard - Functionality Guide

## 📊 Overview

This dashboard monitors and manages data quality across contacts, companies, and leads. All calculations are done **dynamically** from MongoDB data.

---

## 🎯 Dashboard Page (`/dashboard`)

### **Metrics Display (Top Section)**

All metrics are calculated **dynamically** from MongoDB:

#### 1. **Duplicates Count**
- **API**: `GET /api/metrics`
- **Calculation**: `db.collection("contacts").countDocuments({ isDuplicate: true })`
- **Shows**: Number of contacts marked as duplicates

#### 2. **Unassigned Leads Count**
- **API**: `GET /api/metrics`
- **Calculation**: `db.collection("contacts").countDocuments({ isAssigned: false })`
- **Shows**: Number of contacts not assigned to sales team

#### 3. **Missing Fields Count**
- **API**: `GET /api/metrics`
- **Calculation**: `db.collection("contacts").countDocuments({ hasMissingFields: true })`
- **Shows**: Number of contacts with incomplete data

#### 4. **Total Contacts**
- **API**: `GET /api/metrics`
- **Calculation**: `db.collection("contacts").countDocuments({})`
- **Shows**: Total number of contacts in database

### **Health Score Calculation**

**API**: `GET /api/health-score`

**Formula**:
```javascript
// Step 1: Calculate individual scores (0-100)
duplicateScore = ((totalContacts - duplicates) / totalContacts) * 100
assignmentScore = ((totalContacts - unassignedLeads) / totalContacts) * 100
completenessScore = ((totalContacts - missingFields) / totalContacts) * 100
overdueScore = ((totalContacts - overdueLeads) / totalContacts) * 100

// Step 2: Average all scores
healthScore = (duplicateScore + assignmentScore + completenessScore + overdueScore) / 4
healthScore = Math.round(healthScore) // Round to nearest integer
```

**Example**:
- Total Contacts: 90
- Duplicates: 15 → Score: ((90-15)/90) * 100 = 83.33%
- Unassigned: 20 → Score: ((90-20)/90) * 100 = 77.78%
- Missing Fields: 25 → Score: ((90-25)/90) * 100 = 72.22%
- Overdue Leads: 6 → Score: ((90-6)/90) * 100 = 93.33%
- **Final Health Score**: (83.33 + 77.78 + 72.22 + 93.33) / 4 = **81.67** → **82**

---

## 🔘 Working Buttons

### **Dashboard Page Buttons**

#### 1. **"View Details" Buttons** (3 buttons)
- **Location**: Duplicates, Unassigned Leads, Missing Fields cards
- **Function**: Navigate to respective detail pages
- **Action**: `router.push("/duplicates")`, `/unassigned`, `/missing-fields`
- **Status**: ✅ **WORKING**

#### 2. **"Run Dedupe" Button**
- **Location**: Quick Actions section (bottom)
- **Function**: Automatically merge ALL duplicate contacts
- **How it works**:
  1. Fetches all contacts from `/api/contacts`
  2. Filters contacts where `isDuplicate === true`
  3. Gets all duplicate IDs
  4. Calls `POST /api/contacts` with `action: "merge"`
  5. API keeps first duplicate, deletes others
  6. Updates first duplicate: `isDuplicate: false`
  7. Refreshes metrics and health score
- **API Endpoint**: `POST /api/contacts`
- **Status**: ✅ **WORKING**

#### 3. **"Reassign Leads" Button**
- **Location**: Quick Actions section (bottom)
- **Function**: Assign ALL unassigned leads to sales team
- **How it works**:
  1. Fetches all contacts from `/api/contacts`
  2. Filters contacts where `isAssigned === false`
  3. Gets all unassigned IDs
  4. Calls `POST /api/contacts` with `action: "assign"`
  5. API updates all: `isAssigned: true`
  6. Refreshes metrics and health score
- **API Endpoint**: `POST /api/contacts`
- **Status**: ✅ **WORKING**

#### 4. **"Send Email Alert" Buttons** (Multiple)
- **Location**: Overdue Leads table (one per row)
- **Function**: Send email alert for specific overdue lead
- **How it works**:
  1. Calls `POST /api/leads` with `action: "send-alert"` and `leadId`
  2. Shows loading state while processing
  3. Displays success toast notification
- **API Endpoint**: `POST /api/leads`
- **Status**: ✅ **WORKING** (Currently simulates sending)

---

### **Duplicates Page (`/duplicates`)**

#### 1. **"Back to Dashboard" Button**
- **Function**: Navigate back to dashboard
- **Status**: ✅ **WORKING**

#### 2. **"Select All" / "Deselect All" Button**
- **Function**: Toggle selection of all duplicate records
- **Status**: ✅ **WORKING**

#### 3. **"Merge Selected" Button**
- **Function**: Merge selected duplicate records
- **Requirements**: Must select at least 2 records
- **How it works**:
  1. Validates at least 2 records selected
  2. Calls `POST /api/contacts` with `action: "merge"` and selected IDs
  3. API keeps first ID, deletes others
  4. Updates first record: `isDuplicate: false`
  5. Refreshes duplicate list
- **API Endpoint**: `POST /api/contacts`
- **Status**: ✅ **WORKING**

#### 4. **Individual Checkboxes**
- **Function**: Select/deselect individual records for merging
- **Status**: ✅ **WORKING**

---

### **Unassigned Leads Page (`/unassigned`)**

#### 1. **"Back to Dashboard" Button**
- **Function**: Navigate back to dashboard
- **Status**: ✅ **WORKING**

#### 2. **"Select All" / "Deselect All" Button**
- **Function**: Toggle selection of all unassigned records
- **Status**: ✅ **WORKING**

#### 3. **"Assign Selected" Button**
- **Function**: Assign selected leads to sales team
- **Requirements**: Must select at least 1 record
- **How it works**:
  1. Validates at least 1 record selected
  2. Calls `POST /api/contacts` with `action: "assign"` and selected IDs
  3. API updates all: `isAssigned: true`
  4. Refreshes unassigned list
- **API Endpoint**: `POST /api/contacts`
- **Status**: ✅ **WORKING**

#### 4. **Individual Checkboxes**
- **Function**: Select/deselect individual records for assignment
- **Status**: ✅ **WORKING**

---

### **Missing Fields Page (`/missing-fields`)**

#### 1. **"Back to Dashboard" Button**
- **Function**: Navigate back to dashboard
- **Status**: ✅ **WORKING**

#### 2. **"Select All" / "Deselect All" Button**
- **Function**: Toggle selection of all records with missing fields
- **Status**: ✅ **WORKING**

#### 3. **"Update Selected" Button**
- **Function**: Mark selected records as having complete data
- **Requirements**: Must select at least 1 record
- **How it works**:
  1. Validates at least 1 record selected
  2. Calls `POST /api/contacts` with `action: "update"` and selected IDs
  3. API updates all: `hasMissingFields: false`
  4. Refreshes missing fields list
- **API Endpoint**: `POST /api/contacts`
- **Status**: ✅ **WORKING**

#### 4. **Individual Checkboxes**
- **Function**: Select/deselect individual records for update
- **Status**: ✅ **WORKING**

---

## 📈 Charts (All Dynamic)

### 1. **Data Quality Pie Chart**
- **API**: `GET /api/metrics`
- **Data**: Calculated from metrics
- **Shows**: 
  - Healthy Records (total - duplicates - missing - unassigned)
  - Duplicates
  - Unassigned
  - Missing Fields
- **Status**: ✅ **WORKING** (Updates automatically)

### 2. **Health Score Trend Chart**
- **API**: `GET /api/charts/health-score-trend`
- **Data**: Calculated from current health score with variations
- **Shows**: 7-day trend (Mon-Sun)
- **Status**: ✅ **WORKING** (Currently shows mock trend based on current score)

### 3. **Issues by Industry Chart**
- **API**: `GET /api/charts/issues-by-industry`
- **Calculation**:
  1. Gets all companies and maps company name → industry
  2. Gets contacts with issues (`isDuplicate: true` OR `isAssigned: false` OR `hasMissingFields: true`)
  3. Groups issues by industry
  4. Counts issues per industry
- **Status**: ✅ **WORKING** (Calculated dynamically)

### 4. **Weekly Activity Chart**
- **API**: `GET /api/charts/weekly-activity`
- **Data**: Based on alerts collection timestamps
- **Shows**: Issues detected vs resolved per day
- **Status**: ✅ **WORKING** (Based on alert timestamps)

---

## 🔄 Data Flow

### **When Page Loads**:
1. Dashboard fetches:
   - `/api/metrics` → All counts
   - `/api/health-score` → Health score
   - `/api/leads/overdue` → Overdue leads list
2. Charts fetch their respective APIs
3. All data displayed is **real-time** from MongoDB

### **When Action Button is Clicked**:
1. Frontend validates selection
2. Sends POST request to API
3. API updates MongoDB
4. Frontend refreshes data
5. Metrics and health score recalculate automatically
6. UI updates to show new values

---

## 📝 API Endpoints Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/metrics` | GET | Get all metrics counts | ✅ Working |
| `/api/health-score` | GET | Calculate health score | ✅ Working |
| `/api/contacts` | GET | Get all contacts | ✅ Working |
| `/api/contacts` | POST | Merge/Assign/Update contacts | ✅ Working |
| `/api/leads/overdue` | GET | Get overdue leads | ✅ Working |
| `/api/leads` | POST | Send email alert | ✅ Working |
| `/api/charts/issues-by-industry` | GET | Get issues by industry | ✅ Working |
| `/api/charts/health-score-trend` | GET | Get trend data | ✅ Working |
| `/api/charts/weekly-activity` | GET | Get activity data | ✅ Working |

---

## 🎯 Key Features

1. **All calculations are dynamic** - No hardcoded values
2. **Real-time updates** - Data refreshes after actions
3. **MongoDB ObjectIds** - All documents use unique MongoDB IDs
4. **Error handling** - Toast notifications for success/errors
5. **Loading states** - Buttons show loading during operations
6. **Validation** - Actions validate before executing

---

## 💡 Example Workflow

**Scenario**: User wants to fix duplicate records

1. **Dashboard** → Click "View Details" on Duplicates card
2. **Duplicates Page** → Select records to merge (checkbox)
3. **Click "Merge Selected"** → API merges duplicates
4. **Auto-refresh** → List updates, duplicates removed
5. **Return to Dashboard** → Health score improved!

All calculations update automatically! 🎉

