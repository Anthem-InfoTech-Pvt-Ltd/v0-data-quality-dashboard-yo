import { MongoClient, Db } from "mongodb"
import { Contact } from "@/lib/models"

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

export async function seedDatabase(db: Db) {
  try {
    // Clear existing data
    await db.collection("companies").deleteMany({})
    await db.collection("contacts").deleteMany({})
    await db.collection("alerts").deleteMany({})
    await db.collection("emailAlerts").deleteMany({})
    await db.collection("leads").deleteMany({})

    // Generate 100-150 companies for realistic data volume
    const numCompanies = Math.floor(Math.random() * 51) + 100 
    
    const companies = []
    for (let i = 0; i < numCompanies; i++) {
      const industry = Math.random() > 0.2 ? industries[i % industries.length] : null // 80% have industry
      const employeeCount = Math.random() > 0.3 ? Math.floor(Math.random() * 5000) + 50 : null // 70% have employee count
      
      const companyIndex = i % companyNames.length // Wrap around if needed
      const companyName = companyNames[companyIndex]
      
      if (!companyName) {
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

    // Generate 2,000-5,000 contacts for realistic data volume
    const numContacts = Math.floor(Math.random() * 3001) + 2000 // 2000-5000
    
    const contacts = []
    const emailMap = new Map<string, number>() 
    const duplicateEmails: string[] = [] 
    
    for (let i = 0; i < numContacts; i++) {
      const companyIndex = i % companies.length
      const company = companies[companyIndex]
      
      if (!company || !company.name) {
        throw new Error(`Invalid company at index ${companyIndex}`)
      }
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/\s+/g, "")}.com`
      
      const willBeDuplicate = i < Math.floor(numContacts * 0.10) // ~10% will have duplicates (300-500 contacts)
      
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
      
      const isUnassigned = i < Math.floor(numContacts * 0.04) // ~4% unassigned (150-200 contacts)
      const hasMissingIndustry = i >= Math.floor(numContacts * 0.04) && i < Math.floor(numContacts * 0.10) // ~6% missing industry (200-300 contacts)
      
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
    
    const duplicateCount = Math.floor(numContacts * 0.10) // ~10% duplicates (300-500)
    for (let i = 0; i < duplicateCount && duplicateEmails.length > 0; i++) {
      const originalEmail = duplicateEmails[i % duplicateEmails.length]
      const originalContact: Contact | undefined = contacts.find((c: Contact) => c.email === originalEmail)
      if (originalContact) {
        const variations: { email: string; first_name: string; last_name: string }[] = [
          { email: originalEmail.replace("@", "+1@"), first_name: originalContact.first_name, last_name: originalContact.last_name },
          { email: originalEmail.replace(".", "_"), first_name: originalContact.first_name, last_name: originalContact.last_name + " Jr" },
          { email: originalEmail.replace(originalContact.first_name.toLowerCase(), originalContact.first_name.toLowerCase().charAt(0)), first_name: originalContact.first_name, last_name: originalContact.last_name },
        ]
        const variation: { email: string; first_name: string; last_name: string } = variations[i % variations.length]
        
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

    // Generate leads (unassigned contacts >24h old)
    const unassignedContacts = contacts.filter(c => !c.owner_id)
    const overdueContacts = unassignedContacts
      .filter(c => {
        const daysSinceCreation = Math.floor((Date.now() - c.created_date.getTime()) / (24 * 60 * 60 * 1000))
        return daysSinceCreation > 1 // >24 hours
      })
      .slice(0, 150) // Limit to 150 leads for demo purposes
    
    const overdueLeads = overdueContacts.map(c => ({
        fullName: `${c.first_name} ${c.last_name}`,
        email: c.email, // All contacts have emails, no N/A
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

    await db.collection("alerts").insertMany(alerts)

    // Insert email alerts for unassigned leads >24h (sample of 20 for dashboard)
    const emailAlerts = overdueLeads.slice(0, 20).map((lead, index) => ({
      subject: `Unassigned Lead Alert: ${lead.fullName} - ${lead.company}`,
      from: "alerts@revenuehealth.com",
      preview: `Lead ${lead.fullName} from ${lead.company} has been unassigned for ${lead.daysOverdue} days. Please assign to a sales representative...`,
      timestamp: new Date(Date.now() - 1000 * 60 * (10 + index * 5)),
      isRead: index < 8, // First 8 are read
      priority: lead.daysOverdue >= 5 ? "high" : "normal",
    }))

    await db.collection("emailAlerts").insertMany(emailAlerts)

    return {
      success: true,
      summary: {
        companies: companies.length,
        contacts: contacts.length,
        overdueLeads: overdueLeads.length,
        alerts: alerts.length,
        emailAlerts: emailAlerts.length,
      }
    }
  } catch (error) {
    console.error("Error seeding database:", error)
    throw error
  }
}

