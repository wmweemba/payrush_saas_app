import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/providers/ToastProvider'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata = {
  title: 'PayRush — Invoice faster. Get paid sooner.',
  description: 'Create a professional invoice in under 2 minutes and share it on WhatsApp. Free for freelancers and small businesses.',
  icons: {
    icon: [
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
