import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Lead } from "@/lib/models"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/mailer"

export async function GET() {
  try {
    const db = await getDatabase()
    const leads = await db
      .collection<Lead>("leads")
      .find({})
      .sort({ createdDate: -1 })
      .toArray()
    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { action, leadId } = body

    if (action === "send-alert" && leadId) {
      const lead = await db
        .collection<Lead>("leads")
        .findOne({ _id: new ObjectId(leadId) })

      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 })
      }

      // Check if lead has email (for new leads), otherwise fall back to finding contact
      let toEmail = lead.email
      
      if (!toEmail) {
        // Fall back to finding associated contact for older leads without email field
        const nameParts = lead.fullName.split(" ")
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(" ")

        const contact = await db.collection("contacts").findOne({
          first_name: firstName,
          last_name: lastName,
          company: lead.company,
        })
        
        if (contact && contact.email) {
          toEmail = contact.email
        }
      }

      if (!toEmail) {
        return NextResponse.json(
          { error: "Email address not found for this lead" },
          { status: 404 }
        )
      }

      const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@example.com"

      const subject = `Unassigned Lead Alert: ${lead.fullName} from ${lead.company}`
      const html = `
        <h1>Unassigned Lead Alert</h1>
        <p>Dear ${lead.fullName},</p>
        <p>This is an automated alert to notify you that your lead has been unassigned for more than 24 hours.</p>
        <h2>Lead Details:</h2>
        <ul>
          <li><strong>Name:</strong> ${lead.fullName}</li>
          <li><strong>Company:</strong> ${lead.company}</li>
          <li><strong>Created Date:</strong> ${new Date(
            lead.createdDate
          ).toLocaleDateString()}</li>
          <li><strong>Days Overdue:</strong> ${lead.daysOverdue}</li>
        </ul>
        <p>Please log in to the dashboard to assign this lead to a sales representative.</p>
        <p>Best regards,<br>Revenue Data Health Team</p>
      `

      const result = await sendEmail({
        from: fromEmail,
        to: toEmail,
        subject,
        html,
      })

      if (result.success) {
        // Mark the associated contact as having an alert sent
        const nameParts = lead.fullName.split(" ")
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(" ")

        await db.collection("contacts").updateOne(
          {
            first_name: firstName,
            last_name: lastName,
            company: lead.company,
          },
          { 
            $set: { 
              email_alert_sent_at: new Date() 
            } 
          }
        )

        return NextResponse.json({ 
          success: true, 
          message: `Email alert sent to ${toEmail}` 
        })
      } else {
        return NextResponse.json(
          { error: result.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: "Invalid action or parameters" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error processing lead:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

