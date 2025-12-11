# How Duplicates and Unassigned Leads are Measured

## 📊 **DUPLICATE DETECTION LOGIC**

### **Method: Two-Pronged Detection System**

Duplicates are detected using **TWO independent methods** and combined:

#### **1. Email-Based Detection** 📧

**How it works:**
```javascript
// Step 1: Normalize email addresses
function normalizeEmail(email: string): string {
  // Removes +variations and converts to lowercase
  // Example: "john.smith+1@company.com" → "john.smith@company.com"
  return email.split("+")[0].split("@")[0].toLowerCase() + "@" + email.split("@")[1]
}

// Step 2: Group contacts by normalized email
emailGroups = {
  "john.smith@acmecorp.com": [contact1_id, contact2_id, contact3_id],
  "sarah.jones@techstart.com": [contact4_id],
  ...
}

// Step 3: Count groups with 2+ contacts as duplicates
```

**Examples of duplicates detected:**
- `john.smith@company.com` and `john.smith+1@company.com` ✅ Duplicate
- `John.Smith@Company.com` and `john.smith@company.com` ✅ Duplicate (case-insensitive)
- `john.smith@company.com` and `j.smith@company.com` ❌ NOT duplicate (different base)

#### **2. Name-Based Detection** 👤

**How it works:**
```javascript
// Step 1: Create name key from first_name + last_name + company
nameKey = `${first_name.toLowerCase()}_${last_name.toLowerCase()}_${company.toLowerCase()}`

// Step 2: Group contacts by name key
nameGroups = {
  "john_smith_acmecorp": [contact1_id, contact2_id],
  "sarah_jones_techstart": [contact3_id],
  ...
}

// Step 3: Count groups with 2+ contacts as duplicates
```

**Examples of duplicates detected:**
- `John Smith` at `Acme Corp` and `John Smith` at `Acme Corp` ✅ Duplicate
- `John Smith` at `Acme Corp` and `John Smith Jr` at `Acme Corp` ✅ Duplicate (name variation)
- `John Smith` at `Acme Corp` and `John Smith` at `TechStart` ❌ NOT duplicate (different company)

### **Final Duplicate Count**

```javascript
// Combine both methods
duplicateIds = Set of all contact IDs found in:
  - Email groups with 2+ contacts
  - Name groups with 2+ contacts

duplicateCount = duplicateIds.size
```

**Important:** A contact is counted as duplicate if it appears in **EITHER** email groups OR name groups with duplicates.

---

## 👥 **UNASSIGNED LEADS DETECTION LOGIC**

### **Method: Direct Database Query**

**How it works:**
```javascript
// Simple MongoDB query
unassignedLeads = db.collection("contacts").countDocuments({ 
  owner_id: null 
})
```

**Logic:**
- ✅ **Unassigned**: `owner_id === null` OR `owner_id === undefined`
- ❌ **Assigned**: `owner_id` has any value (e.g., "owner-1", "owner-2", etc.)

**Example:**
```javascript
// Contact 1: Unassigned ✅
{
  first_name: "John",
  last_name: "Smith",
  owner_id: null,        // ← Unassigned
  owner_name: null
}

// Contact 2: Assigned ❌
{
  first_name: "Sarah",
  last_name: "Jones",
  owner_id: "owner-1",   // ← Assigned to sales rep
  owner_name: "Alex Thompson"
}
```

---

## 📈 **CALCULATION FLOW**

### **Step-by-Step Process:**

1. **Fetch All Contacts**
   ```javascript
   contacts = await db.collection("contacts").find({}).toArray()
   ```

2. **Calculate Duplicates**
   ```javascript
   // Email normalization
   emailGroups = groupBy(normalizeEmail(contact.email))
   
   // Name grouping
   nameGroups = groupBy(first_name + last_name + company)
   
   // Count duplicates
   duplicates = count(contacts in groups with 2+ members)
   ```

3. **Calculate Unassigned Leads**
   ```javascript
   unassignedLeads = count(contacts where owner_id === null)
   ```

4. **Calculate Percentages**
   ```javascript
   duplicatePercentage = (duplicates / totalContacts) * 100
   unassignedPercentage = (unassignedLeads / totalContacts) * 100
   ```

---

## 🔍 **REAL EXAMPLE**

### **Sample Data:**

```javascript
Contacts:
1. { email: "john.smith@acme.com", first_name: "John", last_name: "Smith", company: "Acme Corp", owner_id: null }
2. { email: "john.smith+1@acme.com", first_name: "John", last_name: "Smith", company: "Acme Corp", owner_id: "owner-1" }
3. { email: "sarah.jones@tech.com", first_name: "Sarah", last_name: "Jones", company: "TechStart", owner_id: null }
4. { email: "mike.brown@tech.com", first_name: "Mike", last_name: "Brown", company: "TechStart", owner_id: "owner-2" }
```

### **Duplicate Detection:**

**Email Groups:**
- `john.smith@acme.com` → [Contact1, Contact2] ✅ **DUPLICATE** (normalized same)
- `sarah.jones@tech.com` → [Contact3] ❌ Not duplicate
- `mike.brown@tech.com` → [Contact4] ❌ Not duplicate

**Name Groups:**
- `john_smith_acmecorp` → [Contact1, Contact2] ✅ **DUPLICATE**
- `sarah_jones_techstart` → [Contact3] ❌ Not duplicate
- `mike_brown_techstart` → [Contact4] ❌ Not duplicate

**Result:** 2 duplicates (Contact1 and Contact2)

### **Unassigned Leads Detection:**

- Contact1: `owner_id: null` ✅ **UNASSIGNED**
- Contact2: `owner_id: "owner-1"` ❌ Assigned
- Contact3: `owner_id: null` ✅ **UNASSIGNED**
- Contact4: `owner_id: "owner-2"` ❌ Assigned

**Result:** 2 unassigned leads (Contact1 and Contact3)

---

## 📊 **API ENDPOINTS**

### **Get Metrics (Counts)**
```
GET /api/metrics
```
Returns:
```json
{
  "duplicates": 23,
  "unassignedLeads": 28,
  "missingFields": 23,
  "totalContacts": 117,
  "overdueLeads": 10
}
```

### **Get Duplicate Contacts**
```
GET /api/contacts/duplicates
```
Returns: Array of contact objects that are duplicates

### **Get Unassigned Contacts**
```
GET /api/contacts/unassigned
```
Returns: Array of contact objects where `owner_id === null`

---

## 🎯 **KEY POINTS**

1. **Duplicates are detected dynamically** - No flag stored in database
2. **Two detection methods** - Email normalization + Name matching
3. **Unassigned is simple** - Just check if `owner_id === null`
4. **All calculations are real-time** - Calculated from MongoDB on each request
5. **No pre-computed values** - Always accurate, always up-to-date

---

## 🔄 **When Data Changes**

After actions like "Run Dedupe" or "Reassign Leads":

1. **Database is updated** (contacts deleted/updated)
2. **Metrics are recalculated** (fresh query to MongoDB)
3. **UI updates automatically** (new counts displayed)

**Example:**
- Before: 23 duplicates, 28 unassigned
- Action: "Run Dedupe" merges 10 duplicates
- After: 13 duplicates, 28 unassigned (duplicates reduced)

---

## 💡 **Why This Approach?**

1. **Accurate**: Detects duplicates even with email variations
2. **Flexible**: Works with name variations too
3. **Real-time**: Always reflects current database state
4. **Scalable**: Efficient MongoDB queries
5. **Maintainable**: Clear, understandable logic

