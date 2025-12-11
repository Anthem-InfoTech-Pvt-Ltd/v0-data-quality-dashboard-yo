import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Metrics } from "@/lib/models"

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

