import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { generateInsights } from '@/lib/ai/insights'
import { ChatInterface } from '@/components/chat/chat-interface'

export const metadata: Metadata = { title: 'Asistente IA' }

// La interfaz de chat es full-height: necesitamos que el layout no agregue overflow
export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Generar insights proactivos on-demand (no bloquea el render si falla)
    generateInsights(supabase, user.id).catch((err) =>
      console.error('[chat/page] generateInsights:', err)
    )
  }

  return (
    <div className="flex flex-col h-full -mx-4 sm:-mx-6 -my-6 lg:-my-8">
      <ChatInterface />
    </div>
  )
}
