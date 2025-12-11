"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function HealthScoreTrendChart() {
  const data = [
    { day: "Mon", score: 72 },
    { day: "Tue", score: 75 },
    { day: "Wed", score: 71 },
    { day: "Thu", score: 78 },
    { day: "Fri", score: 76 },
    { day: "Sat", score: 79 },
    { day: "Sun", score: 74 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Score Trend</CardTitle>
        <CardDescription>Last 7 days performance</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="day" className="text-xs" />
            <YAxis domain={[0, 100]} className="text-xs" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 6 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
