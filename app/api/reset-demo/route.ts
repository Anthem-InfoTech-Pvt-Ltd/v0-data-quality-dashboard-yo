import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { seedDatabase } from "@/lib/seed-data"

export async function POST(request: Request) {
  try {
    // Get database connection
    const db = await getDatabase()
    
    // Seed the database directly (no child process needed)
    const result = await seedDatabase(db)
    
    // Reset chart histories by calling their reset endpoints
    // On Vercel, we need to construct the URL properly
    let baseUrl = 'http://localhost:3000'
    
    if (process.env.VERCEL_URL) {
      // Vercel provides VERCEL_URL (e.g., "my-app.vercel.app")
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.NEXT_PUBLIC_URL) {
      baseUrl = process.env.NEXT_PUBLIC_URL
    } else {
      // Try to get from request headers (for serverless functions)
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      if (host) {
        baseUrl = `${protocol}://${host}`
      }
    }
    
    // Reset chart histories (non-blocking - charts will recalculate from DB anyway)
    // We fire and forget these requests since charts will recalculate from fresh DB data
    try {
      // Use setTimeout to create a timeout for fetch requests
      const fetchWithTimeout = (url: string, options: RequestInit, timeout = 5000) => {
        return Promise.race([
          fetch(url, options),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]).catch(() => null)
      }
      
      // Fire and forget - don't block the response
      Promise.all([
        fetchWithTimeout(`${baseUrl}/api/charts/health-score-trend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        }).catch(() => null),
        fetchWithTimeout(`${baseUrl}/api/charts/weekly-activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        }).catch(() => null)
      ]).catch(() => {
        // Silently fail - charts will recalculate from fresh DB data
      })
    } catch (error) {
      // Chart reset is non-critical - charts recalculate from database
      console.log("Chart reset skipped (non-critical)")
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Demo data has been reset successfully",
      summary: result.summary
    })
  } catch (error: any) {
    console.error("Error resetting demo data:", error)
    return NextResponse.json(
      { 
        error: "Failed to reset demo data", 
        details: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}