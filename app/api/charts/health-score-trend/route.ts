import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    // For now, return mock data. In production, you'd store historical health scores
    // and calculate trends from that data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const db = await getDatabase()
    
    // Calculate current health score
    const [duplicates, unassignedLeads, missingFields, totalContacts, overdueLeads] = await Promise.all([
      db.collection("contacts").countDocuments({ isDuplicate: true }),
      db.collection("contacts").countDocuments({ isAssigned: false }),
      db.collection("contacts").countDocuments({ hasMissingFields: true }),
      db.collection("contacts").countDocuments({}),
      db.collection("leads").countDocuments({ daysOverdue: { $gt: 0 } }),
    ])

    let currentScore = 100
    if (totalContacts > 0) {
      const duplicateScore = ((totalContacts - duplicates) / totalContacts) * 100
      const assignmentScore = ((totalContacts - unassignedLeads) / totalContacts) * 100
      const completenessScore = ((totalContacts - missingFields) / totalContacts) * 100
      const overdueScore = ((totalContacts - overdueLeads) / totalContacts) * 100
      currentScore = Math.round((duplicateScore + assignmentScore + completenessScore + overdueScore) / 4)
    }

    // Generate trend data with some variation around current score
    const data = days.map((day, index) => ({
      day,
      score: Math.max(0, Math.min(100, currentScore + Math.floor(Math.random() * 10) - 5)),
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error calculating health score trend:", error)
    return NextResponse.json({ error: "Failed to calculate health score trend" }, { status: 500 })
  }
}

