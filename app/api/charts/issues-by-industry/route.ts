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

    // Get contacts with issues
    const contacts = await db.collection("contacts").find({
      $or: [{ isDuplicate: true }, { isAssigned: false }, { hasMissingFields: true }],
    }).toArray()

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

