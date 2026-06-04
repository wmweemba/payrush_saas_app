import { pgSchema, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const payrushSchema = pgSchema('payrush')

export const clients = payrushSchema.table('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  currency: text('currency').default('ZMW'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
