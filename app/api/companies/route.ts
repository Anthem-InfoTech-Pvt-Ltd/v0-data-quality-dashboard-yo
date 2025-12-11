import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Company } from "@/lib/models"

export async function GET() {
  try {
    const db = await getDatabase()
    const companies = await db.collection<Company>("companies").find({}).toArray()
    return NextResponse.json(companies)
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}

