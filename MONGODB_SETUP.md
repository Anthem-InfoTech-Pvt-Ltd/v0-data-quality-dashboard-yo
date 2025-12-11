# MongoDB Setup Guide

This project uses MongoDB to store and manage data quality dashboard information.

## Prerequisites

- MongoDB installed locally or MongoDB Atlas account
- Node.js and npm installed

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure MongoDB Connection

Create a `.env.local` file in the root directory with your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/dataqualitydashboard
```

For MongoDB Atlas (cloud), use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dataqualitydashboard
```

### 3. Seed the Database

Run the seed script to populate the database with demo data:

```bash
npm run seed
```

This will create the following collections:
- `companies` - Company information
- `contacts` - Contact records
- `alerts` - System alerts
- `emailAlerts` - Email notifications
- `leads` - Lead information

### 4. Start the Development Server

```bash
npm run dev
```

## Database Collections

### Companies
- `_id`: ObjectId (MongoDB generated)
- `name`: string
- `industry`: string
- `hasIssues`: boolean

### Contacts
- `_id`: ObjectId (MongoDB generated)
- `name`: string
- `email`: string
- `company`: string
- `isAssigned`: boolean
- `hasMissingFields`: boolean
- `isDuplicate`: boolean

### Alerts
- `_id`: ObjectId (MongoDB generated)
- `type`: "duplicate" | "unassigned" | "missing-field"
- `message`: string
- `timestamp`: Date
- `severity`: "high" | "medium" | "low"

### Email Alerts
- `_id`: ObjectId (MongoDB generated)
- `subject`: string
- `from`: string
- `preview`: string
- `timestamp`: Date
- `isRead`: boolean
- `priority`: "high" | "normal" | "low"

### Leads
- `_id`: ObjectId (MongoDB generated)
- `fullName`: string
- `company`: string
- `createdDate`: Date
- `daysOverdue`: number

## API Endpoints

All API routes are located in `app/api/`:

- `GET /api/companies` - Get all companies
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Update contacts (merge, assign, update)
- `GET /api/alerts` - Get all alerts
- `GET /api/email-alerts` - Get all email alerts
- `GET /api/leads` - Get all leads
- `GET /api/leads/overdue` - Get overdue leads
- `POST /api/leads` - Send email alert
- `GET /api/metrics` - Get calculated metrics
- `GET /api/health-score` - Get health score
- `GET /api/charts/issues-by-industry` - Get issues by industry chart data
- `GET /api/charts/health-score-trend` - Get health score trend chart data
- `GET /api/charts/weekly-activity` - Get weekly activity chart data

## Notes

- All IDs use MongoDB ObjectId format
- All calculations are done dynamically from the database
- The frontend fetches data from APIs instead of using static demo data

