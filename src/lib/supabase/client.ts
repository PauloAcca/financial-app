import { createBrowserClient } from '@supabase/ssr'

// Supabase client para Client Components (se ejecuta en el browser).
// Usa las variables públicas NEXT_PUBLIC_* ya que el browser las necesita.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
