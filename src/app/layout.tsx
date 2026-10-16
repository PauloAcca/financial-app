import type { Metadata, Viewport } from 'next'
import { Outfit, Fraunces } from 'next/font/google'
import { AuroraBackdrop } from '@/components/layout/aurora-backdrop'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0A0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: 'Aura · Finanzas',
    template: '%s · Aura',
  },
  description:
    'Tus finanzas personales con claridad y calma: cuentas, gastos, metas, inversiones y asistencia con IA.',
  keywords: [
    'finanzas personales',
    'presupuesto',
    'gastos',
    'ingresos',
    'ahorro',
    'inversiones',
    'aura finanzas',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aura',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${outfit.variable} ${fraunces.variable}`}
      style={{ backgroundColor: '#0A0E14' }}
    >
      <head>
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Aura" />
      </head>
      <body className="min-h-dvh antialiased">
        <AuroraBackdrop />
        {children}
      </body>
    </html>
  )
}
