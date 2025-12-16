import { NextResponse, NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    const db = await getDatabase()
    
    // Get total count for pagination info
    const totalCount = await db.collection("contacts").countDocuments({ owner_id: null })
    
    // Get paginated results
    const contacts = await db.collection("contacts")
      .find({ owner_id: null })
      .sort({ created_date: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const hasMore = skip + limit < totalCount
    
    return NextResponse.json({
      data: contacts,
      page,
      limit,
      totalCount,
      hasMore,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (error) {
    console.error("Error fetching unassigned contacts:", error)
    return NextResponse.json({ error: "Failed to fetch unassigned contacts" }, { status: 500 })
  }
}

