import { MongoClient, ObjectId } from "mongodb"
import * as dotenv from "dotenv"
import * as path from "path"

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dataqualitydashboard"

if (!uri) {
  console.error("MONGODB_URI is not set. Please create a .env.local file with MONGODB_URI=mongodb://localhost:27017/dataqualitydashboard")
  process.exit(1)
}

const companies = [
  { name: "Acme Corp", industry: "Technology", hasIssues: true },
  { name: "TechStart Inc", industry: "Technology", hasIssues: false },
  { name: "Finance Pro", industry: "Finance", hasIssues: true },
  { name: "HealthCare Plus", industry: "Healthcare", hasIssues: true },
  { name: "Retail Giants", industry: "Retail", hasIssues: false },
  { name: "ManufactureCo", industry: "Manufacturing", hasIssues: true },
  { name: "BankSecure", industry: "Finance", hasIssues: false },
  { name: "MediCare Systems", industry: "Healthcare", hasIssues: true },
  { name: "CloudTech", industry: "Technology", hasIssues: false },
  { name: "DataFlow Inc", industry: "Technology", hasIssues: true },
  { name: "RetailMax", industry: "Retail", hasIssues: false },
  { name: "FactoryPro", industry: "Manufacturing", hasIssues: true },
  { name: "InvestSmart", industry: "Finance", hasIssues: false },
  { name: "HealthFirst", industry: "Healthcare", hasIssues: true },
  { name: "TechInnovate", industry: "Technology", hasIssues: false },
  { name: "ShopEasy", industry: "Retail", hasIssues: true },
  { name: "BuildRight", industry: "Manufacturing", hasIssues: false },
  { name: "CapitalGrowth", industry: "Finance", hasIssues: true },
  { name: "WellnessCare", industry: "Healthcare", hasIssues: false },
  { name: "DevOps Solutions", industry: "Technology", hasIssues: true },
  { name: "Market Leaders", industry: "Retail", hasIssues: false },
  { name: "Industrial Pro", industry: "Manufacturing", hasIssues: true },
  { name: "WealthManage", industry: "Finance", hasIssues: false },
  { name: "PharmaCare", industry: "Healthcare", hasIssues: true },
  { name: "SaaS Pioneers", industry: "Technology", hasIssues: false },
]

async function seed() {
  let client: MongoClient | null = null

  try {
    console.log("Connecting to MongoDB...")
    console.log("URI:", uri.replace(/\/\/.*@/, "//***:***@")) // Hide credentials in logs
    
    client = new MongoClient(uri)
    await client.connect()
    console.log("✓ Connected to MongoDB")

    // Extract database name from URI or use default
    let dbName = "dataqualitydashboard"
    if (uri.includes("/")) {
      const uriParts = uri.split("/")
      const lastPart = uriParts[uriParts.length - 1]
      dbName = lastPart.split("?")[0] || "dataqualitydashboard"
    }
    
    const db = client.db(dbName)
    console.log(`Using database: ${dbName}`)

    // Clear existing collections
    console.log("Clearing existing collections...")
    await db.collection("companies").deleteMany({})
    await db.collection("contacts").deleteMany({})
    await db.collection("alerts").deleteMany({})
    await db.collection("emailAlerts").deleteMany({})
    await db.collection("leads").deleteMany({})
    console.log("✓ Cleared existing collections")

    // Insert companies (MongoDB will auto-generate unique ObjectIds)
    console.log("Inserting companies...")
    const insertedCompanies = await db.collection("companies").insertMany(companies)
    console.log(`✓ Inserted ${companies.length} companies with unique ObjectIds`)

    // Generate contacts (MongoDB will auto-generate unique ObjectIds)
    console.log("Generating contacts...")
    const contacts = []
    for (let i = 0; i < 90; i++) {
      const company = companies[i % companies.length]
      const isDuplicate = i < 15
      const isUnassigned = i >= 15 && i < 35
      const hasMissingFields = i >= 35 && i < 60

      contacts.push({
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
        company: company.name,
        isAssigned: !isUnassigned,
        hasMissingFields,
        isDuplicate,
      })
    }

    await db.collection("contacts").insertMany(contacts)
    console.log(`✓ Inserted ${contacts.length} contacts with unique ObjectIds`)

    // Insert alerts
    const alerts = [
      {
        type: "duplicate",
        message: "3 duplicate contacts found in Acme Corp",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        severity: "high",
      },
      {
        type: "unassigned",
        message: "5 leads from TechStart Inc are unassigned",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        severity: "medium",
      },
      {
        type: "missing-field",
        message: "Finance Pro contact missing phone numbers",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        severity: "medium",
      },
      {
        type: "duplicate",
        message: "Duplicate email detected for HealthCare Plus",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        severity: "high",
      },
      {
        type: "unassigned",
        message: "8 new leads awaiting assignment",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        severity: "low",
      },
      {
        type: "missing-field",
        message: "ManufactureCo deals missing revenue data",
        timestamp: new Date(Date.now() - 1000 * 60 * 90),
        severity: "high",
      },
      {
        type: "duplicate",
        message: "2 duplicate companies found in system",
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        severity: "medium",
      },
    ]

    console.log("Inserting alerts...")
    await db.collection("alerts").insertMany(alerts)
    console.log(`✓ Inserted ${alerts.length} alerts with unique ObjectIds`)

    // Insert email alerts
    const emailAlerts = [
      {
        subject: "New Lead Assignment Required - Acme Corp",
        from: "leads@crm.com",
        preview: "5 new leads from Acme Corp require immediate assignment to sales team members...",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        isRead: false,
        priority: "high",
      },
      {
        subject: "Data Quality Report - Weekly Summary",
        from: "reports@crm.com",
        preview: "Your weekly data quality report is ready. Overall health score improved by 5%...",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        isRead: true,
        priority: "normal",
      },
      {
        subject: "Duplicate Records Detected - TechStart Inc",
        from: "alerts@crm.com",
        preview: "3 duplicate contact records found in TechStart Inc. Review and merge recommended...",
        timestamp: new Date(Date.now() - 1000 * 60 * 90),
        isRead: false,
        priority: "high",
      },
      {
        subject: "Missing Contact Information Alert",
        from: "alerts@crm.com",
        preview: "15 contacts are missing phone numbers. Complete data entry to improve quality...",
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        isRead: true,
        priority: "normal",
      },
      {
        subject: "Unassigned Leads Reminder",
        from: "leads@crm.com",
        preview: "You have 20 unassigned leads waiting for distribution. Assign now to prevent delays...",
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
        isRead: false,
        priority: "high",
      },
      {
        subject: "Monthly Data Health Insights",
        from: "reports@crm.com",
        preview: "Your monthly data health insights are available. Check out top performing teams...",
        timestamp: new Date(Date.now() - 1000 * 60 * 240),
        isRead: true,
        priority: "low",
      },
    ]

    console.log("Inserting email alerts...")
    await db.collection("emailAlerts").insertMany(emailAlerts)
    console.log(`✓ Inserted ${emailAlerts.length} email alerts with unique ObjectIds`)

    // Insert leads
    const leads = [
      {
        fullName: "Sarah Johnson",
        company: "Acme Corp",
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        daysOverdue: 3,
      },
      {
        fullName: "Michael Chen",
        company: "TechStart Inc",
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        daysOverdue: 5,
      },
      {
        fullName: "Emily Rodriguez",
        company: "Finance Pro",
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        daysOverdue: 2,
      },
      {
        fullName: "David Thompson",
        company: "HealthCare Plus",
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        daysOverdue: 7,
      },
      {
        fullName: "Jennifer Lee",
        company: "CloudTech",
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        daysOverdue: 4,
      },
      {
        fullName: "Robert Martinez",
        company: "DataFlow Inc",
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        daysOverdue: 6,
      },
    ]

    console.log("Inserting leads...")
    await db.collection("leads").insertMany(leads)
    console.log(`✓ Inserted ${leads.length} leads with unique ObjectIds`)

    console.log("\n✅ Seed completed successfully!")
    console.log("\nSummary:")
    console.log(`  - Companies: ${companies.length}`)
    console.log(`  - Contacts: ${contacts.length}`)
    console.log(`  - Alerts: ${alerts.length}`)
    console.log(`  - Email Alerts: ${emailAlerts.length}`)
    console.log(`  - Leads: ${leads.length}`)
    console.log("\nAll documents have been assigned unique MongoDB ObjectIds.")
  } catch (error) {
    console.error("\n❌ Error seeding database:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Stack trace:", error.stack)
    }
    throw error
  } finally {
    if (client) {
      await client.close()
      console.log("\nDatabase connection closed.")
    }
  }
}

seed()
  .then(() => {
    console.log("Seeding finished")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Seeding failed:", error)
    process.exit(1)
  })

