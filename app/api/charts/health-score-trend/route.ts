import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Store health score history in memory with proper initialization
const initializeHistory = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return days.map(day => ({ day, score: 75 })) // Start with baseline score
}

let healthScoreHistory: { day: string; score: number }[] = initializeHistory()
let lastCalculatedScore: number | null = null

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Calculate current health score based on real data
    const totalContacts = await db.collection("contacts").countDocuments({})
    
    if (totalContacts === 0) {
      // Return default history if no data
      return NextResponse.json(healthScoreHistory)
    }

    // Count actual issues using the same logic as metrics API
    const [
      duplicateContacts,
      unassignedCount,
      missingFieldsCount,
      overdueLeadsCount
    ] = await Promise.all([
      // Count duplicates more accurately
      db.collection("contacts").aggregate([
        {
          $group: {
            _id: {
              $toLower: {
                $replaceAll: {
                  input: { $split: ["$email", "@"] },
                  find: "+",
                  replacement: ""
                }
              }
            },
            count: { $sum: 1 },
            docs: { $push: "$$ROOT" }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        },
        {
          $unwind: "$docs"
        },
        {
          $replaceRoot: { newRoot: "$docs" }
        }
      ]).toArray(),
      db.collection("contacts").countDocuments({ owner_id: null }),
      db.collection("contacts").countDocuments({ industry: null }),
      db.collection("leads").countDocuments({ daysOverdue: { $gt: 0 } })
    ])
    
    const duplicates = duplicateContacts.length
    
    // Calculate health score (100 = perfect, 0 = worst)
    let score = 100
    
    // Deduct points for issues (weighted by severity)
    if (totalContacts > 0) {
      const duplicatePenalty = Math.min(25, (duplicates / totalContacts) * 100)
      const unassignedPenalty = Math.min(25, (unassignedCount / totalContacts) * 100)
      const missingFieldsPenalty = Math.min(20, (missingFieldsCount / totalContacts) * 80)
      const overduePenalty = Math.min(30, (overdueLeadsCount / 10) * 30)
      
      score = Math.round(100 - duplicatePenalty - unassignedPenalty - missingFieldsPenalty - overduePenalty)
      score = Math.max(0, Math.min(100, score))
    }
    
    // Update history only if score changed significantly (>2 points)
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1 // Sunday = 6, Monday = 0
    
    if (lastCalculatedScore === null || Math.abs(score - lastCalculatedScore) > 2) {
      // Score changed, update today's entry
      healthScoreHistory[todayIndex].score = score
      lastCalculatedScore = score
      
      // Smooth out the trend for previous days
      for (let i = todayIndex - 1, count = 1; count < 7; i--, count++) {
        const index = i < 0 ? i + 7 : i
        const prevScore = healthScoreHistory[index].score
        // Gradually approach today's score
        const targetScore = score - (count * 2) // Slight downward trend to today
        healthScoreHistory[index].score = Math.round((prevScore + targetScore) / 2)
      }
    }

    return NextResponse.json(healthScoreHistory)
  } catch (error) {
    console.error("Error calculating health score trend:", error)
    // Return last known good data or default
    return NextResponse.json(healthScoreHistory.length > 0 ? healthScoreHistory : initializeHistory())
  }
}

// Reset endpoint for when demo is reset
export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body.action === "reset") {
      healthScoreHistory = initializeHistory()
      lastCalculatedScore = null
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 })
  }
}