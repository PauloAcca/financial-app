'use client'

import { useState, useTransition } from 'react'
import { Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login, signInWithGoogle } from '@/actions/auth'
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthLink,
  GoogleGlyph,
} from '@/components/auth/auth-card'

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
    <AuthCard
      title="Iniciar sesión"
      subtitle="Tu dinero, con calma."
      footer={
        <>
          ¿No tenés cuenta? <AuthLink href="/signup">Creá una gratis</AuthLink>
        </>
      }
    >
      {/* Google OAuth */}
      <Button
        id="btn-google-login"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        loading={isGooglePending}
        type="button"
      >
        {!isGooglePending && (
          <>
            <GoogleGlyph />
            Continuar con Google
          </>
        )}
      </Button>

      <AuthDivider />

      {/* Form email + password */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && <AuthError message={error} />}

        <Input
          id="login-email"
          name="email"
          type="email"
          label="Email"
          placeholder="vos@email.com"
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
          loading={isPending}
          className="w-full mt-1"
        >
          {isPending ? 'Conectando…' : 'Iniciar sesión'}
        </Button>
      </form>
    </AuthCard>
  )
}
