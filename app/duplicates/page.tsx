"use client"

import { motion } from "framer-motion"
import { ArrowLeft, XCircle, Merge } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { contacts } from "@/lib/demo-data"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DuplicatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const duplicateRecords = contacts.filter((c) => c.isDuplicate)

  const handleSelectAll = () => {
    if (selectedRecords.length === duplicateRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(duplicateRecords.map((r) => r.id))
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
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)

    toast({
      title: "Duplicates Merged",
      description: `Successfully merged ${selectedRecords.length} duplicate records.`,
    })

    setSelectedRecords([])
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
                  {duplicateRecords.length} duplicate records found across contacts and companies
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
                    <Button variant="outline" onClick={handleSelectAll}>
                      {selectedRecords.length === duplicateRecords.length ? "Deselect All" : "Select All"}
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
                <div className="space-y-3">
                  {duplicateRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedRecords.includes(record.id)}
                        onCheckedChange={() => handleSelectRecord(record.id)}
                      />
                      <div className="flex-1 grid sm:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">{record.name}</p>
                          <p className="text-sm text-muted-foreground">{record.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{record.company}</p>
                          <p className="text-sm text-muted-foreground">Company</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Duplicate</Badge>
                          <Badge variant="outline">{record.isAssigned ? "Assigned" : "Unassigned"}</Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
