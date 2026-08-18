import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceso',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      {/* Fondo con gradiente sutil */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.07) 0%, transparent 55%)
          `,
        }}
      />
      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {children}
      </div>
    </div>
  )
}
