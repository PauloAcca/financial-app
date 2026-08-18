'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Lock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login, signInWithGoogle } from '@/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, startGoogleTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleGoogle() {
    startGoogleTransition(async () => {
      const result = await signInWithGoogle()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="glass rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-lg)]">
      {/* Logo / título */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Finanzas</h1>
          <p className="text-xs text-[var(--color-text-muted)]">Tu asistente personal</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-1">
        Bienvenido de vuelta
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Ingresá para continuar con tu cuenta
      </p>

      {/* Google OAuth */}
      <Button
        id="btn-google-login"
        variant="secondary"
        size="lg"
        className="w-full mb-4"
        onClick={handleGoogle}
        loading={isGooglePending}
        type="button"
      >
        {!isGooglePending && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continuar con Google
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-muted)]">o con tu email</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Form email + password */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          </div>
        )}

        <Input
          id="login-email"
          name="email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          autoComplete="email"
          required
          leftIcon={<Mail size={16} />}
        />

        <Input
          id="login-password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          leftIcon={<Lock size={16} />}
        />

        <Button
          id="btn-login-submit"
          type="submit"
          size="lg"
          className="w-full mt-1"
          loading={isPending}
        >
          Iniciar sesión
        </Button>
      </form>

      <p className="text-sm text-center text-[var(--color-text-muted)] mt-6">
        ¿No tenés cuenta?{' '}
        <Link
          href="/signup"
          className="text-[var(--color-accent)] hover:underline font-medium"
        >
          Creá una gratis
        </Link>
      </p>
    </div>
  )
}
