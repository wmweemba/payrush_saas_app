import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/providers/ToastProvider'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata = {
  title: 'PayRush',
  description: 'Invoice faster. Get paid sooner.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
