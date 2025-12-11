"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function IssuesByIndustryChart() {
  const data = [
    { industry: "Technology", issues: 8 },
    { industry: "Finance", issues: 6 },
    { industry: "Healthcare", issues: 7 },
    { industry: "Retail", issues: 4 },
    { industry: "Manufacturing", issues: 5 },
  ]

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
