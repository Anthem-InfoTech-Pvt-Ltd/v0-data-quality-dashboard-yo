import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Get all companies with their industries
    const companies = await db.collection("companies").find({}).toArray()
    const industryMap = new Map<string, string>()
    companies.forEach((company: any) => {
      industryMap.set(company.name, company.industry)
    })

    // Get contacts with issues (unassigned or missing industry)
    const contacts = await db.collection("contacts").find({
      $or: [{ owner_id: null }, { industry: null }],
    }).toArray()
    
    // Also detect duplicates
    const allContacts = await db.collection("contacts").find({}).toArray()
    const emailGroups = new Map<string, any[]>()
    const nameGroups = new Map<string, any[]>()
    
    allContacts.forEach((contact: any) => {
      const normalizedEmail = contact.email.split("+")[0].split("@")[0].toLowerCase() + "@" + contact.email.split("@")[1]
      if (!emailGroups.has(normalizedEmail)) {
        emailGroups.set(normalizedEmail, [])
      }
      emailGroups.get(normalizedEmail)!.push(contact)
    })
    
    allContacts.forEach((contact: any) => {
      const nameKey = `${contact.first_name.toLowerCase()}_${contact.last_name.toLowerCase()}_${contact.company.toLowerCase()}`
      if (!nameGroups.has(nameKey)) {
        nameGroups.set(nameKey, [])
      }
      nameGroups.get(nameKey)!.push(contact)
    })
    
    const duplicateIds = new Set<string>()
    emailGroups.forEach((group) => {
      if (group.length > 1) {
        group.forEach((c: any) => duplicateIds.add(c._id.toString()))
      }
    })
    nameGroups.forEach((group) => {
      if (group.length > 1) {
        group.forEach((c: any) => duplicateIds.add(c._id.toString()))
      }
    })
    
    // Add duplicates to contacts with issues
    const duplicateContacts = allContacts.filter((c: any) => duplicateIds.has(c._id.toString()))
    contacts.push(...duplicateContacts)

    // Count issues by industry
    const industryIssues = new Map<string, number>()
    contacts.forEach((contact: any) => {
      const industry = industryMap.get(contact.company) || "Unknown"
      industryIssues.set(industry, (industryIssues.get(industry) || 0) + 1)
    })

    const data = Array.from(industryIssues.entries()).map(([industry, issues]) => ({
      industry,
      issues,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error calculating issues by industry:", error)
    return NextResponse.json({ error: "Failed to calculate issues by industry" }, { status: 500 })
  }
}

