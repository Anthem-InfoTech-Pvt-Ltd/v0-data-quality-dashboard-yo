import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { EmailAlert } from "@/lib/models"

export async function GET() {
  try {
    const db = await getDatabase()
    const emailAlerts = await db.collection<EmailAlert>("emailAlerts").find({}).sort({ timestamp: -1 }).toArray()
    return NextResponse.json(emailAlerts)
  } catch (error) {
    console.error("Error fetching email alerts:", error)
    return NextResponse.json({ error: "Failed to fetch email alerts" }, { status: 500 })
  }
}

