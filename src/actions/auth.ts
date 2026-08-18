'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// =========================================================
// LOGIN con email + password
// =========================================================
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// =========================================================
// SIGNUP con email + password
// =========================================================
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email       = formData.get('email') as string
  const password    = formData.get('password') as string
  const displayName = formData.get('display_name') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
    },
  })

  if (error) {
    console.error('Signup error:', error)
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
      return { error: 'Ya existe una cuenta con ese email. Probá iniciar sesión.' }
    }
    return { error: error.message || 'No se pudo crear la cuenta. Intentá de nuevo.' }
  }

  // Si Supabase requiere confirmación de email y no devolvió session inmediata
  if (data.user && !data.session) {
    // Si no tiene sesión pero el usuario fue creado (email confirmation activado)
    // Intentamos iniciar sesión automáticamente por si las dudas
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return { error: 'Cuenta creada. Por favor verificá tu casilla de email para confirmarla o desactivá "Confirm email" en Supabase Auth Settings.' }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// =========================================================
// SIGN IN con Google OAuth
// =========================================================
export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error || !data.url) {
    return { error: 'No se pudo iniciar sesión con Google.' }
  }

  redirect(data.url)
}

// =========================================================
// LOGOUT
// =========================================================
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
