'use client'

import { usePathname } from 'next/navigation'

interface AppContentProps {
  children: React.ReactNode
}

export function AppContent({ children }: AppContentProps) {
  const pathname = usePathname()
  const isChat = pathname === '/chat' || pathname.startsWith('/chat')

  if (isChat) {
    return (
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative pb-16 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] -mt-[57px]">
        <div className="flex-1 flex flex-col min-h-0 w-full h-full">
          {children}
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-y-auto pb-24">
      <div className="flex-1 flex flex-col max-w-lg w-full mx-auto px-4 py-5">
        {children}
      </div>
    </main>
  )
}
