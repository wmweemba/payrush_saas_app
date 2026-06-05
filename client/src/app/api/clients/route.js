import { z } from 'zod'
import { eq, and, asc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema/clients'

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().default('ZMW'),
})

export async function GET(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await db
      .select()
      .from(clients)
      .where(and(eq(clients.userId, session.user.id), eq(clients.status, 'active')))
      .orderBy(asc(clients.name))

    return Response.json({ data: result })
  } catch (err) {
    console.error('[GET /api/clients]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createClientSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, ...fields } = parsed.data

    const [newClient] = await db
      .insert(clients)
      .values({
        ...fields,
        email: email || null,
        userId: session.user.id,
      })
      .returning()

    return Response.json({ data: newClient }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clients]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
