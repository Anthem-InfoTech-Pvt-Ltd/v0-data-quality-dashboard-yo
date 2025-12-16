import { NextResponse } from "next/server"
import { spawn } from "child_process"
import * as path from "path"

export async function POST() {
  try {
    // Clear the in-memory chart histories by making a request to a special endpoint
    // This ensures charts reset too
    
    return new Promise((resolve) => {
      const scriptPath = path.join(process.cwd(), "scripts", "seed.ts")
      
      // Use spawn instead of execSync for better error handling
      const child = spawn("npx", ["tsx", scriptPath], {
        cwd: process.cwd(),
        shell: true,
        env: process.env
      })
      
      let output = ""
      let errorOutput = ""
      
      child.stdout.on("data", (data) => {
        output += data.toString()
        console.log("Seed output:", data.toString())
      })
      
      child.stderr.on("data", (data) => {
        errorOutput += data.toString()
        console.error("Seed error:", data.toString())
      })
      
      child.on("close", async (code) => {
        if (code === 0) {
          // Reset chart histories by calling their reset endpoints
          try {
            await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/charts/health-score-trend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' })
              }),
              fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/charts/weekly-activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' })
              })
            ])
          } catch (error) {
            console.log("Could not reset chart histories:", error)
          }
          
          resolve(
            NextResponse.json({ 
              success: true, 
              message: "Demo data has been reset successfully",
              output: output 
            })
          )
        } else {
          console.error("Seed script failed with code:", code)
          console.error("Error output:", errorOutput)
          resolve(
            NextResponse.json(
              { 
                error: "Failed to reset demo data", 
                details: errorOutput || "Unknown error",
                code: code 
              },
              { status: 500 }
            )
          )
        }
      })
      
      child.on("error", (err) => {
        console.error("Failed to start seed script:", err)
        resolve(
          NextResponse.json(
            { error: "Failed to start seed script", details: err.message },
            { status: 500 }
          )
        )
      })
    })
  } catch (error: any) {
    console.error("Error resetting demo data:", error)
    return NextResponse.json(
      { error: "Failed to reset demo data", details: error.message },
      { status: 500 }
    )
  }
}