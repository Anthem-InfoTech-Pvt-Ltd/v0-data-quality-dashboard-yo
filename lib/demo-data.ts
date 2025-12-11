export interface Company {
  id: string
  name: string
  industry: string
  hasIssues: boolean
}

export interface Contact {
  id: string
  name: string
  email: string
  company: string
  isAssigned: boolean
  hasMissingFields: boolean
  isDuplicate: boolean
}

export interface Alert {
  id: string
  type: "duplicate" | "unassigned" | "missing-field"
  message: string
  timestamp: Date
  severity: "high" | "medium" | "low"
}

export interface EmailAlert {
  id: string
  subject: string
  from: string
  preview: string
  timestamp: Date
  isRead: boolean
  priority: "high" | "normal" | "low"
}

export interface OverdueLeadAlert {
  id: string
  fullName: string
  company: string
  createdDate: Date
  daysOverdue: number
}

export const companies: Company[] = [
  { id: "1", name: "Acme Corp", industry: "Technology", hasIssues: true },
  { id: "2", name: "TechStart Inc", industry: "Technology", hasIssues: false },
  { id: "3", name: "Finance Pro", industry: "Finance", hasIssues: true },
  { id: "4", name: "HealthCare Plus", industry: "Healthcare", hasIssues: true },
  { id: "5", name: "Retail Giants", industry: "Retail", hasIssues: false },
  { id: "6", name: "ManufactureCo", industry: "Manufacturing", hasIssues: true },
  { id: "7", name: "BankSecure", industry: "Finance", hasIssues: false },
  { id: "8", name: "MediCare Systems", industry: "Healthcare", hasIssues: true },
  { id: "9", name: "CloudTech", industry: "Technology", hasIssues: false },
  { id: "10", name: "DataFlow Inc", industry: "Technology", hasIssues: true },
  { id: "11", name: "RetailMax", industry: "Retail", hasIssues: false },
  { id: "12", name: "FactoryPro", industry: "Manufacturing", hasIssues: true },
  { id: "13", name: "InvestSmart", industry: "Finance", hasIssues: false },
  { id: "14", name: "HealthFirst", industry: "Healthcare", hasIssues: true },
  { id: "15", name: "TechInnovate", industry: "Technology", hasIssues: false },
  { id: "16", name: "ShopEasy", industry: "Retail", hasIssues: true },
  { id: "17", name: "BuildRight", industry: "Manufacturing", hasIssues: false },
  { id: "18", name: "CapitalGrowth", industry: "Finance", hasIssues: true },
  { id: "19", name: "WellnessCare", industry: "Healthcare", hasIssues: false },
  { id: "20", name: "DevOps Solutions", industry: "Technology", hasIssues: true },
  { id: "21", name: "Market Leaders", industry: "Retail", hasIssues: false },
  { id: "22", name: "Industrial Pro", industry: "Manufacturing", hasIssues: true },
  { id: "23", name: "WealthManage", industry: "Finance", hasIssues: false },
  { id: "24", name: "PharmaCare", industry: "Healthcare", hasIssues: true },
  { id: "25", name: "SaaS Pioneers", industry: "Technology", hasIssues: false },
]

export const contacts: Contact[] = Array.from({ length: 90 }, (_, i) => {
  const company = companies[i % companies.length]
  const isDuplicate = i < 15
  const isUnassigned = i >= 15 && i < 35
  const hasMissingFields = i >= 35 && i < 60
  return {
    id: `contact-${i + 1}`,
    name: `Contact ${i + 1}`,
    email: `contact${i + 1}@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
    company: company.name,
    isAssigned: !isUnassigned,
    hasMissingFields,
    isDuplicate,
  }
})

export const overdueLeads: OverdueLeadAlert[] = [
  {
    id: "lead-1",
    fullName: "Sarah Johnson",
    company: "Acme Corp",
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    daysOverdue: 3,
  },
  {
    id: "lead-2",
    fullName: "Michael Chen",
    company: "TechStart Inc",
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    daysOverdue: 5,
  },
  {
    id: "lead-3",
    fullName: "Emily Rodriguez",
    company: "Finance Pro",
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    daysOverdue: 2,
  },
  {
    id: "lead-4",
    fullName: "David Thompson",
    company: "HealthCare Plus",
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    daysOverdue: 7,
  },
  {
    id: "lead-5",
    fullName: "Jennifer Lee",
    company: "CloudTech",
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    daysOverdue: 4,
  },
  {
    id: "lead-6",
    fullName: "Robert Martinez",
    company: "DataFlow Inc",
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    daysOverdue: 6,
  },
]

export const alerts: Alert[] = [
  {
    id: "1",
    type: "duplicate",
    message: "3 duplicate contacts found in Acme Corp",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    severity: "high",
  },
  {
    id: "2",
    type: "unassigned",
    message: "5 leads from TechStart Inc are unassigned",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    severity: "medium",
  },
  {
    id: "3",
    type: "missing-field",
    message: "Finance Pro contact missing phone numbers",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    severity: "medium",
  },
  {
    id: "4",
    type: "duplicate",
    message: "Duplicate email detected for HealthCare Plus",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    severity: "high",
  },
  {
    id: "5",
    type: "unassigned",
    message: "8 new leads awaiting assignment",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    severity: "low",
  },
  {
    id: "6",
    type: "missing-field",
    message: "ManufactureCo deals missing revenue data",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    severity: "high",
  },
  {
    id: "7",
    type: "duplicate",
    message: "2 duplicate companies found in system",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    severity: "medium",
  },
]

export const emailAlerts: EmailAlert[] = [
  {
    id: "email-1",
    subject: "New Lead Assignment Required - Acme Corp",
    from: "leads@crm.com",
    preview: "5 new leads from Acme Corp require immediate assignment to sales team members...",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isRead: false,
    priority: "high",
  },
  {
    id: "email-2",
    subject: "Data Quality Report - Weekly Summary",
    from: "reports@crm.com",
    preview: "Your weekly data quality report is ready. Overall health score improved by 5%...",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    isRead: true,
    priority: "normal",
  },
  {
    id: "email-3",
    subject: "Duplicate Records Detected - TechStart Inc",
    from: "alerts@crm.com",
    preview: "3 duplicate contact records found in TechStart Inc. Review and merge recommended...",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    isRead: false,
    priority: "high",
  },
  {
    id: "email-4",
    subject: "Missing Contact Information Alert",
    from: "alerts@crm.com",
    preview: "15 contacts are missing phone numbers. Complete data entry to improve quality...",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    isRead: true,
    priority: "normal",
  },
  {
    id: "email-5",
    subject: "Unassigned Leads Reminder",
    from: "leads@crm.com",
    preview: "You have 20 unassigned leads waiting for distribution. Assign now to prevent delays...",
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    isRead: false,
    priority: "high",
  },
  {
    id: "email-6",
    subject: "Monthly Data Health Insights",
    from: "reports@crm.com",
    preview: "Your monthly data health insights are available. Check out top performing teams...",
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    isRead: true,
    priority: "low",
  },
]

// Calculate metrics
export const metrics = {
  duplicates: contacts.filter((c) => c.isDuplicate).length,
  unassignedLeads: contacts.filter((c) => !c.isAssigned).length,
  missingFields: contacts.filter((c) => c.hasMissingFields).length,
  totalContacts: contacts.length,
  overdueLeads: overdueLeads.length,
}

// Calculate health score
export function calculateHealthScore(): number {
  const duplicateScore = ((metrics.totalContacts - metrics.duplicates) / metrics.totalContacts) * 100
  const assignmentScore = ((metrics.totalContacts - metrics.unassignedLeads) / metrics.totalContacts) * 100
  const completenessScore = ((metrics.totalContacts - metrics.missingFields) / metrics.totalContacts) * 100
  const overdueScore = ((metrics.totalContacts - metrics.overdueLeads) / metrics.totalContacts) * 100

  return Math.round((duplicateScore + assignmentScore + completenessScore + overdueScore) / 4)
}
