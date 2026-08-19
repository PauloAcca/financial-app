import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#00FF66',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: 'Pixel Realm · Finanzas',
    template: '%s · Pixel Realm',
  },
  description: 'Tu asistente personal y control financiero RPG. Controlá tu botín, misiones y gastos en un solo lugar.',
  keywords: ['finanzas personales', 'presupuesto', 'gastos', 'ingresos', 'ahorro', 'pixel realm', 'rpg finanzas'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/pixel-coin.jpg', type: 'image/jpeg' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/pixel-coin.jpg',
    apple: [
      { url: '/pixel-coin.jpg', sizes: '180x180', type: 'image/jpeg' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pixel Realm',
  },
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
        
        {/* Favicon e icono de pestaña de navegador */}
        <link rel="icon" type="image/jpeg" href="/pixel-coin.jpg" />
        <link rel="shortcut icon" href="/pixel-coin.jpg" />
        
        {/* Icono para iPhone / iPad ("Añadir a pantalla de inicio") */}
        <link rel="apple-touch-icon" href="/pixel-coin.jpg" />
        <link rel="apple-touch-icon-precomposed" href="/pixel-coin.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pixel Realm" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-gradient-app min-h-dvh antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
