'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signup, signInWithGoogle } from '@/actions/auth'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, startGoogleTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    const password = formData.get('password') as string
    const confirm  = formData.get('confirm_password') as string
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
    <div className="bg-[#181c31] border-2 border-[#00FF66] rounded-[4px] p-7 shadow-[0_0_20px_rgba(0,255,102,0.25)] font-mono">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="relative w-12 h-12 rounded-[4px] border-2 border-[#00FF66] bg-[#111424] overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(0,255,102,0.4)]">
          <Image
            src="/pixel-coin.jpg"
            alt="Pixel Realm"
            width={48}
            height={48}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <h1 className="text-xl font-bold text-[#00FF66] tracking-widest glow-text-green uppercase">
          PIXEL REALM
        </h1>
        <p className="text-xs text-[#8B92A9] tracking-wider uppercase">
          CREAR PERSONAJE JUGADOR
        </p>
      </div>

      <h2 className="text-base font-bold text-white mb-1 uppercase tracking-wide">
        REGISTRO DE CUENTA
      </h2>
      <p className="text-xs text-[#8B92A9] mb-5">
        Comenzá en Nivel 1 con tu bóveda gratis
      </p>

      {/* Google OAuth */}
      <Button
        id="btn-google-signup"
        variant="secondary"
        size="lg"
        className="w-full mb-4 text-xs font-bold"
        onClick={handleGoogle}
        loading={isGooglePending}
        type="button"
      >
        {!isGooglePending && (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        CONTINUAR CON GOOGLE
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[#293056]" />
        <span className="text-[10px] text-[#8B92A9] uppercase">O CON TU EMAIL</span>
        <div className="flex-1 h-px bg-[#293056]" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="px-3.5 py-2.5 rounded-[4px] bg-[rgba(255,77,109,0.15)] border border-[#ff4d6d]/40">
            <p className="text-xs text-[#ff4d6d] font-bold">{error}</p>
          </div>
        )}

        <Input
          id="signup-name"
          name="display_name"
          type="text"
          label="NOMBRE DE JUGADOR"
          placeholder="Ej: Cipherpunk99"
          autoComplete="name"
          required
          leftIcon={<User size={16} />}
        />

        <Input
          id="signup-email"
          name="email"
          type="email"
          label="EMAIL"
          placeholder="jugador@pixelrealm.com"
          autoComplete="email"
          required
          leftIcon={<Mail size={16} />}
        />

        <Input
          id="signup-password"
          name="password"
          type="password"
          label="CONTRASEÑA"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          required
          leftIcon={<Lock size={16} />}
        />

        <Input
          id="signup-confirm-password"
          name="confirm_password"
          type="password"
          label="CONFIRMAR CONTRASEÑA"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          leftIcon={<Lock size={16} />}
        />

        <button
          id="btn-signup-submit"
          type="submit"
          disabled={isPending}
          className="btn-arcade-green py-3 px-4 rounded-[4px] text-xs font-bold font-mono tracking-widest text-black uppercase mt-1 cursor-pointer w-full"
        >
          {isPending ? 'CREANDO...' : 'CREAR CUENTA'}
        </button>
      </form>

      <p className="text-xs text-center text-[#8B92A9] mt-6">
        ¿Ya tenés personaje?{' '}
        <Link
          href="/login"
          className="text-[#00FF66] hover:underline font-bold"
        >
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
