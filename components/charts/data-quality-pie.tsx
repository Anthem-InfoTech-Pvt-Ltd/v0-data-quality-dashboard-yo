"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useEffect, useState } from "react"

interface Metrics {
  duplicates: number
  unassignedLeads: number
  missingFields: number
  totalContacts: number
  overdueLeads: number
}

export function DataQualityPieChart() {
  const [metrics, setMetrics] = useState<Metrics>({
    duplicates: 0,
    unassignedLeads: 0,
    missingFields: 0,
    totalContacts: 0,
    overdueLeads: 0,
  })

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/metrics")
        const data = await res.json()
        setMetrics(data)
      } catch (error) {
        console.error("Error fetching metrics:", error)
      }
    }
    fetchMetrics()
  }, [])

  const data = [
    {
      name: "Healthy Records",
      value: metrics.totalContacts - metrics.duplicates - metrics.missingFields - metrics.unassignedLeads,
    },
    { name: "Duplicates", value: metrics.duplicates },
    { name: "Unassigned", value: metrics.unassignedLeads },
    { name: "Missing Fields", value: metrics.missingFields },
  ]

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality Distribution</CardTitle>
        <CardDescription>Breakdown of data quality issues</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
