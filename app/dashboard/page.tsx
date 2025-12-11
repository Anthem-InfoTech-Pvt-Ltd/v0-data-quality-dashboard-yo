"use client"

import { motion } from "framer-motion"
import { Database, Mail, Merge, Sparkles, UserPlus, UserX, XCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HealthScoreCircle } from "@/components/health-score-circle"
import { calculateHealthScore, metrics, overdueLeads } from "@/lib/demo-data"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DataQualityPieChart } from "@/components/charts/data-quality-pie"
import { HealthScoreTrendChart } from "@/components/charts/health-score-trend"
import { IssuesByIndustryChart } from "@/components/charts/issues-by-industry"
import { WeeklyActivityChart } from "@/components/charts/weekly-activity"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DashboardPage() {
  const healthScore = calculateHealthScore()
  const { toast } = useToast()
  const router = useRouter()
  const [isDedupeLoading, setIsDedupeLoading] = useState(false)
  const [isReassignLoading, setIsReassignLoading] = useState(false)
  const [emailAlertLoading, setEmailAlertLoading] = useState<string | null>(null)

  const handleRunDedupe = async () => {
    setIsDedupeLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDedupeLoading(false)
    toast({
      title: "Deduplication Complete",
      description: "Successfully identified and merged duplicate records.",
    })
  }

  const handleReassignLeads = async () => {
    setIsReassignLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsReassignLoading(false)
    toast({
      title: "Leads Reassigned",
      description: "Successfully reassigned unassigned leads to sales team.",
    })
  }

  const handleSendEmailAlert = async (leadId: string, leadName: string) => {
    setEmailAlertLoading(leadId)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setEmailAlertLoading(null)
    toast({
      title: "Email Alert Sent",
      description: `Assignment reminder sent for ${leadName}`,
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header />

        <main className="container px-4 py-8 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-bold mb-2 text-balance">Data Quality Dashboard</h1>
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
                        <TableHead>Company</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead className="text-center">Days Overdue</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.fullName}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.createdDate.toLocaleDateString()}</TableCell>
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
                              onClick={() => handleSendEmailAlert(lead.id, lead.fullName)}
                              disabled={emailAlertLoading === lead.id}
                            >
                              <Mail className="w-4 h-4" />
                              {emailAlertLoading === lead.id ? "Sending..." : "Send Email Alert"}
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
