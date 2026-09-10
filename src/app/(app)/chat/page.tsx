import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { generateInsights } from '@/lib/ai/insights'
import { ChatInterface } from '@/components/chat/chat-interface'

export const metadata: Metadata = { title: 'Asistente IA · Pixel Realm' }

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Generar insights proactivos on-demand
    generateInsights(supabase, user.id).catch((err) =>
      console.error('[chat/page] generateInsights:', err)
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full w-full">
      <ChatInterface />
    </div>
  )
}
