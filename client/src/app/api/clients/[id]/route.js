import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema/clients'

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
})

export async function GET(request, { params }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))

    if (!client) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ data: client })
  } catch (err) {
    console.error('[GET /api/clients/[id]]', err)
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
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const parsed = updateClientSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, ...fields } = parsed.data
    const updateData = { ...fields, updatedAt: new Date() }
    if (email !== undefined) updateData.email = email || null

    const [updated] = await db
      .update(clients)
      .set(updateData)
      .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
      .returning()

    return Response.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/clients/[id]]', err)
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
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    await db
      .update(clients)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))

    return Response.json({ data: { id } })
  } catch (err) {
    console.error('[DELETE /api/clients/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
