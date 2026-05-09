import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

const tokens = new Map<string, { email: string; resourceId: string; expires: number }>()

export async function POST(req: NextRequest) {
  const { email, resourceId, companyDomain } = await req.json()

  const emailDomain = email.split('@')[1]?.toLowerCase()
  const targetDomain = companyDomain?.toLowerCase()

  if (!emailDomain || emailDomain !== targetDomain) {
    return NextResponse.json(
      { error: 'Email domain must match the company domain to make changes.' },
      { status: 403 }
    )
  }

  const token = crypto.randomBytes(32).toString('hex')
  tokens.set(token, { email, resourceId, expires: Date.now() + 1000 * 60 * 30 })

  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`

  await resend.emails.send({
    from: 'Utah Founder Navigator <noreply@startup.utah.gov>',
    to: email,
    subject: 'Verify your edit request',
    html: `
      <h2>Verify your edit request</h2>
      <p>Click the link below to confirm your update to resource #${resourceId}. This link expires in 30 minutes.</p>
      <a href="${verifyUrl}" style="background:#C8102E;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Verify & Apply Changes</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  })

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const entry = tokens.get(token)
  if (!entry || entry.expires < Date.now()) {
    return NextResponse.json({ error: 'Token invalid or expired' }, { status: 401 })
  }

  tokens.delete(token)
  return NextResponse.json({ success: true, email: entry.email, resourceId: entry.resourceId })
}
