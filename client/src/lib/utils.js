import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Invoice helpers ──────────────────────────────────────────────────────────

export function formatAmount(amount, currency = 'ZMW') {
  const num = Number(amount) || 0
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getInitials(name) {
  if (!name) return '?'
  return name.trim().charAt(0).toUpperCase()
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getInvoiceTotal(invoice) {
  return (invoice.items || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
}
