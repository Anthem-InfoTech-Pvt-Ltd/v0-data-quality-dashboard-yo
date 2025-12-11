import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const contacts = await db.collection("contacts").find({ industry: null }).toArray()
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching contacts with missing fields:", error)
    return NextResponse.json({ error: "Failed to fetch contacts with missing fields" }, { status: 500 })
  }
}

