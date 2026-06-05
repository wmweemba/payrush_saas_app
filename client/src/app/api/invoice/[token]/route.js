import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, invoiceItems } from '@/lib/db/schema/invoices'
import { branding } from '@/lib/db/schema/branding'

export async function GET(request, { params }) {
  try {
    const { token } = await params

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.publicToken, token))

    if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })

    const [items, [brandingRecord]] = await Promise.all([
      db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id))
        .orderBy(invoiceItems.sortOrder),
      db
        .select()
        .from(branding)
        .where(eq(branding.userId, invoice.userId)),
    ])

    // Strip userId from all objects — never expose on public routes
    const { userId: _invoiceUserId, ...publicInvoice } = invoice
    let publicBranding = null
    if (brandingRecord) {
      const { userId: _brandingUserId, ...rest } = brandingRecord
      publicBranding = rest
    }

    return Response.json({
      data: {
        ...publicInvoice,
        items,
        branding: publicBranding,
      },
    })
  } catch (err) {
    console.error('[GET /api/invoice/[token]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
