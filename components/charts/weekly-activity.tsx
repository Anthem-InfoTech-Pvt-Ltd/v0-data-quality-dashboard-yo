"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function WeeklyActivityChart() {
  const data = [
    { day: "Mon", resolved: 12, detected: 18 },
    { day: "Tue", resolved: 15, detected: 21 },
    { day: "Wed", resolved: 18, detected: 16 },
    { day: "Thu", resolved: 14, detected: 19 },
    { day: "Fri", resolved: 20, detected: 22 },
    { day: "Sat", resolved: 8, detected: 10 },
    { day: "Sun", resolved: 6, detected: 8 },
  ]

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
