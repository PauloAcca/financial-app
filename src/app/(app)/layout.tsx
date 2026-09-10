import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TopHeader } from '@/components/layout/top-header'
import { AppContent } from '@/components/layout/app-content'
import { ToastContainer } from '@/components/ui/toast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener profile para el display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || user.email

  return (
    <div className="flex h-dvh overflow-hidden bg-[#0f111e] overscroll-none">
      <Sidebar displayName={displayName} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header visible en todas las resoluciones */}
        <TopHeader />

        <AppContent>
          {children}
        </AppContent>
      </div>

      <MobileNav />
      <ToastContainer />
    </div>
  )
}
