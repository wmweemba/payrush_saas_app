import { pgSchema, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const payrushSchema = pgSchema('payrush')

export const branding = payrushSchema.table('branding', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#185FA5'),
  businessName: text('business_name'),
  bankName: text('bank_name'),
  accountName: text('account_name'),
  accountNumber: text('account_number'),
  mobileMoneyNumber: text('mobile_money_number'),
  paymentInstructions: text('payment_instructions'),
  template: text('template').default('modern'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
