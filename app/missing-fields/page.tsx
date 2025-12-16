"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Database, RefreshCw } from "lucide-react"
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

const missingFieldTypes = ["Phone Number", "Job Title", "Address", "Revenue", "Industry"]

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

export default function MissingFieldsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [missingFieldRecords, setMissingFieldRecords] = useState<Contact[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchContacts = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    try {
      const res = await fetch(`/api/contacts/missing-fields?page=${pageNum}&limit=50`)
      const response: PaginatedResponse = await res.json()
      
      if (isInitial) {
        setMissingFieldRecords(response.data)
      } else {
        setMissingFieldRecords(prev => [...prev, ...response.data])
      }
      
      setHasMore(response.hasMore)
      setTotalCount(response.totalCount)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      toast({
        title: "Error",
        description: "Failed to load missing field records",
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
    if (selectedRecords.length === missingFieldRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(missingFieldRecords.map((r) => r._id))
    }
  }

  const handleSelectRecord = (id: string) => {
    setSelectedRecords((prev) => (prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]))
  }

  const handleUpdateFields = async () => {
    if (selectedRecords.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least 1 record to update.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", ids: selectedRecords }),
      })

      if (!res.ok) {
        throw new Error("Failed to update fields")
      }

      // Refresh contacts from the beginning
      setMissingFieldRecords([])
      setPage(1)
      await fetchContacts(1, true)

      toast({
        title: "Fields Updated",
        description: `Successfully enriched ${selectedRecords.length} records with missing data.`,
      })

      setSelectedRecords([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fields",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMissingFieldForRecord = (index: number) => {
    return missingFieldTypes[index % missingFieldTypes.length]
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
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-balance">Missing Fields Records</h1>
                <p className="text-muted-foreground">
                  {totalCount} records with incomplete data requiring enrichment
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
                    <CardTitle>Records with Missing Fields</CardTitle>
                    <CardDescription>Select records to enrich with missing data</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSelectAll}>
                      {selectedRecords.length === missingFieldRecords.length && missingFieldRecords.length > 0 
                        ? "Deselect All" 
                        : `Select All (${missingFieldRecords.length})`}
                    </Button>
                    <Button
                      onClick={handleUpdateFields}
                      disabled={isLoading || selectedRecords.length === 0}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {isLoading ? "Updating..." : `Update Selected (${selectedRecords.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <InfiniteScroll
                  dataLength={missingFieldRecords.length}
                  next={loadMore}
                  hasMore={hasMore}
                  loader={
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }
                  endMessage={
                    missingFieldRecords.length > 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        All {totalCount} missing field records loaded
                      </div>
                    )
                  }
                  style={{ overflow: 'visible' }}
                >
                  <div className="space-y-3">
                    {missingFieldRecords.map((record, index) => (
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
                        <div className="flex-1 grid sm:grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium">{record.first_name} {record.last_name}</p>
                            <p className="text-sm text-muted-foreground">{record.email}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{record.company}</p>
                            <p className="text-sm text-muted-foreground">Company</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300"
                            >
                              Missing: Industry
                            </Badge>
                            {!record.owner_id && <Badge variant="outline">Unassigned</Badge>}
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