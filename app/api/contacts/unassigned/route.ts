import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const contacts = await db.collection("contacts").find({ owner_id: null }).toArray()
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching unassigned contacts:", error)
    return NextResponse.json({ error: "Failed to fetch unassigned contacts" }, { status: 500 })
  }
}

