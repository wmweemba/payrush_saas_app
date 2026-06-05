import { z } from 'zod'
import { eq, desc, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems } from '@/lib/db/schema/invoices'

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
})

const createInvoiceSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  clientId: z.string().uuid().optional(),
  currency: z.string().default('ZMW'),
  dueDate: z.string().optional(),
  status: z.enum(['draft', 'sent']).default('draft'),
  paymentMethod: z.string().optional(),
  paymentNotes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, session.user.id))
      .orderBy(desc(invoices.createdAt))

    if (userInvoices.length === 0) return Response.json({ data: [] })

    const invoiceIds = userInvoices.map(inv => inv.id)
    const allItems = await db
      .select()
      .from(invoiceItems)
      .where(inArray(invoiceItems.invoiceId, invoiceIds))
      .orderBy(invoiceItems.sortOrder)

    const itemsByInvoice = allItems.reduce((acc, item) => {
      if (!acc[item.invoiceId]) acc[item.invoiceId] = []
      acc[item.invoiceId].push(item)
      return acc
    }, {})

    const result = userInvoices.map(inv => ({
      ...inv,
      items: itemsByInvoice[inv.id] || [],
    }))

    return Response.json({ data: result })
  } catch (err) {
    console.error('[GET /api/invoices]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { items, customerEmail, clientId, dueDate, ...invoiceFields } = parsed.data

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        ...invoiceFields,
        userId: session.user.id,
        customerEmail: customerEmail || null,
        clientId: clientId || null,
        dueDate: dueDate || null,
        invoiceNumber: 'INV-' + Date.now(),
      })
      .returning()

    const newItems = await db
      .insert(invoiceItems)
      .values(
        items.map((item, index) => ({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          sortOrder: index,
        }))
      )
      .returning()

    return Response.json({ data: { ...newInvoice, items: newItems } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/invoices]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
