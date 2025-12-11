import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Metrics } from "@/lib/models"

// Helper function to normalize email for duplicate detection
function normalizeEmail(email: string): string {
  // Remove +variations and convert to lowercase
  return email.split("+")[0].split("@")[0].toLowerCase() + "@" + email.split("@")[1]
}

// Helper function to detect duplicates
async function countDuplicates(db: any): Promise<number> {
  const contacts = await db.collection("contacts").find({}).toArray()
  const emailGroups = new Map<string, string[]>()
  const nameGroups = new Map<string, string[]>()
  
  // Group by normalized email
  contacts.forEach((contact: any) => {
    const normalizedEmail = normalizeEmail(contact.email)
    if (!emailGroups.has(normalizedEmail)) {
      emailGroups.set(normalizedEmail, [])
    }
    emailGroups.get(normalizedEmail)!.push(contact._id.toString())
  })
  
  // Group by first_name + last_name + company (for name variations)
  contacts.forEach((contact: any) => {
    const nameKey = `${contact.first_name.toLowerCase()}_${contact.last_name.toLowerCase()}_${contact.company.toLowerCase()}`
    if (!nameGroups.has(nameKey)) {
      nameGroups.set(nameKey, [])
    }
    nameGroups.get(nameKey)!.push(contact._id.toString())
  })
  
  // Count duplicates (groups with more than 1 contact)
  let duplicateCount = 0
  const duplicateIds = new Set<string>()
  
  emailGroups.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach(id => duplicateIds.add(id))
    }
  })
  
  nameGroups.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach(id => duplicateIds.add(id))
    }
  })
  
  return duplicateIds.size
}

export async function GET() {
  try {
    const db = await getDatabase()
    
    const [duplicates, unassignedLeads, missingFields, totalContacts, overdueLeads] = await Promise.all([
      countDuplicates(db),
      db.collection("contacts").countDocuments({ owner_id: null }),
      db.collection("contacts").countDocuments({ industry: null }),
      db.collection("contacts").countDocuments({}),
      db.collection("leads").countDocuments({ daysOverdue: { $gt: 0 } }),
    ])

    const metrics: Metrics = {
      duplicates,
      unassignedLeads,
      missingFields,
      totalContacts,
      overdueLeads,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error calculating metrics:", error)
    return NextResponse.json({ error: "Failed to calculate metrics" }, { status: 500 })
  }
}
