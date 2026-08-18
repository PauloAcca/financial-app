import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Callback route handler para OAuth (Google)
// Supabase redirige aquí después del flujo OAuth con un code temporal
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Exchange error:', exchangeError)
  }

  return NextResponse.redirect(`${origin}/login?error=callback`)
}
