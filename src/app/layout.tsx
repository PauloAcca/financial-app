import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Finanzas',
    template: '%s · Finanzas',
  },
  description: 'Tu asistente personal de finanzas. Controlá tus cuentas, gastos e ingresos en un solo lugar.',
  keywords: ['finanzas personales', 'presupuesto', 'gastos', 'ingresos', 'ahorro'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-gradient-app min-h-dvh antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
