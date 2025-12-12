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

// Realistic B2B company names
const companyNames = [
  "Acme Corporation", "TechStart Solutions", "Finance Pro Group", "HealthCare Plus", "Retail Giants Inc",
  "ManufactureCo Industries", "BankSecure Financial", "MediCare Systems", "CloudTech Innovations", "DataFlow Inc",
  "RetailMax Enterprises", "FactoryPro Manufacturing", "InvestSmart Capital", "HealthFirst Medical", "TechInnovate Labs",
  "ShopEasy Commerce", "BuildRight Construction", "CapitalGrowth Partners", "WellnessCare Health", "DevOps Solutions",
  "Market Leaders Corp", "Industrial Pro Systems", "WealthManage Advisors", "PharmaCare Pharmaceuticals", "SaaS Pioneers",
  "Enterprise Solutions", "Global Tech Partners", "Strategic Business Group"
]

const industries = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Consulting", "Real Estate", "Education"]
const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Jessica", "William", "Amanda", "James", "Lisa", "Richard", "Michelle", "Joseph", "Ashley", "Thomas", "Melissa", "Charles", "Nicole"]
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"]

const salesOwners = [
  { id: "owner-1", name: "Alex Thompson" },
  { id: "owner-2", name: "Maria Garcia" },
  { id: "owner-3", name: "David Chen" },
  { id: "owner-4", name: "Sarah Johnson" },
  { id: "owner-5", name: "Michael Brown" },
]

async function seed() {
  let client: MongoClient | null = null

  try {
    console.log("Connecting to MongoDB...")
    console.log("URI:", uri.replace(/\/\/.*@/, "//***:***@"))
    
    client = new MongoClient(uri)
    await client.connect()
    console.log("✓ Connected to MongoDB")

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

    // Generate 20-30 companies
    const numCompanies = Math.floor(Math.random() * 11) + 20 // 20-30
    console.log(`Generating ${numCompanies} companies...`)
    console.log(`Available company names: ${companyNames.length}`)
    
    const companies = []
    for (let i = 0; i < numCompanies; i++) {
      const industry = Math.random() > 0.2 ? industries[i % industries.length] : null // 80% have industry
      const employeeCount = Math.random() > 0.3 ? Math.floor(Math.random() * 5000) + 50 : null // 70% have employee count
      
      const companyIndex = i % companyNames.length // Wrap around if needed
      const companyName = companyNames[companyIndex]
      
      if (!companyName) {
        console.error(`Error: companyName is undefined at index ${companyIndex}`)
        throw new Error(`Invalid company name at index ${companyIndex}`)
      }
      
      companies.push({
        name: companyName,
        website: `https://www.${companyName.toLowerCase().replace(/\s+/g, "")}.com`,
        industry,
        employee_count: employeeCount,
      })
    }

    await db.collection("companies").insertMany(companies)
    console.log(`✓ Inserted ${companies.length} companies with unique ObjectIds`)

    // Generate 80-100 contacts
    const numContacts = Math.floor(Math.random() * 21) + 80 // 80-100
    console.log(`Generating ${numContacts} contacts...`)
    
    const contacts = []
    const emailMap = new Map<string, number>() // Track emails for duplicates
    const duplicateEmails: string[] = [] // Store emails to duplicate
    
    // First pass: create unique contacts
    for (let i = 0; i < numContacts; i++) {
      const companyIndex = i % companies.length
      const company = companies[companyIndex]
      
      if (!company || !company.name) {
        console.error(`Error: Invalid company at index ${companyIndex}`)
        throw new Error(`Invalid company at index ${companyIndex}`)
      }
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/\s+/g, "")}.com`
      
      // Determine if this will be a duplicate (25% duplicates)
      const willBeDuplicate = i < Math.floor(numContacts * 0.25)
      
      let email = baseEmail
      if (emailMap.has(baseEmail)) {
        emailMap.set(baseEmail, emailMap.get(baseEmail)! + 1)
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailMap.get(baseEmail)}@${company.name.toLowerCase().replace(/\s+/g, "")}.com`
      } else {
        emailMap.set(baseEmail, 1)
      }
      
      if (willBeDuplicate) {
        duplicateEmails.push(email)
      }
      
      // 30% unassigned (owner_id = null)
      const isUnassigned = i < Math.floor(numContacts * 0.30)
      // 25% missing industry
      const hasMissingIndustry = i >= Math.floor(numContacts * 0.30) && i < Math.floor(numContacts * 0.55)
      
      const owner = isUnassigned ? null : salesOwners[Math.floor(Math.random() * salesOwners.length)]
      
      contacts.push({
        email,
        first_name: firstName,
        last_name: lastName,
        company: company.name,
        industry: hasMissingIndustry ? null : company.industry,
        owner_id: owner ? owner.id : null,
        owner_name: owner ? owner.name : null,
        created_date: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Random date within last 90 days
      })
    }
    
    // Second pass: create duplicate variations (25% duplicates)
    const duplicateCount = Math.floor(numContacts * 0.25)
    for (let i = 0; i < duplicateCount && duplicateEmails.length > 0; i++) {
      const originalEmail = duplicateEmails[i % duplicateEmails.length]
      const originalContact = contacts.find(c => c.email === originalEmail)
      if (originalContact) {
        // Create variations: different email format, slight name variation
        const variations = [
          { email: originalEmail.replace("@", "+1@"), first_name: originalContact.first_name, last_name: originalContact.last_name },
          { email: originalEmail.replace(".", "_"), first_name: originalContact.first_name, last_name: originalContact.last_name + " Jr" },
          { email: originalEmail.replace(originalContact.first_name.toLowerCase(), originalContact.first_name.toLowerCase().charAt(0)), first_name: originalContact.first_name, last_name: originalContact.last_name },
        ]
        const variation = variations[i % variations.length]
        
        contacts.push({
          email: variation.email,
          first_name: variation.first_name,
          last_name: variation.last_name,
          company: originalContact.company,
          industry: originalContact.industry,
          owner_id: originalContact.owner_id,
          owner_name: originalContact.owner_name,
          created_date: new Date(originalContact.created_date.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Within 7 days of original
        })
      }
    }

    // Add Kavita Jakhar as a test contact (unassigned)
    contacts.push({
      email: "kavita@antheminfotech.com",
      first_name: "Kavita",
      last_name: "Jakhar",
      company: "Anthem Infotech",
      industry: "Technology",
      owner_id: null, // Unassigned to appear in leads
      owner_name: null,
      created_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    })

    await db.collection("contacts").insertMany(contacts)
    console.log(`✓ Inserted ${contacts.length} contacts with unique ObjectIds`)
    console.log(`  - Duplicates: ~${duplicateCount} (email/name variations)`)
    console.log(`  - Unassigned: ~${Math.floor(numContacts * 0.30)} (owner_id = null)`)
    console.log(`  - Missing Industry: ~${Math.floor(numContacts * 0.25)} (industry = null)`)

    // Generate leads (unassigned contacts >24h old)
    const unassignedContacts = contacts.filter(c => !c.owner_id)
    const overdueLeads = unassignedContacts
      .filter(c => {
        const daysSinceCreation = Math.floor((Date.now() - c.created_date.getTime()) / (24 * 60 * 60 * 1000))
        return daysSinceCreation > 1 // >24 hours
      })
      .slice(0, 9) // Limit to 9 to make room for test user
      .map(c => ({
        fullName: `${c.first_name} ${c.last_name}`,
        email: c.email,
        company: c.company,
        createdDate: c.created_date,
        daysOverdue: Math.floor((Date.now() - c.created_date.getTime()) / (24 * 60 * 60 * 1000)) - 1,
      }))
    
    // Add Kavita Jakhar as a test lead
    overdueLeads.push({
      fullName: "Kavita Jakhar",
      email: "kavita@antheminfotech.com",
      company: "Anthem Infotech",
      createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      daysOverdue: 2, // 2 days overdue
    })

    await db.collection("leads").insertMany(overdueLeads)
    console.log(`✓ Inserted ${overdueLeads.length} overdue leads`)

    // Insert alerts
    const alerts = [
      {
        type: "duplicate",
        message: "Duplicate contacts detected with similar email addresses",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        severity: "high",
      },
      {
        type: "unassigned",
        message: "Multiple leads are unassigned and require attention",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        severity: "medium",
      },
      {
        type: "missing-field",
        message: "Contacts missing industry classification",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        severity: "medium",
      },
    ]

    console.log("Inserting alerts...")
    await db.collection("alerts").insertMany(alerts)
    console.log(`✓ Inserted ${alerts.length} alerts with unique ObjectIds`)

    // Insert email alerts for unassigned leads >24h
    const emailAlerts = overdueLeads.slice(0, 5).map((lead, index) => ({
      subject: `Unassigned Lead Alert: ${lead.fullName} - ${lead.company}`,
      from: "alerts@revenuehealth.com",
      preview: `Lead ${lead.fullName} from ${lead.company} has been unassigned for ${lead.daysOverdue} days. Please assign to a sales representative...`,
      timestamp: new Date(Date.now() - 1000 * 60 * (10 + index * 5)),
      isRead: index < 2, // First 2 are read
      priority: lead.daysOverdue >= 5 ? "high" : "normal",
    }))

    console.log("Inserting email alerts...")
    await db.collection("emailAlerts").insertMany(emailAlerts)
    console.log(`✓ Inserted ${emailAlerts.length} email alerts with unique ObjectIds`)

    console.log("\n✅ Seed completed successfully!")
    console.log("\nSummary:")
    console.log(`  - Companies: ${companies.length}`)
    console.log(`  - Contacts: ${contacts.length}`)
    console.log(`  - Overdue Leads: ${overdueLeads.length}`)
    console.log(`  - Alerts: ${alerts.length}`)
    console.log(`  - Email Alerts: ${emailAlerts.length}`)
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
