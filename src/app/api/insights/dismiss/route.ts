import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado.' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return Response.json({ error: 'ID requerido.' }, { status: 400 })

    await supabase
      .from('insights')
      .update({ dismissed: true })
      .eq('id', id)
      .eq('user_id', user.id) // RLS extra

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Error interno.' }, { status: 500 })
  }
}
