import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Lead } from "@/lib/models"

export async function GET() {
  try {
    const db = await getDatabase()
    // Get leads that are overdue (>24 hours = daysOverdue > 0)
    const overdueLeads = await db.collection<Lead>("leads").find({ daysOverdue: { $gt: 0 } }).sort({ createdDate: -1 }).toArray()
    return NextResponse.json(overdueLeads)
  } catch (error) {
    console.error("Error fetching overdue leads:", error)
    return NextResponse.json({ error: "Failed to fetch overdue leads" }, { status: 500 })
  }
}

