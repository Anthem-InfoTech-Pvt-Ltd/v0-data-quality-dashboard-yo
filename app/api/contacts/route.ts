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
      return NextResponse.json({ success: true, message: `Merged ${ids.length} duplicate records` })
    }

    if (action === "assign" && Array.isArray(ids) && ids.length > 0) {
      // Assign leads - assign to a random sales owner
      const salesOwners = [
        { id: "owner-1", name: "Alex Thompson" },
        { id: "owner-2", name: "Maria Garcia" },
        { id: "owner-3", name: "David Chen" },
        { id: "owner-4", name: "Sarah Johnson" },
        { id: "owner-5", name: "Michael Brown" },
      ]
      
      // Assign each contact to a random owner
      for (const id of ids) {
        const owner = salesOwners[Math.floor(Math.random() * salesOwners.length)]
        await db.collection("contacts").updateOne(
          { _id: new ObjectId(id) },
          { $set: { owner_id: owner.id, owner_name: owner.name } }
        )
      }
      
      return NextResponse.json({ success: true, message: `Assigned ${ids.length} leads` })
    }

    if (action === "update" && Array.isArray(ids) && ids.length > 0) {
      // Update missing fields - assign industry from company
      const contacts = await db.collection("contacts").find({ _id: { $in: ids.map((id: string) => new ObjectId(id)) } }).toArray()
      const companies = await db.collection("companies").find({}).toArray()
      const companyIndustryMap = new Map<string, string | null>()
      
      companies.forEach((company: any) => {
        companyIndustryMap.set(company.name, company.industry)
      })
      
      for (const contact of contacts) {
        const industry = companyIndustryMap.get(contact.company) || "Technology" // Default fallback
        await db.collection("contacts").updateOne(
          { _id: contact._id },
          { $set: { industry } }
        )
      }
      
      return NextResponse.json({ success: true, message: `Updated ${ids.length} records` })
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 })
  } catch (error) {
    console.error("Error processing contacts:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
