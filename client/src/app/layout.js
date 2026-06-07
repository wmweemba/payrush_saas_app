import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/providers/ToastProvider'
import ServiceWorkerProvider from '@/components/providers/ServiceWorkerProvider'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#185FA5',
}

export const metadata = {
  title: 'PayRush — Invoice faster. Get paid sooner.',
  description: 'Create a professional invoice in under 2 minutes and share it on WhatsApp. Free for freelancers and small businesses.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'PayRush — Invoice faster. Get paid sooner.',
    description: 'Create a professional invoice in under 2 minutes and share it on WhatsApp.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {children}
        <ServiceWorkerProvider />
        <ToastProvider />
      </body>
    </html>
  )
}
