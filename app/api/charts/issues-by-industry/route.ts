import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Default industries to ensure chart never disappears
const DEFAULT_INDUSTRIES = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Consulting", "Real Estate", "Education"]

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Get all companies with their industries
    const companies = await db.collection("companies").find({}).toArray()
    const industryMap = new Map<string, string>()
    companies.forEach((company: any) => {
      if (company.industry) {
        industryMap.set(company.name, company.industry)
      }
    })

    // Get contacts with issues (unassigned or missing industry)
    const [unassignedContacts, missingIndustryContacts, allContacts] = await Promise.all([
      db.collection("contacts").find({ owner_id: null }).toArray(),
      db.collection("contacts").find({ industry: null }).toArray(),
      db.collection("contacts").find({}).toArray()
    ])
    
    // Detect duplicates using the same normalized email logic
    const emailGroups = new Map<string, any[]>()
    const nameGroups = new Map<string, any[]>()
    
    allContacts.forEach((contact: any) => {
      if (contact.email) {
        const normalizedEmail = contact.email.split("+")[0].split("@")[0].toLowerCase() + "@" + contact.email.split("@")[1]
        if (!emailGroups.has(normalizedEmail)) {
          emailGroups.set(normalizedEmail, [])
        }
        emailGroups.get(normalizedEmail)!.push(contact)
      }
    })
    
    allContacts.forEach((contact: any) => {
      const nameKey = `${contact.first_name?.toLowerCase()}_${contact.last_name?.toLowerCase()}_${contact.company?.toLowerCase()}`
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
    
    // Combine all contacts with issues
    const contactsWithIssues = new Set<string>()
    const industryIssues = new Map<string, number>()
    
    // Initialize all default industries with 0
    DEFAULT_INDUSTRIES.forEach(industry => {
      industryIssues.set(industry, 0)
    })
    
    // Count unassigned contacts by industry
    unassignedContacts.forEach((contact: any) => {
      if (!contactsWithIssues.has(contact._id.toString())) {
        contactsWithIssues.add(contact._id.toString())
        const industry = contact.industry || industryMap.get(contact.company) || "Unknown"
        industryIssues.set(industry, (industryIssues.get(industry) || 0) + 1)
      }
    })
    
    // Count contacts with missing fields by industry
    missingIndustryContacts.forEach((contact: any) => {
      if (!contactsWithIssues.has(contact._id.toString())) {
        contactsWithIssues.add(contact._id.toString())
        const industry = industryMap.get(contact.company) || "Unknown"
        industryIssues.set(industry, (industryIssues.get(industry) || 0) + 1)
      }
    })
    
    // Count duplicates by industry
    allContacts.forEach((contact: any) => {
      if (duplicateIds.has(contact._id.toString()) && !contactsWithIssues.has(contact._id.toString())) {
        contactsWithIssues.add(contact._id.toString())
        const industry = contact.industry || industryMap.get(contact.company) || "Unknown"
        industryIssues.set(industry, (industryIssues.get(industry) || 0) + 1)
      }
    })

    // Convert to array and ensure all default industries are present
    const data = Array.from(industryIssues.entries())
      .map(([industry, issues]) => ({
        industry,
        issues,
      }))
      .filter(item => item.industry !== "Unknown" || item.issues > 0) // Only show Unknown if it has issues
      .sort((a, b) => {
        // Sort by issues count (descending), then alphabetically
        if (b.issues !== a.issues) return b.issues - a.issues
        return a.industry.localeCompare(b.industry)
      })

    // Ensure we always return at least the default industries
    if (data.length === 0) {
      return NextResponse.json(DEFAULT_INDUSTRIES.map(industry => ({ industry, issues: 0 })))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error calculating issues by industry:", error)
    // Return default industries with 0 issues on error
    return NextResponse.json(DEFAULT_INDUSTRIES.map(industry => ({ industry, issues: 0 })))
  }
}