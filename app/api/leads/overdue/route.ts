import { NextResponse, NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Lead } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const db = await getDatabase()
    
    // Get total count for pagination info
    const totalCount = await db.collection<Lead>("leads").countDocuments({ daysOverdue: { $gt: 0 } })
    
    // Get paginated leads that are overdue (>24 hours = daysOverdue > 0)
    const overdueLeads = await db.collection<Lead>("leads")
      .find({ daysOverdue: { $gt: 0 } })
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    // Enrich leads with contact email information
    const enrichedLeads = await Promise.all(
      overdueLeads.map(async (lead) => {
        const nameParts = lead.fullName.split(" ")
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(" ")

        const contact = await db.collection("contacts").findOne({
          first_name: firstName,
          last_name: lastName,
          company: lead.company,
        })

        return {
          ...lead,
          email: contact?.email || null,
        }
      })
    )
    
    const hasMore = skip + limit < totalCount
    
    // For backwards compatibility, check if client expects paginated response
    const wantsPagination = searchParams.has('page') || searchParams.has('limit')
    
    if (wantsPagination) {
      return NextResponse.json({
        data: enrichedLeads,
        page,
        limit,
        totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit)
      })
    } else {
      // Return all leads for dashboard (backwards compatibility)
      const allOverdueLeads = await db.collection<Lead>("leads")
        .find({ daysOverdue: { $gt: 0 } })
        .sort({ createdDate: -1 })
        .limit(10) // Limit to 10 for dashboard
        .toArray()
      
      const allEnrichedLeads = await Promise.all(
        allOverdueLeads.map(async (lead) => {
          const nameParts = lead.fullName.split(" ")
          const firstName = nameParts[0]
          const lastName = nameParts.slice(1).join(" ")

          const contact = await db.collection("contacts").findOne({
            first_name: firstName,
            last_name: lastName,
            company: lead.company,
          })

          return {
            ...lead,
            email: contact?.email || null,
          }
        })
      )
      
      return NextResponse.json(allEnrichedLeads)
    }
  } catch (error) {
    console.error("Error fetching overdue leads:", error)
    return NextResponse.json({ error: "Failed to fetch overdue leads" }, { status: 500 })
  }
}

