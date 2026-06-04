import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as authSchema from './schema/auth.js'
import * as usersSchema from './schema/users.js'
import * as clientsSchema from './schema/clients.js'
import * as invoicesSchema from './schema/invoices.js'
import * as brandingSchema from './schema/branding.js'

const client = postgres(process.env.DATABASE_URL)
export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...usersSchema,
    ...clientsSchema,
    ...invoicesSchema,
    ...brandingSchema,
  },
})
