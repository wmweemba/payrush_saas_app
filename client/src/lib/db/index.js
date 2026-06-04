import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as users from './schema/users.js'
import * as clients from './schema/clients.js'
import * as invoices from './schema/invoices.js'
import * as branding from './schema/branding.js'

const client = postgres(process.env.DATABASE_URL)
export const db = drizzle(client, {
  schema: { ...users, ...clients, ...invoices, ...branding },
})
