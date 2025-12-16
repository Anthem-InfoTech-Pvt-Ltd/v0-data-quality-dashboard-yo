"use client"

import { motion } from "framer-motion"
import { Database, Mail, Merge, Sparkles, UserPlus, UserX, XCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HealthScoreCircle } from "@/components/health-score-circle"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { DataQualityPieChart } from "@/components/charts/data-quality-pie"
import { HealthScoreTrendChart } from "@/components/charts/health-score-trend"
import { IssuesByIndustryChart } from "@/components/charts/issues-by-industry"
import { WeeklyActivityChart } from "@/components/charts/weekly-activity"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Metrics {
  duplicates: number
  unassignedLeads: number
  missingFields: number
  totalContacts: number
  overdueLeads: number
}

interface OverdueLead {
  _id: string
  fullName: string
  company: string
  createdDate: string
  daysOverdue: number
  email?: string | null
}

export default function DashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [healthScore, setHealthScore] = useState(0)
  const [metrics, setMetrics] = useState<Metrics>({
    duplicates: 0,
    unassignedLeads: 0,
    missingFields: 0,
    totalContacts: 0,
    overdueLeads: 0,
  })
  const [overdueLeads, setOverdueLeads] = useState<OverdueLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDedupeLoading, setIsDedupeLoading] = useState(false)
  const [isReassignLoading, setIsReassignLoading] = useState(false)
  const [emailAlertLoading, setEmailAlertLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, healthScoreRes, overdueLeadsRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/health-score"),
          fetch("/api/leads/overdue"),
        ])

        const metricsData = await metricsRes.json()
        const healthScoreData = await healthScoreRes.json()
        const overdueLeadsData = await overdueLeadsRes.json()

        setMetrics(metricsData)
        setHealthScore(healthScoreData.score)
        setOverdueLeads(overdueLeadsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleRunDedupe = async () => {
    setIsDedupeLoading(true)
    try {
      // Get ALL duplicate contacts - set a high limit to get everything
      const contactsRes = await fetch("/api/contacts/duplicates?page=1&limit=10000")
      const response = await contactsRes.json()
      
      // Handle paginated response
      const duplicates = response.data || response
      const duplicateIds = duplicates.map((c: any) => c._id)

      if (duplicateIds.length < 2) {
        toast({
          title: "No Duplicates",
          description: "No duplicate records found to merge.",
        })
        setIsDedupeLoading(false)
        return
      }

      // Merge ALL duplicates collectively
      const mergeRes = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "merge", ids: duplicateIds }),
      })
      
      if (!mergeRes.ok) {
        throw new Error("Failed to merge duplicates")
      }

      // Refresh data
      const [metricsRes, healthScoreRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/health-score"),
      ])
      setMetrics(await metricsRes.json())
      setHealthScore((await healthScoreRes.json()).score)

      toast({
        title: "Deduplication Complete",
        description: `Successfully merged all ${duplicateIds.length} duplicate records.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run deduplication",
        variant: "destructive",
      })
    } finally {
      setIsDedupeLoading(false)
    }
  }

  const handleReassignLeads = async () => {
    setIsReassignLoading(true)
    try {
      // Get ALL unassigned contacts - set a high limit to get everything
      const contactsRes = await fetch("/api/contacts/unassigned?page=1&limit=10000")
      const response = await contactsRes.json()
      
      // Handle paginated response
      const unassigned = response.data || response
      const unassignedIds = unassigned.map((c: any) => c._id)

      if (unassignedIds.length === 0) {
        toast({
          title: "No Unassigned Leads",
          description: "All leads are already assigned.",
        })
        setIsReassignLoading(false)
        return
      }

      // Assign ALL leads collectively
      const assignRes = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", ids: unassignedIds }),
      })
      
      if (!assignRes.ok) {
        throw new Error("Failed to assign leads")
      }

      // Refresh data
      const [metricsRes, healthScoreRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/health-score"),
      ])
      setMetrics(await metricsRes.json())
      setHealthScore((await healthScoreRes.json()).score)

      toast({
        title: "Leads Reassigned",
        description: `Successfully reassigned all ${unassignedIds.length} leads to sales team.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reassign leads",
        variant: "destructive",
      })
    } finally {
      setIsReassignLoading(false)
    }
  }

  const handleSendEmailAlert = async (leadId: string, leadName: string, leadEmail?: string | null) => {
    setEmailAlertLoading(leadId)
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-alert", leadId }),
      })
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Email Alert Sent",
          description: leadEmail ? `Alert sent to ${leadEmail}` : `Assignment reminder sent for ${leadName}`,
        })
      } else {
        throw new Error(result.error || "Failed to send email")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email alert",
        variant: "destructive",
      })
    } finally {
      setEmailAlertLoading(null)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <Header />
          <main className="container px-4 py-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header />

        <main className="container px-4 py-8 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-bold mb-2 text-balance">Revenue Data Health Score: {healthScore}%</h1>
            <p className="text-muted-foreground mb-8">Monitor and maintain your revenue data health</p>
          </motion.div>

          {/* Health Score Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="mb-8 border-2 shadow-lg">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row items-center justify-between">
                  <div className="lg:w-1/3">
                    <HealthScoreCircle score={healthScore} />
                  </div>
                  <div className="flex-1 p-8 grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.duplicates}</div>
                        <div className="text-sm text-muted-foreground">Duplicates</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                        <UserX className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.unassignedLeads}</div>
                        <div className="text-sm text-muted-foreground">Unassigned Leads</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                        <Database className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.missingFields}</div>
                        <div className="text-sm text-muted-foreground">Missing Fields</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.totalContacts}</div>
                        <div className="text-sm text-muted-foreground">Total Contacts</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Module Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push("/duplicates")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-500 group-hover:scale-110 transition-transform" />
                    <Badge variant="destructive">
                      {((metrics.duplicates / metrics.totalContacts) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">Duplicates Detection</CardTitle>
                  <CardDescription>Identify and merge duplicate records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-500">{metrics.duplicates}</div>
                  <p className="text-sm text-muted-foreground mt-2">duplicates found across contacts and companies</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full bg-transparent"
                    onClick={() => router.push("/duplicates")}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push("/unassigned")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <UserX className="w-8 h-8 text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform" />
                    <Badge
                      variant="outline"
                      className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300"
                    >
                      {((metrics.unassignedLeads / metrics.totalContacts) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">Unassigned Leads</CardTitle>
                  <CardDescription>Leads waiting for assignment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">{metrics.unassignedLeads}</div>
                  <p className="text-sm text-muted-foreground mt-2">leads need immediate assignment</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full bg-transparent"
                    onClick={() => router.push("/unassigned")}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push("/missing-fields")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Database className="w-8 h-8 text-blue-600 dark:text-blue-500 group-hover:scale-110 transition-transform" />
                    <Badge
                      variant="outline"
                      className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300"
                    >
                      {((metrics.missingFields / metrics.totalContacts) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">Missing Fields</CardTitle>
                  <CardDescription>Records with incomplete data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{metrics.missingFields}</div>
                  <p className="text-sm text-muted-foreground mt-2">records missing critical information</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full bg-transparent"
                    onClick={() => router.push("/missing-fields")}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                      Alerts: Unassigned Leads &gt;24h
                    </CardTitle>
                    <CardDescription>Leads requiring immediate attention and assignment</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                  >
                    {overdueLeads.length} Overdue
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead className="text-center">Days Overdue</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueLeads.map((lead) => (
                        <TableRow key={lead._id}>
                          <TableCell className="font-medium">{lead.fullName}</TableCell>
                          <TableCell className="text-sm">{lead.email || "N/A"}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{new Date(lead.createdDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={lead.daysOverdue >= 5 ? "destructive" : "outline"}
                              className={
                                lead.daysOverdue >= 5
                                  ? ""
                                  : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300"
                              }
                            >
                              {lead.daysOverdue} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 bg-transparent"
                              onClick={() => handleSendEmailAlert(lead._id, lead.fullName, lead.email)}
                              disabled={emailAlertLoading === lead._id || !lead.email}
                              title={!lead.email ? "Contact email not found" : `Send email to ${lead.email}`}
                            >
                              <Mail className="w-4 h-4" />
                              {emailAlertLoading === lead._id ? "Sending..." : "Send Email Alert"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <DataQualityPieChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <HealthScoreTrendChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <IssuesByIndustryChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <WeeklyActivityChart />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Take immediate action on data issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    onClick={handleRunDedupe}
                    disabled={isDedupeLoading}
                  >
                    <Merge className="w-4 h-4 mr-2" />
                    {isDedupeLoading ? "Running..." : "Run Dedupe"}
                  </Button>

                  <Button
                    className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                    onClick={handleReassignLeads}
                    disabled={isReassignLoading}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isReassignLoading ? "Reassigning..." : "Reassign Leads"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
