import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase client para Server Components, Server Actions y Route Handlers.
// Maneja cookies del request de Next.js para mantener la sesión del usuario.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll puede fallar en Server Components de solo lectura.
            // El middleware se encarga de refrescar la sesión en esos casos.
          }
        },
      },
    }
  )
}
