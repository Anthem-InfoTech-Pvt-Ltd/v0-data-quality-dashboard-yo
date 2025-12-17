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
          email_alert_sent_at: contact?.email_alert_sent_at || null,
        }
      })
    )
    
    // Filter out leads where email alert has already been sent
    const filteredLeads = enrichedLeads.filter(lead => !lead.email_alert_sent_at)
    
    const hasMore = skip + limit < totalCount
    
    // For backwards compatibility, check if client expects paginated response
    const wantsPagination = searchParams.has('page') || searchParams.has('limit')
    
    if (wantsPagination) {
      // Update totalCount to reflect filtered results
      const filteredTotalCount = filteredLeads.length
      const filteredHasMore = skip + limit < filteredTotalCount
      
      return NextResponse.json({
        data: filteredLeads,
        page,
        limit,
        totalCount: filteredTotalCount,
        hasMore: filteredHasMore,
        totalPages: Math.ceil(filteredTotalCount / limit)
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
            email_alert_sent_at: contact?.email_alert_sent_at || null,
          }
        })
      )
      
      // Filter out leads where email alert has already been sent
      const filteredLeads = allEnrichedLeads.filter(lead => !lead.email_alert_sent_at)
      
      return NextResponse.json(filteredLeads)
    }
  } catch (error) {
    console.error("Error fetching overdue leads:", error)
    return NextResponse.json({ error: "Failed to fetch overdue leads" }, { status: 500 })
  }
}

