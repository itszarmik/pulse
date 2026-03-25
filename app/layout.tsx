import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Pulse — Campaign Dashboard',
  description: 'AI-powered ad campaign tracking and ROAS optimisation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Navbar />
          <main className="max-w-[1200px] mx-auto px-7 py-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
