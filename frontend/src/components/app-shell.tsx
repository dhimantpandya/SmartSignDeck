import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './sidebar'
import useIsCollapsed from '@/hooks/use-is-collapsed'
import { useAuth } from '@/hooks/use-auth'
import { Routes } from '@/utilities/routes'

import { IconLoader2 } from '@tabler/icons-react'
import { tokenStore } from '@/store/token'
import { ChatSidebar } from './collaboration/chat-sidebar'
import { useState } from 'react'

export default function AppShell() {
  const [isCollapsed, setIsCollapsed] = useIsCollapsed()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const location = useLocation()
  const { isLoggedIn } = useAuth()

  // Check if we have a refresh token but aren't logged in yet (loading state)
  const hasToken = !!tokenStore.getRefreshToken()
  if (!isLoggedIn && hasToken) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-background'>
        <IconLoader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to={Routes.SIGN_IN} replace />
  }

  return (
    <div className='relative h-full overflow-hidden bg-background'>
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onCommand={(cmd) => {
          if (cmd === '#chat') setIsChatOpen(!isChatOpen)
        }}
        currentPath={location.pathname}
      />
      <main
        id='content'
        className={`overflow-x-hidden pt-16 transition-[all] md:overflow-y-hidden md:pt-0 ${isCollapsed ? 'md:ml-14' : 'md:ml-64'} h-full`}
      >
        <Outlet />
      </main>

      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
