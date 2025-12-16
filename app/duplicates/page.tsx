"use client"

import { motion } from "framer-motion"
import { ArrowLeft, XCircle, Merge } from "lucide-react"
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

export default function DuplicatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [duplicateRecords, setDuplicateRecords] = useState<Contact[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchContacts = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    try {
      const res = await fetch(`/api/contacts/duplicates?page=${pageNum}&limit=50`)
      const response: PaginatedResponse = await res.json()
      
      if (isInitial) {
        setDuplicateRecords(response.data)
      } else {
        setDuplicateRecords(prev => [...prev, ...response.data])
      }
      
      setHasMore(response.hasMore)
      setTotalCount(response.totalCount)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      toast({
        title: "Error",
        description: "Failed to load duplicate records",
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
    if (selectedRecords.length === duplicateRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(duplicateRecords.map((r) => r._id))
    }
  }

  const handleSelectRecord = (id: string) => {
    setSelectedRecords((prev) => (prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]))
  }

  const handleMergeDuplicates = async () => {
    if (selectedRecords.length < 2) {
      toast({
        title: "Selection Required",
        description: "Please select at least 2 records to merge.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "merge", ids: selectedRecords }),
      })

      if (!res.ok) {
        throw new Error("Failed to merge duplicates")
      }

      // Refresh contacts from the beginning
      setDuplicateRecords([])
      setPage(1)
      await fetchContacts(1, true)

      toast({
        title: "Duplicates Merged",
        description: `Successfully merged ${selectedRecords.length} duplicate records.`,
      })

      setSelectedRecords([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to merge duplicates",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-balance">Duplicate Detection Records</h1>
                <p className="text-muted-foreground">
                  {totalCount} duplicate records found across contacts and companies
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
                    <CardTitle>Duplicate Records</CardTitle>
                    <CardDescription>Select records to merge or manage</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className=" dark:text-white
   dark:hover:text-gray-500" onClick={handleSelectAll}>
                      {selectedRecords.length === duplicateRecords.length && duplicateRecords.length > 0 
                        ? "Deselect All" 
                        : `Select All (${duplicateRecords.length})`}
                    </Button>
                    <Button
                      onClick={handleMergeDuplicates}
                      disabled={isLoading || selectedRecords.length < 2}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    >
                      <Merge className="w-4 h-4 mr-2" />
                      {isLoading ? "Merging..." : `Merge Selected (${selectedRecords.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <InfiniteScroll
                  dataLength={duplicateRecords.length}
                  next={loadMore}
                  hasMore={hasMore}
                  loader={
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }
                  endMessage={
                    duplicateRecords.length > 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        All {totalCount} duplicate records loaded
                      </div>
                    )
                  }
                  style={{ overflow: 'visible' }}
                >
                  <div className="space-y-3">
                    {duplicateRecords.map((record, index) => (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(0.3 + (index % 10) * 0.05, 0.8), duration: 0.3 }}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                        className="
    border-gray-400
    data-[state=checked]:bg-primary data-[state=checked]:text-white
    dark:border-gray-600
    dark:data-[state=checked]:bg-white
    dark:data-[state=checked]:text-black
  "
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
                            <Badge variant="destructive">Duplicate</Badge>
                            <Badge variant="outline">{record.owner_id ? "Assigned" : "Unassigned"}</Badge>
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