# Revenue Data Health Score Dashboard - Application Guide


Features

### 1. Health Score Dashboard

The main dashboard provides an at-a-glance view of your data quality:

- **Health Score Circle**: Visual representation of overall data quality (0-100%)
- **Key Metrics Cards**: Displays counts for:
  - Duplicate records
  - Unassigned leads
  - Missing fields
  - Total contacts
- **Quick Actions**: One-click buttons to run deduplication and reassign leads
- **Overdue Leads Alert**: Table showing leads unassigned for more than 24 hours with email alert functionality

### 2. Duplicates Detection Module

**Location**: `/duplicates`

Identifies and manages duplicate contact and company records:

- **Features**:
  - Paginated list of all duplicate records
  - Bulk selection and merge capabilities
  - Individual record merge options
  - Real-time count updates after merges

- **Actions**:
  - Select multiple duplicates and merge them into single records
  - Preserves the most complete data from duplicate entries

### 3. Unassigned Leads Module

**Location**: `/unassigned`

Manages leads that haven't been assigned to sales representatives:

- **Features**:
  - Infinite scroll list of unassigned leads
  - Bulk selection and assignment
  - Email alert functionality (individual and bulk)
  - Filtering by missing industry data

- **Actions**:
  - Assign selected leads to sales team members
  - Send email alerts to contacts about their unassigned status
  - Track leads overdue for more than 24 hours

### 4. Missing Fields Module

**Location**: `/missing-fields`

Identifies records with incomplete data:

- **Features**:
  - Tracks missing critical fields: Phone Number, Job Title, Address, Revenue, Industry
  - Paginated view of records with missing information
  - Bulk selection for batch updates

- **Actions**:
  - Update missing fields for selected records
  - Identify which specific fields are missing per record

### 5. Analytics & Visualizations

The dashboard includes several interactive charts:

- **Data Quality Pie Chart**: Breakdown of data quality by category
- **Health Score Trend Chart**: Historical view of health score changes over time
- **Issues by Industry Chart**: Distribution of data quality issues across different industries
- **Weekly Activity Chart**: Activity trends and data quality improvements

### 6. Settings & Configuration

**Location**: `/settings`

Configure application settings, user preferences, and system parameters.

## Technical Architecture

### Technology Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Email**: Nodemailer
- **Authentication**: Custom auth context with protected routes

### Application Structure

```
app/
├── dashboard/          # Main dashboard page
├── duplicates/         # Duplicate detection and management
├── unassigned/         # Unassigned leads management
├── missing-fields/     # Missing fields tracking
├── settings/           # Application settings
├── login/              # Authentication page
└── api/                # REST API endpoints
    ├── metrics/        # Data quality metrics
    ├── health-score/   # Health score calculation
    ├── contacts/       # Contact management operations
    ├── leads/          # Lead management
    └── charts/         # Chart data endpoints
```

## How It Works

### Health Score Calculation

The health score is calculated based on three primary factors:

1. **Duplicates**: Penalizes for duplicate records in the database
2. **Unassigned Leads**: Reduces score for leads without assigned owners
3. **Missing Fields**: Deducts points for records with incomplete critical information

The score is expressed as a percentage (0-100%), where 100% represents perfect data quality.

### Data Flow

1. **Data Ingestion**: Contacts and companies are stored in MongoDB
2. **Analysis**: Background processes analyze data for quality issues
3. **Dashboard Display**: Real-time metrics are fetched and displayed
4. **User Actions**: Users can take remediation actions (merge, assign, update)
5. **Score Update**: Health score recalculates after each action

### Key Operations

#### Deduplication Process
- Identifies duplicate records based on email, name, and company matching
- Merges duplicates while preserving the most complete data
- Updates health score automatically after merge

#### Lead Assignment
- Assigns unassigned leads to available sales team members
- Uses round-robin or intelligent distribution algorithms
- Tracks assignment history and overdue leads

#### Email Alerts
- Sends automated emails to contacts with unassigned leads
- Supports individual and bulk email operations
- Tracks email delivery status

## User Workflow

### Typical Usage Flow

1. **Login**: Authenticate to access the dashboard
2. **Review Dashboard**: Check health score and key metrics
3. **Identify Issues**: Navigate to specific modules (duplicates, unassigned, missing fields)
4. **Take Action**: Select records and execute remediation actions
5. **Monitor Progress**: View updated health score and charts
6. **Repeat**: Continue monitoring and improving data quality


## Getting Started

1. **Access the Application**: Navigate to the login page
2. **Authenticate**: Use your credentials to log in
3. **View Dashboard**: Review your current data health score
4. **Explore Modules**: Click on any module card to dive deeper
5. **Take Action**: Use the quick actions or module-specific tools to improve data quality

---

## Connecting to External Data Sources

The application currently uses MongoDB as its data source. You can extend it to connect to external CRM systems like HubSpot, Salesforce, or other APIs. Here's how:

### Architecture Overview

The application uses a data abstraction layer through `lib/mongodb.ts`. To connect to external data sources, you'll need to:

1. Create a data adapter/service layer
2. Map external data to the internal data model
3. Update API routes to use the new data source
4. Optionally sync data to MongoDB for caching

### Step 1: Create a Data Source Adapter

Create a new file `lib/data-sources/hubspot-adapter.ts` (or `salesforce-adapter.ts`):

```typescript
// lib/data-sources/hubspot-adapter.ts
import { Contact } from "@/lib/models"

interface HubSpotContact {
  id: string
  properties: {
    email: string
    firstname: string
    lastname: string
    company: string
    industry: string | null
    hubspot_owner_id: string | null
    createdate: string
  }
}

export class HubSpotAdapter {
  private apiKey: string
  private baseUrl = "https://api.hubapi.com"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async fetchContacts(): Promise<Contact[]> {
    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/contacts?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    )

    const data = await response.json()
    
    // Transform HubSpot format to internal Contact model
    return data.results.map((contact: HubSpotContact) => ({
      _id: contact.id,
      email: contact.properties.email,
      first_name: contact.properties.firstname,
      last_name: contact.properties.lastname,
      company: contact.properties.company,
      industry: contact.properties.industry,
      owner_id: contact.properties.hubspot_owner_id,
      owner_name: null, // Fetch separately if needed
      created_date: new Date(contact.properties.createdate),
    }))
  }

  async syncToMongoDB(db: any) {
    const contacts = await this.fetchContacts()
    
    // Clear existing data or merge
    await db.collection("contacts").deleteMany({})
    
    // Insert synced contacts
    await db.collection("contacts").insertMany(contacts)
    
    return contacts.length
  }
}
```

### Step 2: Create a Data Source Service

Create `lib/data-sources/index.ts` to manage different data sources:

```typescript
// lib/data-sources/index.ts
import { getDatabase } from "@/lib/mongodb"
import { HubSpotAdapter } from "./hubspot-adapter"

export enum DataSourceType {
  MONGODB = "mongodb",
  HUBSPOT = "hubspot",
  SALESFORCE = "salesforce",
}

export class DataSourceService {
  private sourceType: DataSourceType

  constructor(sourceType: DataSourceType = DataSourceType.MONGODB) {
    this.sourceType = sourceType
  }

  async getContacts() {
    const db = await getDatabase()

    switch (this.sourceType) {
      case DataSourceType.HUBSPOT:
        const hubspot = new HubSpotAdapter(process.env.HUBSPOT_API_KEY!)
        // Sync from HubSpot to MongoDB, then query MongoDB
        await hubspot.syncToMongoDB(db)
        return db.collection("contacts").find({}).toArray()

      case DataSourceType.SALESFORCE:
        // Similar implementation for Salesforce
        // ...

      case DataSourceType.MONGODB:
      default:
        return db.collection("contacts").find({}).toArray()
    }
  }
}
```

### Step 3: Update Environment Variables

Add to `.env.local`:

```env
# Data Source Configuration
DATA_SOURCE_TYPE=mongodb  # Options: mongodb, hubspot, salesforce

# HubSpot Configuration
HUBSPOT_API_KEY=your_hubspot_api_key_here

# Salesforce Configuration
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_salesforce_password
SALESFORCE_SECURITY_TOKEN=your_salesforce_security_token
```

### Step 4: Update API Routes

Modify `app/api/contacts/route.ts` to use the data source service:

```typescript
import { DataSourceService, DataSourceType } from "@/lib/data-sources"

export async function GET() {
  try {
    const sourceType = (process.env.DATA_SOURCE_TYPE || "mongodb") as DataSourceType
    const dataService = new DataSourceService(sourceType)
    const contacts = await dataService.getContacts()
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}
```

### Step 5: Set Up Sync Schedule (Optional)

For real-time sync, create a sync API route `app/api/sync/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { DataSourceService, DataSourceType } from "@/lib/data-sources"

export async function POST() {
  try {
    const sourceType = (process.env.DATA_SOURCE_TYPE || "mongodb") as DataSourceType
    const dataService = new DataSourceService(sourceType)
    await dataService.getContacts() // This syncs data
    return NextResponse.json({ success: true, message: "Data synced successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
```

You can call this endpoint via:
- **Cron job** (Vercel Cron, GitHub Actions, etc.)
- **Webhook** from your CRM system
- **Manual trigger** from the dashboard

### Salesforce Integration Example

For Salesforce, you'll need OAuth2 authentication:

```typescript
// lib/data-sources/salesforce-adapter.ts
export class SalesforceAdapter {
  private accessToken: string | null = null

  async authenticate() {
    const response = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: process.env.SALESFORCE_CLIENT_ID!,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
        username: process.env.SALESFORCE_USERNAME!,
        password: process.env.SALESFORCE_PASSWORD! + process.env.SALESFORCE_SECURITY_TOKEN!,
      }),
    })

    const data = await response.json()
    this.accessToken = data.access_token
  }

  async fetchContacts(): Promise<Contact[]> {
    if (!this.accessToken) await this.authenticate()

    const response = await fetch(
      `${process.env.SALESFORCE_INSTANCE_URL}/services/data/v57.0/query?q=SELECT Id,Email,FirstName,LastName,Company,Industry,OwnerId,CreatedDate FROM Contact`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    const data = await response.json()
    // Transform Salesforce format to internal Contact model
    return data.records.map((record: any) => ({
      _id: record.Id,
      email: record.Email,
      first_name: record.FirstName,
      last_name: record.LastName,
      company: record.Company,
      industry: record.Industry,
      owner_id: record.OwnerId,
      owner_name: null,
      created_date: new Date(record.CreatedDate),
    }))
  }
}
```

### Best Practices

1. **Caching**: Always sync external data to MongoDB for faster queries and offline capability
2. **Rate Limiting**: Respect API rate limits from external services
3. **Error Handling**: Implement retry logic and graceful degradation
4. **Incremental Sync**: Only sync changed records to reduce API calls
5. **Data Mapping**: Create a mapping layer to handle field name differences

---

## Modifying the Health Score Formula

The health score is calculated in `app/api/health-score/route.ts`. You can customize the formula to match your business requirements.

### Current Formula

The current health score uses a simple average of four factors:

```typescript
const duplicateScore = ((totalContacts - duplicates) / totalContacts) * 100
const assignmentScore = ((totalContacts - unassignedLeads) / totalContacts) * 100
const completenessScore = ((totalContacts - missingFields) / totalContacts) * 100
const overdueScore = ((totalContacts - overdueLeads) / totalContacts) * 100

const healthScore = Math.round(
  (duplicateScore + assignmentScore + completenessScore + overdueScore) / 4
)
```

### Customization Options

#### Option 1: Weighted Scoring

Modify `app/api/health-score/route.ts` to use weighted factors:

```typescript
export async function GET() {
  try {
    const db = await getDatabase()
    
    // ... fetch metrics ...

    // Define weights (must sum to 1.0)
    const weights = {
      duplicates: 0.30,      // 30% weight - duplicates are critical
      assignment: 0.25,      // 25% weight - unassigned leads
      completeness: 0.25,    // 25% weight - missing fields
      overdue: 0.20,         // 20% weight - overdue leads
    }

    const duplicateScore = ((totalContacts - duplicates) / totalContacts) * 100
    const assignmentScore = ((totalContacts - unassignedLeads) / totalContacts) * 100
    const completenessScore = ((totalContacts - missingFields) / totalContacts) * 100
    const overdueScore = ((totalContacts - overdueLeads) / totalContacts) * 100

    const healthScore = Math.round(
      duplicateScore * weights.duplicates +
      assignmentScore * weights.assignment +
      completenessScore * weights.completeness +
      overdueScore * weights.overdue
    )

    return NextResponse.json({ score: Math.max(0, Math.min(100, healthScore)) })
  } catch (error) {
    // ... error handling ...
  }
}
```

#### Option 2: Add New Metrics

Add additional factors to the health score:

```typescript
// Add new metric: Email validation
const invalidEmails = await db.collection("contacts").countDocuments({
  email: { $not: { $regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } }
})

// Add new metric: Phone number completeness
const missingPhones = await db.collection("contacts").countDocuments({
  $or: [
    { phone: null },
    { phone: "" },
    { phone: { $exists: false } }
  ]
})

// Calculate scores
const emailValidationScore = ((totalContacts - invalidEmails) / totalContacts) * 100
const phoneCompletenessScore = ((totalContacts - missingPhones) / totalContacts) * 100

// Include in weighted average
const healthScore = Math.round(
  duplicateScore * 0.25 +
  assignmentScore * 0.20 +
  completenessScore * 0.20 +
  overdueScore * 0.15 +
  emailValidationScore * 0.10 +
  phoneCompletenessScore * 0.10
)
```

#### Option 3: Threshold-Based Scoring

Use thresholds instead of percentages:

```typescript
let healthScore = 100

// Deduct points based on thresholds
if (duplicates > totalContacts * 0.05) {  // More than 5% duplicates
  healthScore -= 20
} else if (duplicates > totalContacts * 0.02) {  // More than 2% duplicates
  healthScore -= 10
}

if (unassignedLeads > totalContacts * 0.10) {  // More than 10% unassigned
  healthScore -= 15
} else if (unassignedLeads > totalContacts * 0.05) {
  healthScore -= 8
}

// ... similar for other metrics ...

return NextResponse.json({ score: Math.max(0, Math.min(100, healthScore)) })
```

#### Option 4: Industry-Specific Scoring

Apply different weights based on industry:

```typescript
// Get industry distribution
const industryStats = await db.collection("contacts").aggregate([
  { $group: { _id: "$industry", count: { $sum: 1 } } }
]).toArray()

// Adjust weights based on industry
const weights = getIndustryWeights(industryStats)

function getIndustryWeights(industryStats: any[]) {
  // Example: Technology companies prioritize completeness
  // Finance companies prioritize assignment
  const techCount = industryStats.find(i => i._id === "Technology")?.count || 0
  const financeCount = industryStats.find(i => i._id === "Finance")?.count || 0
  
  if (techCount > financeCount) {
    return { duplicates: 0.25, assignment: 0.20, completeness: 0.35, overdue: 0.20 }
  } else {
    return { duplicates: 0.30, assignment: 0.30, completeness: 0.20, overdue: 0.20 }
  }
}
```

#### Option 5: Time-Based Decay

Apply time-based penalties for overdue issues:

```typescript
// Calculate average days overdue
const overdueLeadsData = await db.collection("leads")
  .find({ daysOverdue: { $gt: 0 } })
  .toArray()

const avgDaysOverdue = overdueLeadsData.length > 0
  ? overdueLeadsData.reduce((sum, lead) => sum + lead.daysOverdue, 0) / overdueLeadsData.length
  : 0

// Apply exponential decay penalty
const overduePenalty = Math.min(30, avgDaysOverdue * 2)  // Max 30 point penalty
const overdueScore = Math.max(0, 100 - overduePenalty)
```

### Configuration via Environment Variables

Make the formula configurable via environment variables:

```typescript
// app/api/health-score/route.ts
const weights = {
  duplicates: parseFloat(process.env.HEALTH_SCORE_WEIGHT_DUPLICATES || "0.25"),
  assignment: parseFloat(process.env.HEALTH_SCORE_WEIGHT_ASSIGNMENT || "0.25"),
  completeness: parseFloat(process.env.HEALTH_SCORE_WEIGHT_COMPLETENESS || "0.25"),
  overdue: parseFloat(process.env.HEALTH_SCORE_WEIGHT_OVERDUE || "0.25"),
}
```

Add to `.env.local`:

```env
# Health Score Weights (must sum to 1.0)
HEALTH_SCORE_WEIGHT_DUPLICATES=0.30
HEALTH_SCORE_WEIGHT_ASSIGNMENT=0.25
HEALTH_SCORE_WEIGHT_COMPLETENESS=0.25
HEALTH_SCORE_WEIGHT_OVERDUE=0.20
```

### Updating the Metrics Model

If you add new metrics, update `lib/models.ts`:

```typescript
export interface Metrics {
  duplicates: number
  unassignedLeads: number
  missingFields: number
  totalContacts: number
  overdueLeads: number
  invalidEmails?: number      // New metric
  missingPhones?: number      // New metric
}
```

### Testing Your Changes

1. **Test locally**: Modify the formula and test with your data
2. **Validate ranges**: Ensure scores stay between 0-100
3. **Check edge cases**: Test with empty databases, single records, etc.
4. **Monitor impact**: Deploy to staging and monitor how scores change

---
