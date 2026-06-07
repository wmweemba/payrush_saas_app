import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems } from '@/lib/db/schema/invoices'

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
})

const updateInvoiceSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  clientId: z.string().uuid().optional(),
  currency: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'accepted', 'declined']).optional(),
  paymentMethod: z.string().optional(),
  paymentNotes: z.string().optional(),
  items: z.array(itemSchema).min(1).optional(),
})

async function getInvoiceWithItems(invoiceId, userId) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))

  if (!invoice) return null

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(invoiceItems.sortOrder)

  return { ...invoice, items }
}

export async function GET(request, { params }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const invoice = await getInvoiceWithItems(id, session.user.id)
    if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ data: invoice })
  } catch (err) {
    console.error('[GET /api/invoices/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const [existing] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const parsed = updateInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { items, customerEmail, clientId, dueDate, ...invoiceFields } = parsed.data

    if (items) {
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id))
      await db.insert(invoiceItems).values(
        items.map((item, index) => ({
          invoiceId: id,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          sortOrder: index,
        }))
      )
    }

    const updateData = {
      ...invoiceFields,
      updatedAt: new Date(),
    }
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail || null
    if (clientId !== undefined) updateData.clientId = clientId || null
    if (dueDate !== undefined) updateData.dueDate = dueDate || null

    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
      .returning()

    const updatedWithItems = await getInvoiceWithItems(id, session.user.id)
    return Response.json({ data: updatedWithItems })
  } catch (err) {
    console.error('[PUT /api/invoices/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const [existing] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
    return Response.json({ data: { id } })
  } catch (err) {
    console.error('[DELETE /api/invoices/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
