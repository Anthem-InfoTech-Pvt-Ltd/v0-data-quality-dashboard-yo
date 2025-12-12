import nodemailer from "nodemailer"

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
  console.warn(
    "SMTP environment variables are not fully configured. Email sending will be disabled."
  )
}

// Configure transporter with Gmail-specific settings if using Gmail
const isGmail = smtpHost?.includes('gmail') || smtpHost?.includes('google')

const transporter = smtpHost ? nodemailer.createTransport({
  host: smtpHost,
  port: Number(smtpPort),
  secure: Number(smtpPort) === 465, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  // Gmail-specific settings
  ...(isGmail && {
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass, // This should be your app password
    },
  }),
}) : null

interface MailOptions {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendEmail(mailOptions: MailOptions) {
  if (!smtpHost || !transporter) {
    console.log("Email sending is disabled. To enable, set up SMTP environment variables.")
    console.log("Email that would have been sent:", mailOptions)
    // Simulate success if SMTP is not configured
    return { success: true, message: "Email sending is simulated." }
  }

  try {
    console.log(`Sending email to: ${mailOptions.to}`)
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)
    return { success: true, message: "Email sent successfully." }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, message: "Failed to send email." }
  }
}
