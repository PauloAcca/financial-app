'use client'

import { useState, useTransition } from 'react'
import { Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signup, signInWithGoogle } from '@/actions/auth'
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthLink,
  GoogleGlyph,
} from '@/components/auth/auth-card'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, startGoogleTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    startTransition(async () => {
      const result = await signup(formData)
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
      title="Crear cuenta"
      subtitle="Empezá a ordenar tus finanzas hoy."
      footer={
        <>
          ¿Ya tenés cuenta? <AuthLink href="/login">Iniciá sesión</AuthLink>
        </>
      }
    >
      {/* Google OAuth */}
      <Button
        id="btn-google-signup"
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && <AuthError message={error} />}

        <Input
          id="signup-name"
          name="display_name"
          type="text"
          label="Nombre"
          placeholder="Tu nombre"
          autoComplete="name"
          required
          leftIcon={<User size={16} />}
        />

        <Input
          id="signup-email"
          name="email"
          type="email"
          label="Email"
          placeholder="vos@email.com"
          autoComplete="email"
          required
          leftIcon={<Mail size={16} />}
        />

        <Input
          id="signup-password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          required
          leftIcon={<Lock size={16} />}
        />

        <Input
          id="signup-confirm-password"
          name="confirm_password"
          type="password"
          label="Confirmar contraseña"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          leftIcon={<Lock size={16} />}
        />

        <Button
          id="btn-signup-submit"
          type="submit"
          size="lg"
          loading={isPending}
          className="w-full mt-1"
        >
          {isPending ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthCard>
  )
}
