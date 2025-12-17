import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/mailer"

export async function POST(request: Request) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { contactId, contactIds } = body

    // Handle single or multiple contacts
    const ids = contactIds || (contactId ? [contactId] : [])
    
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "No contact IDs provided" }, { status: 400 })
    }

    const contacts = await db
      .collection("contacts")
      .find({ 
        _id: { 
          $in: ids.map((id: string) => new ObjectId(id)) 
        } 
      })
      .toArray()

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: "No contacts found" }, { status: 404 })
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@example.com"
    const results = []
    let successCount = 0
    let failureCount = 0

    for (const contact of contacts) {
      if (!contact.email) {
        results.push({
          contactId: contact._id,
          success: false,
          message: "Email address not found"
        })
        failureCount++
        continue
      }

      const subject = `Action Required: Unassigned Lead - ${contact.first_name} ${contact.last_name}`
      const html = `
        <h1>Unassigned Lead Alert</h1>
        <p>Dear ${contact.first_name} ${contact.last_name},</p>
        <p>This is an automated alert to notify you that your lead has not been assigned to a sales representative.</p>
        <h2>Contact Details:</h2>
        <ul>
          <li><strong>Name:</strong> ${contact.first_name} ${contact.last_name}</li>
          <li><strong>Email:</strong> ${contact.email}</li>
          <li><strong>Company:</strong> ${contact.company}</li>
          ${contact.industry ? `<li><strong>Industry:</strong> ${contact.industry}</li>` : ''}
          <li><strong>Created Date:</strong> ${new Date(contact.created_date).toLocaleDateString()}</li>
          <li><strong>Status:</strong> Unassigned</li>
        </ul>
        <p>Please assign this lead to a sales representative as soon as possible to ensure proper follow-up.</p>
        <p>You can log in to the Revenue Data Health Dashboard to manage this lead.</p>
        <p>Best regards,<br>Revenue Data Health Team</p>
      `

      try {
        const result = await sendEmail({
          from: fromEmail,
          to: contact.email,
          subject,
          html,
        })

        if (result.success) {
          // Mark the contact as having an alert sent
          await db.collection("contacts").updateOne(
            { _id: contact._id },
            { 
              $set: { 
                email_alert_sent_at: new Date() 
              } 
            }
          )
          
          results.push({
            contactId: contact._id,
            success: true,
            message: `Email sent to ${contact.email}`
          })
          successCount++
        } else {
          results.push({
            contactId: contact._id,
            success: false,
            message: result.message
          })
          failureCount++
        }
      } catch (error: any) {
        results.push({
          contactId: contact._id,
          success: false,
          message: error.message || "Failed to send email"
        })
        failureCount++
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      message: `Sent ${successCount} email(s) successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
      successCount,
      failureCount
    })
  } catch (error) {
    console.error("Error processing email alerts:", error)
    return NextResponse.json(
      { error: "Failed to process email alerts" },
      { status: 500 }
    )
  }
}
