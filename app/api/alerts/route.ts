import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Alert } from "@/lib/models"

export async function GET() {
  try {
    const db = await getDatabase()
    const alerts = await db.collection<Alert>("alerts").find({}).sort({ timestamp: -1 }).toArray()
    return NextResponse.json(alerts)
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

