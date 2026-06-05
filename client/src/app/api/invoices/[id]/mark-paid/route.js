import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems } from '@/lib/db/schema/invoices'

export async function POST(request, { params }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const [existing] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    let paymentMethod = null
    let paymentNotes = null
    try {
      const body = await request.json()
      paymentMethod = body.paymentMethod ?? null
      paymentNotes = body.paymentNotes ?? null
    } catch {
      // empty body is fine
    }

    const [updated] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paymentMethod,
        paymentNotes,
        updatedAt: new Date(),
      })
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
      .returning()

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id))
      .orderBy(invoiceItems.sortOrder)

    return Response.json({ data: { ...updated, items } })
  } catch (err) {
    console.error('[POST /api/invoices/[id]/mark-paid]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
