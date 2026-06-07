import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems } from '@/lib/db/schema/invoices'

export async function POST(request, { params }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const [source] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
    if (!source) return Response.json({ error: 'Not found' }, { status: 404 })

    if (source.documentType !== 'quote') {
      return Response.json({ error: 'Only quotes can be converted to invoices.' }, { status: 400 })
    }

    const [alreadyConverted] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.convertedFromQuoteId, source.id))
    if (alreadyConverted) {
      return Response.json(
        { error: 'This quote has already been converted to an invoice.' },
        { status: 400 }
      )
    }

    const sourceItems = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, source.id))
      .orderBy(invoiceItems.sortOrder)

    const {
      id: sourceId,
      invoiceNumber,
      documentType,
      convertedFromQuoteId,
      status,
      publicToken,
      createdAt,
      updatedAt,
      ...sourceFields
    } = source

    const newInvoiceNumber = 'INV-' + invoiceNumber.replace(/^QT-/, '')

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        ...sourceFields,
        invoiceNumber: newInvoiceNumber,
        documentType: 'invoice',
        status: 'draft',
        convertedFromQuoteId: source.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    if (sourceItems.length > 0) {
      await db.insert(invoiceItems).values(
        sourceItems.map((item) => ({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: item.sortOrder,
        }))
      )
    }

    return Response.json({ data: { id: newInvoice.id } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/invoices/[id]/convert]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
