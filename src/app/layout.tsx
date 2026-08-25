import type { Metadata, Viewport } from 'next'
import { Space_Mono, Share_Tech_Mono, Press_Start_2P, Chakra_Petch } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-share-tech',
  display: 'swap',
})

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-press-start',
  display: 'swap',
})

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-chakra',
  display: 'swap',
})

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
    <html
      lang="es"
      suppressHydrationWarning
      className={`${spaceMono.variable} ${shareTechMono.variable} ${pressStart2P.variable} ${chakraPetch.variable}`}
      style={{ backgroundColor: '#0f111e', color: '#ffffff' }}
    >
      <head>
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
      <body
        className="min-h-dvh antialiased bg-[#0f111e] text-white"
        style={{ backgroundColor: '#0f111e', color: '#ffffff' }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
