import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { branding } from '@/lib/db/schema/branding'

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  businessName: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  mobileMoneyNumber: z.string().optional(),
  paymentInstructions: z.string().optional(),
  template: z.enum(['modern', 'classic', 'minimal']).optional(),
})

export async function GET(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [record] = await db
      .select()
      .from(branding)
      .where(eq(branding.userId, session.user.id))

    return Response.json({ data: record ?? null })
  } catch (err) {
    console.error('[GET /api/branding]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = brandingSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { logoUrl, ...fields } = parsed.data
    const values = {
      ...fields,
      logoUrl: logoUrl || null,
      userId: session.user.id,
      updatedAt: new Date(),
    }

    const [record] = await db
      .insert(branding)
      .values({ ...values, createdAt: new Date() })
      .onConflictDoUpdate({
        target: branding.userId,
        set: values,
      })
      .returning()

    return Response.json({ data: record })
  } catch (err) {
    console.error('[PUT /api/branding]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
