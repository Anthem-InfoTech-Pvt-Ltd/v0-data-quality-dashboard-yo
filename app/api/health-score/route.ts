import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    
    const [duplicates, unassignedLeads, missingFields, totalContacts, overdueLeads] = await Promise.all([
      db.collection("contacts").countDocuments({ isDuplicate: true }),
      db.collection("contacts").countDocuments({ isAssigned: false }),
      db.collection("contacts").countDocuments({ hasMissingFields: true }),
      db.collection("contacts").countDocuments({}),
      db.collection("leads").countDocuments({ daysOverdue: { $gt: 0 } }),
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

