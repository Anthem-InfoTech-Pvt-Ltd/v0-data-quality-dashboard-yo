"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"

export function WeeklyActivityChart() {
  // Initialize with default data to prevent empty chart
  const defaultData = [
    { day: "Mon", detected: 0, resolved: 0 },
    { day: "Tue", detected: 0, resolved: 0 },
    { day: "Wed", detected: 0, resolved: 0 },
    { day: "Thu", detected: 0, resolved: 0 },
    { day: "Fri", detected: 0, resolved: 0 },
    { day: "Sat", detected: 0, resolved: 0 },
    { day: "Sun", detected: 0, resolved: 0 }
  ]
  
  const [data, setData] = useState<{ day: string; resolved: number; detected: number }[]>(defaultData)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/charts/weekly-activity")
        const chartData = await res.json()
        if (chartData && Array.isArray(chartData) && chartData.length > 0) {
          setData(chartData)
        } else {
          // Keep default structure if no data
          setData(defaultData)
        }
      } catch (error) {
        console.error("Error fetching weekly activity:", error)
        // Keep default structure on error
        setData(defaultData)
      }
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
        <CardDescription>Issues detected vs resolved</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="day" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="detected"
              stackId="1"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stackId="2"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
