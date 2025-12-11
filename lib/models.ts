import { ObjectId } from "mongodb"

export interface Company {
  _id?: ObjectId
  name: string
  industry: string
  hasIssues: boolean
}

export interface Contact {
  _id?: ObjectId
  name: string
  email: string
  company: string
  isAssigned: boolean
  hasMissingFields: boolean
  isDuplicate: boolean
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

