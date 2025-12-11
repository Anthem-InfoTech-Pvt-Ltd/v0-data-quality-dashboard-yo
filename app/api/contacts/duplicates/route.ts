import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Helper function to normalize email for duplicate detection
function normalizeEmail(email: string): string {
  return email.split("+")[0].split("@")[0].toLowerCase() + "@" + email.split("@")[1]
}

export async function GET() {
  try {
    const db = await getDatabase()
    const contacts = await db.collection("contacts").find({}).toArray()
    
    const emailGroups = new Map<string, any[]>()
    const nameGroups = new Map<string, any[]>()
    
    // Group by normalized email
    contacts.forEach((contact: any) => {
      const normalizedEmail = normalizeEmail(contact.email)
      if (!emailGroups.has(normalizedEmail)) {
        emailGroups.set(normalizedEmail, [])
      }
      emailGroups.get(normalizedEmail)!.push(contact)
    })
    
    // Group by first_name + last_name + company
    contacts.forEach((contact: any) => {
      const nameKey = `${contact.first_name.toLowerCase()}_${contact.last_name.toLowerCase()}_${contact.company.toLowerCase()}`
      if (!nameGroups.has(nameKey)) {
        nameGroups.set(nameKey, [])
      }
      nameGroups.get(nameKey)!.push(contact)
    })
    
    // Find duplicates
    const duplicateIds = new Set<string>()
    const duplicateContacts: any[] = []
    
    emailGroups.forEach((group) => {
      if (group.length > 1) {
        group.forEach(contact => {
          if (!duplicateIds.has(contact._id.toString())) {
            duplicateIds.add(contact._id.toString())
            duplicateContacts.push(contact)
          }
        })
      }
    })
    
    nameGroups.forEach((group) => {
      if (group.length > 1) {
        group.forEach(contact => {
          if (!duplicateIds.has(contact._id.toString())) {
            duplicateIds.add(contact._id.toString())
            duplicateContacts.push(contact)
          }
        })
      }
    })
    
    return NextResponse.json(duplicateContacts)
  } catch (error) {
    console.error("Error fetching duplicates:", error)
    return NextResponse.json({ error: "Failed to fetch duplicates" }, { status: 500 })
  }
}

