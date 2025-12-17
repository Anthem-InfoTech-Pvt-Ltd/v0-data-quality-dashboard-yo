import { ObjectId } from "mongodb"

export interface Company {
  _id?: ObjectId
  name: string
  website: string
  industry: string | null
  employee_count: number | null
}

export interface Contact {
  _id?: ObjectId
  email: string
  first_name: string
  last_name: string
  company: string
  industry: string | null
  owner_id: string | null
  owner_name: string | null
  created_date: Date
  email_alert_sent_at?: Date | null  // Track when email alert was sent
}

export interface Alert {
  _id?: ObjectId
  type: "duplicate" | "unassigned" | "missing-field"
  message: string
  timestamp: Date
  severity: "high" | "medium" | "low"
}

export interface EmailAlert {
  _id?: ObjectId
  subject: string
  from: string
  preview: string
  timestamp: Date
  isRead: boolean
  priority: "high" | "normal" | "low"
}

export interface Lead {
  _id?: ObjectId
  fullName: string
  email: string
  company: string
  createdDate: Date
  daysOverdue: number
}

export interface Metrics {
  duplicates: number
  unassignedLeads: number
  missingFields: number
  totalContacts: number
  overdueLeads: number
}

