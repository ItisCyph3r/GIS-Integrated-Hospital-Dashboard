import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { BackendStatusProvider } from '@/components/providers/backend-status-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hospital Dashboard | Real-time Emergency Response',
  description: 'GIS-Integrated Hospital Dashboard with real-time ambulance tracking and proximity calculations',
  keywords: ['hospital', 'ambulance', 'emergency', 'gis', 'real-time'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <BackendStatusProvider>
              {children}
            </BackendStatusProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
