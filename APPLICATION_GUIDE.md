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


