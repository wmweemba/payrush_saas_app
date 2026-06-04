import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: [
    './src/lib/db/schema/users.js',
    './src/lib/db/schema/clients.js',
    './src/lib/db/schema/invoices.js',
    './src/lib/db/schema/branding.js',
  ],
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  schemaFilter: ['payrush'],
})
