import { pgSchema, uuid, text, date, timestamp, numeric, integer } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const payrushSchema = pgSchema('payrush')

export const invoices = payrushSchema.table('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  clientId: uuid('client_id'),
  invoiceNumber: text('invoice_number').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  currency: text('currency').notNull().default('ZMW'),
  status: text('status').default('draft'),
  dueDate: date('due_date'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paymentMethod: text('payment_method'),
  paymentNotes: text('payment_notes'),
  publicToken: uuid('public_token').defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const invoiceItems = payrushSchema.table('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity').default('1'),
  unitPrice: numeric('unit_price').notNull(),
  amount: numeric('amount').generatedAlwaysAs(sql`quantity * unit_price`),
  sortOrder: integer('sort_order').default(0),
})

export const emailLogs = payrushSchema.table('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id'),
  userId: text('user_id'),
  recipientEmail: text('recipient_email'),
  subject: text('subject'),
  status: text('status'),
  resendId: text('resend_id'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
})
