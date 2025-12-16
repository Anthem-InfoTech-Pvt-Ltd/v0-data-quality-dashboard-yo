"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"

export function IssuesByIndustryChart() {
  // Initialize with default industries to prevent chart from disappearing
  const defaultData = [
    { industry: "Technology", issues: 0 },
    { industry: "Finance", issues: 0 },
    { industry: "Healthcare", issues: 0 },
    { industry: "Retail", issues: 0 },
    { industry: "Manufacturing", issues: 0 }
  ]
  
  const [data, setData] = useState<{ industry: string; issues: number }[]>(defaultData)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/charts/issues-by-industry")
        const chartData = await res.json()
        // If we have data, use it; otherwise keep the default structure
        if (chartData && chartData.length > 0) {
          setData(chartData)
        } else {
          // Keep default structure but with zero values
          setData(defaultData)
        }
      } catch (error) {
        console.error("Error fetching issues by industry:", error)
        // Keep default structure on error
        setData(defaultData)
      }
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues by Industry</CardTitle>
        <CardDescription>Data quality issues grouped by industry</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="industry" className="text-xs" angle={-15} textAnchor="end" height={80} />
            <YAxis className="text-xs" />
            <Tooltip />
            <Bar dataKey="issues" fill="#f59e0b" radius={[8, 8, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
