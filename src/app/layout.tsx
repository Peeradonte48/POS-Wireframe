import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, Noto_Sans_JP, Noto_Sans_Thai } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/providers/ThemeProvider'

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'A Ramen POS',
  description: 'FIP Point of Sale — Staff App',
}

// POS tablet: lock viewport — no accidental pinch-zoom for staff
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={`${ibmPlexSans.variable} ${notoSansJP.variable} ${notoSansThai.variable}`}>
      <body className="antialiased">
        <Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="afterInteractive" />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
