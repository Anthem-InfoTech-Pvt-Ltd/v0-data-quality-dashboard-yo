import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Contact } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const contacts = await db.collection<Contact>("contacts").find({}).toArray()
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { action, ids } = body

    if (action === "merge" && Array.isArray(ids) && ids.length >= 2) {
      // Merge duplicates - keep first, delete others
      const [keepId, ...deleteIds] = ids
      await db.collection("contacts").deleteMany({ _id: { $in: deleteIds.map((id: string) => new ObjectId(id)) } })
      await db.collection("contacts").updateOne(
        { _id: new ObjectId(keepId) },
        { $set: { isDuplicate: false } }
      )
      return NextResponse.json({ success: true, message: `Merged ${ids.length} duplicate records` })
    }

    if (action === "assign" && Array.isArray(ids) && ids.length > 0) {
      // Assign leads
      await db.collection("contacts").updateMany(
        { _id: { $in: ids.map((id: string) => new ObjectId(id)) } },
        { $set: { isAssigned: true } }
      )
      return NextResponse.json({ success: true, message: `Assigned ${ids.length} leads` })
    }

    if (action === "update" && Array.isArray(ids) && ids.length > 0) {
      // Update missing fields
      await db.collection("contacts").updateMany(
        { _id: { $in: ids.map((id: string) => new ObjectId(id)) } },
        { $set: { hasMissingFields: false } }
      )
      return NextResponse.json({ success: true, message: `Updated ${ids.length} records` })
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 })
  } catch (error) {
    console.error("Error processing contacts:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

