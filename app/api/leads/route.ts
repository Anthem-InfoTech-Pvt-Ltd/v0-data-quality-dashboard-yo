import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Lead } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const leads = await db.collection<Lead>("leads").find({}).sort({ createdDate: -1 }).toArray()
    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { action, leadId } = body

    if (action === "send-alert" && leadId) {
      // Simulate sending email alert
      return NextResponse.json({ success: true, message: "Email alert sent" })
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 })
  } catch (error) {
    console.error("Error processing lead:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

