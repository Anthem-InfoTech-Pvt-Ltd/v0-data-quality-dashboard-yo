import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Helper function to normalize email for duplicate detection
function normalizeEmail(email: string): string {
  return email.split("+")[0].split("@")[0].toLowerCase() + "@" + email.split("@")[1]
}

// Helper function to detect duplicates
async function countDuplicates(db: any): Promise<number> {
  const contacts = await db.collection("contacts").find({}).toArray()
  const emailGroups = new Map<string, string[]>()
  const nameGroups = new Map<string, string[]>()
  
  contacts.forEach((contact: any) => {
    const normalizedEmail = normalizeEmail(contact.email)
    if (!emailGroups.has(normalizedEmail)) {
      emailGroups.set(normalizedEmail, [])
    }
    emailGroups.get(normalizedEmail)!.push(contact._id.toString())
  })
  
  contacts.forEach((contact: any) => {
    const nameKey = `${contact.first_name.toLowerCase()}_${contact.last_name.toLowerCase()}_${contact.company.toLowerCase()}`
    if (!nameGroups.has(nameKey)) {
      nameGroups.set(nameKey, [])
    }
    nameGroups.get(nameKey)!.push(contact._id.toString())
  })
  
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
    
    // Filter for unassigned leads that haven't had email alerts sent
    const unassignedFilter = { 
      owner_id: null,
      $or: [
        { email_alert_sent_at: { $exists: false } },
        { email_alert_sent_at: null }
      ]
    }
    
    // Count overdue leads whose contacts haven't had alerts sent
    // Get all contacts that have alerts sent (to exclude them)
    const contactsWithAlerts = await db.collection("contacts")
      .find({ 
        email_alert_sent_at: { $exists: true, $ne: null } 
      })
      .project({ first_name: 1, last_name: 1, company: 1 })
      .toArray()
    
    // Create a Set for fast lookup
    const alertSentContacts = new Set(
      contactsWithAlerts.map(c => 
        `${c.first_name.toLowerCase()}_${c.last_name.toLowerCase()}_${c.company.toLowerCase()}`
      )
    )
    
    // Get all overdue leads and filter
    const allOverdueLeads = await db.collection("leads")
      .find({ daysOverdue: { $gt: 0 } })
      .toArray()
    
    const overdueLeads = allOverdueLeads.filter(lead => {
      const nameParts = lead.fullName.split(" ")
      const firstName = nameParts[0]?.toLowerCase() || ""
      const lastName = nameParts.slice(1).join(" ").toLowerCase() || ""
      const company = lead.company?.toLowerCase() || ""
      const key = `${firstName}_${lastName}_${company}`
      return !alertSentContacts.has(key)
    }).length
    
    const [duplicates, unassignedLeads, missingFields, totalContacts] = await Promise.all([
      countDuplicates(db),
      db.collection("contacts").countDocuments(unassignedFilter),
      db.collection("contacts").countDocuments({ industry: null }),
      db.collection("contacts").countDocuments({}),
    ])

    if (totalContacts === 0) {
      return NextResponse.json({ score: 100 })
    }

    const duplicateScore = ((totalContacts - duplicates) / totalContacts) * 100
    const assignmentScore = ((totalContacts - unassignedLeads) / totalContacts) * 100
    const completenessScore = ((totalContacts - missingFields) / totalContacts) * 100
    const overdueScore = ((totalContacts - overdueLeads) / totalContacts) * 100

    const healthScore = Math.round((duplicateScore + assignmentScore + completenessScore + overdueScore) / 4)

    return NextResponse.json({ score: healthScore })
  } catch (error) {
    console.error("Error calculating health score:", error)
    return NextResponse.json({ error: "Failed to calculate health score" }, { status: 500 })
  }
}
