import { useEffect, useState } from 'react'
import { IconChevronsLeft, IconMenu2, IconX } from '@tabler/icons-react'
import { Layout } from './custom/layout'
import { Button } from './custom/button'
import Nav from './nav'
import { cn, formatRole } from '@/lib/utils'
import { sidelinks } from '@/data/sidelinks'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from './nav-notification-provider'
import { NotificationBell } from './notification-bell'

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  onCommand?: (command: string) => void
  currentPath?: string
}

export default function Sidebar({
  className,
  isCollapsed,
  setIsCollapsed,
  onCommand,
  currentPath
}: SidebarProps) {
  const [navOpened, setNavOpened] = useState(false)
  const [adminRequestCount, setAdminRequestCount] = useState(0)
  const { user } = useAuth()
  const { unreadChatCounts, unreadRequestCount, clearChatBadges, clearRequestBadges } = useNotifications()

  useEffect(() => {
    if (user && user.role === 'super_admin') {
      const fetchAdminCounts = async () => {
        try {
          const { adminRequestService } = await import('@/api/admin-request.service')
          const response = await adminRequestService.getAllRequests()
          const pendingRequests = (response.data || []).filter((r: any) => r.status === 'PENDING')
          setAdminRequestCount(pendingRequests.length)
        } catch (err) {
          console.error('Failed to fetch admin counts', err)
        }
      }
      fetchAdminCounts()
    }
  }, [user])
  /* Make body not scrollable when navBar is opened */
  useEffect(() => {
    if (navOpened) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  }, [navOpened])


  const filteredLinks = sidelinks.map(link => {
    // 1. Collaboration (Chat + Requests)
    if (link.title === 'Collaboration') {
      // Total people talking to you
      const chatSenders = Object.keys(unreadChatCounts).length;
      // Total pending friend requests
      const total = chatSenders + unreadRequestCount;

      if (total > 0 && !currentPath?.includes('/collaboration')) {
        return { ...link, label: total.toString() }
      }
    }

    // 2. Admin Requests (Existing logic)
    if (link.title === 'Requests' && adminRequestCount > 0 && !currentPath?.includes('/admin/requests')) {
      return { ...link, label: adminRequestCount.toString() }
    }
    return link
  }).filter(link =>
    !link.requiredRoles || (user?.role && link.requiredRoles.includes(user.role))
  )

  // Clear logic on navigation
  useEffect(() => {
    if (currentPath?.includes('/collaboration')) {
      // Logic to clear badges contextually could be here or in page
      // For now, we clear them when the user visits the page
      if (Object.keys(unreadChatCounts).length > 0) clearChatBadges()
      if (unreadRequestCount > 0) clearRequestBadges()
    }
  }, [currentPath])

  return (
    <aside
      className={cn(
        `fixed left-0 right-0 top-0 z-50 w-full border-r-2 border-r-muted transition-[width] md:bottom-0 md:right-auto md:h-svh ${isCollapsed ? 'md:w-14' : 'md:w-64'}`,
        className
      )}
    >
      {/* Overlay in mobile */}
      <div
        onClick={() => setNavOpened(false)}
        className={`absolute inset-0 transition-[opacity] delay-100 duration-700 ${navOpened ? 'h-svh opacity-50' : 'h-0 opacity-0'} w-full bg-black md:hidden`}
      />

      <Layout fixed className={navOpened ? 'h-svh' : ''}>
        {/* Header */}
        <Layout.Header
          sticky
          className='z-50 flex justify-between px-4 py-3 shadow-sm md:px-4'
        >
          <div className={`flex items-center ${!isCollapsed ? 'gap-2' : ''}`}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 256 256'
              className={`transition-all ${isCollapsed ? 'h-6 w-6' : 'h-8 w-8'}`}
            >
              <rect width='256' height='256' fill='none'></rect>
              <line
                x1='208'
                y1='128'
                x2='128'
                y2='208'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='16'
              ></line>
              <line
                x1='192'
                y1='40'
                x2='40'
                y2='192'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='16'
              ></line>
              <span className='sr-only'>My Website</span>
            </svg>
            <div
              className={`flex flex-col justify-end truncate ${isCollapsed ? 'invisible w-0' : 'visible w-auto'}`}
            >
              <span className='font-medium'> {formatRole(user?.role)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            {/* Toggle Button in mobile */}
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden'
              aria-label='Toggle Navigation'
              aria-controls='sidebar-menu'
              aria-expanded={navOpened}
              onClick={() => setNavOpened((prev) => !prev)}
            >
              {navOpened ? <IconX /> : <IconMenu2 />}
            </Button>
          </div>
        </Layout.Header>

        {/* Navigation links */}
        <Nav
          id='sidebar-menu'
          className={`z-40 h-full flex-1 overflow-auto ${navOpened ? 'max-h-screen' : 'max-h-0 py-0 md:max-h-screen md:py-2'}`}
          closeNav={() => setNavOpened(false)}
          isCollapsed={isCollapsed}
          links={filteredLinks}
          onCommand={onCommand}
        />

        {/* Scrollbar width toggle button */}
        <Button
          onClick={() => setIsCollapsed((prev) => !prev)}
          size='icon'
          variant='outline'
          className='absolute -right-5 top-1/2 z-50 hidden rounded-full md:inline-flex'
        >
          <IconChevronsLeft
            stroke={1.5}
            className={`h-5 w-5 ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </Button>
      </Layout>
    </aside>
  )
}
