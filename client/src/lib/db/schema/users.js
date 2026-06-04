import { pgSchema, text, timestamp } from 'drizzle-orm/pg-core'

export const payrushSchema = pgSchema('payrush')

export const profiles = payrushSchema.table('profiles', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  phone: text('phone'),
  address: text('address'),
  website: text('website'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
