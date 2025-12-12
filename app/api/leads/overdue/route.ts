import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Lead } from "@/lib/models"

export async function GET() {
  try {
    const db = await getDatabase()
    // Get leads that are overdue (>24 hours = daysOverdue > 0)
    const overdueLeads = await db.collection<Lead>("leads").find({ daysOverdue: { $gt: 0 } }).sort({ createdDate: -1 }).toArray()
    
    // Enrich leads with contact email information
    const enrichedLeads = await Promise.all(
      overdueLeads.map(async (lead) => {
        const nameParts = lead.fullName.split(" ")
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(" ")

        const contact = await db.collection("contacts").findOne({
          first_name: firstName,
          last_name: lastName,
          company: lead.company,
        })

        return {
          ...lead,
          email: contact?.email || null,
        }
      })
    )
    
    return NextResponse.json(enrichedLeads)
  } catch (error) {
    console.error("Error fetching overdue leads:", error)
    return NextResponse.json({ error: "Failed to fetch overdue leads" }, { status: 500 })
  }
}

