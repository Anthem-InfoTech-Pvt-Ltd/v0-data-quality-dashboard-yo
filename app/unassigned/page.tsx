"use client"

import { motion } from "framer-motion"
import { ArrowLeft, UserX, UserPlus, Mail, Send } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import InfiniteScroll from "react-infinite-scroll-component"

interface Contact {
  _id: string
  email: string
  first_name: string
  last_name: string
  company: string
  industry: string | null
  owner_id: string | null
  owner_name: string | null
  created_date: string
}

interface PaginatedResponse {
  data: Contact[]
  page: number
  limit: number
  totalCount: number
  hasMore: boolean
  totalPages: number
}

export default function UnassignedPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingAlerts, setIsSendingAlerts] = useState(false)
  const [emailAlertLoading, setEmailAlertLoading] = useState<string | null>(null)
  const [unassignedRecords, setUnassignedRecords] = useState<Contact[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchContacts = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    try {
      const res = await fetch(`/api/contacts/unassigned?page=${pageNum}&limit=50`)
      const response: PaginatedResponse = await res.json()
      
      if (isInitial) {
        setUnassignedRecords(response.data)
      } else {
        setUnassignedRecords(prev => [...prev, ...response.data])
      }
      
      setHasMore(response.hasMore)
      setTotalCount(response.totalCount)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      toast({
        title: "Error",
        description: "Failed to load unassigned records",
        variant: "destructive",
      })
    } finally {
      if (isInitial) {
        setIsFetching(false)
      }
    }
  }, [toast])

  useEffect(() => {
    fetchContacts(1, true)
  }, [fetchContacts])

  const loadMore = () => {
    fetchContacts(page + 1)
  }

  const handleSelectAll = () => {
    if (selectedRecords.length === unassignedRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(unassignedRecords.map((r) => r._id))
    }
  }

  const handleSelectRecord = (id: string) => {
    setSelectedRecords((prev) => (prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]))
  }

  const handleAssignLeads = async () => {
    if (selectedRecords.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least 1 lead to assign.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", ids: selectedRecords }),
      })

      if (!res.ok) {
        throw new Error("Failed to assign leads")
      }

      // Refresh contacts from the beginning
      setUnassignedRecords([])
      setPage(1)
      await fetchContacts(1, true)

      toast({
        title: "Leads Assigned",
        description: `Successfully assigned ${selectedRecords.length} leads to sales team.`,
      })

      setSelectedRecords([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign leads",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmailAlert = async (contactId: string, contactName: string, contactEmail: string) => {
    setEmailAlertLoading(contactId)
    try {
      const response = await fetch("/api/contacts/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      })
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Email Alert Sent",
          description: `Alert sent to ${contactEmail}`,
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

  const handleSendBulkAlerts = async () => {
    if (selectedRecords.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least 1 contact to send alerts.",
        variant: "destructive",
      })
      return
    }

    // Check if all selected contacts have email addresses
    const selectedContacts = unassignedRecords.filter(r => selectedRecords.includes(r._id))
    const contactsWithoutEmail = selectedContacts.filter(c => !c.email)
    
    if (contactsWithoutEmail.length > 0) {
      toast({
        title: "Email Missing",
        description: `${contactsWithoutEmail.length} selected contact(s) don't have email addresses.`,
        variant: "destructive",
      })
      return
    }

    setIsSendingAlerts(true)
    try {
      const response = await fetch("/api/contacts/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedRecords }),
      })
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Email Alerts Sent",
          description: result.message,
        })
        setSelectedRecords([])
      } else {
        throw new Error(result.error || result.message || "Failed to send emails")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email alerts",
        variant: "destructive",
      })
    } finally {
      setIsSendingAlerts(false)
    }
  }

  if (isFetching) {
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
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <UserX className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-balance">Unassigned Leads</h1>
                <p className="text-muted-foreground">
                  {totalCount} leads waiting for assignment to sales representatives
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Unassigned Lead Records</CardTitle>
                    <CardDescription>Select leads to assign to your sales team or send email alerts</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSelectAll}>
                      {selectedRecords.length === unassignedRecords.length && unassignedRecords.length > 0 
                        ? "Deselect All" 
                        : `Select All (${unassignedRecords.length})`}
                    </Button>
                    <Button
                      onClick={handleSendBulkAlerts}
                      disabled={isSendingAlerts || selectedRecords.length === 0}
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSendingAlerts ? "Sending..." : `Send Alerts (${selectedRecords.length})`}
                    </Button>
                    <Button
                      onClick={handleAssignLeads}
                      disabled={isLoading || selectedRecords.length === 0}
                      className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isLoading ? "Assigning..." : `Assign Selected (${selectedRecords.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <InfiniteScroll
                  dataLength={unassignedRecords.length}
                  next={loadMore}
                  hasMore={hasMore}
                  loader={
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }
                  endMessage={
                    unassignedRecords.length > 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        All {totalCount} unassigned records loaded
                      </div>
                    )
                  }
                  style={{ overflow: 'visible' }}
                >
                  <div className="space-y-3">
                    {unassignedRecords.map((record, index) => (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(0.3 + (index % 10) * 0.05, 0.8), duration: 0.3 }}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedRecords.includes(record._id)}
                          onCheckedChange={() => handleSelectRecord(record._id)}
                        />
                        <div className="flex-1 grid sm:grid-cols-4 gap-4">
                          <div>
                            <p className="font-medium">{record.first_name} {record.last_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{record.email}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{record.company}</p>
                            <p className="text-sm text-muted-foreground">Company</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300"
                            >
                              Unassigned
                            </Badge>
                            {!record.industry && <Badge variant="outline">Missing Industry</Badge>}
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendEmailAlert(
                                record._id, 
                                `${record.first_name} ${record.last_name}`,
                                record.email
                              )}
                              disabled={emailAlertLoading === record._id || !record.email}
                              title={!record.email ? "Email address not available" : `Send alert to ${record.email}`}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              {emailAlertLoading === record._id ? "Sending..." : "Send Alert"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </InfiniteScroll>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  )
}