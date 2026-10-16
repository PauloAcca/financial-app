import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceso',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-sm animate-fade-in">{children}</div>
    </div>
  )
}
