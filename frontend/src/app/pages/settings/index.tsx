import { Outlet } from 'react-router-dom'
import { IconHome, IconTool, IconUser } from '@tabler/icons-react'
import { Layout } from '@/components/custom/layout'
import { Search } from '@/components/search'
import { Separator } from '@/components/ui/separator'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import SidebarNav from './components/sidebar-nav'
import { useState } from 'react'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'

export default function Settings() {
  const [searchTerm, setSearchTerm] = useState('')
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(event.target.value)

  // demonstrate how we can use multiple sections
  const breadcrumbItems = [
    { href: '/', icon: <IconHome size={18} /> },
    { href: '/', label: 'Dashboard' },
    { label: 'Settings' },
  ]
  return (
    <Layout fixed>
      {/* ===== Top Heading ===== */}
      <Layout.Header>
        <Search searchTerm={searchTerm} onChange={handleSearch} />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <UserNav />
        </div>
      </Layout.Header>

      <Layout.Body className='flex flex-col'>
        <div className='mb-2'>
          <BreadcrumbNavigation items={breadcrumbItems} />
        </div>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-8 md:space-y-2 md:overflow-hidden lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex w-full p-1 pr-4 md:overflow-y-hidden'>
            <Outlet />
          </div>
        </div>
      </Layout.Body>
    </Layout>
  )
}

const sidebarNavItems = [
  {
    title: 'Profile',
    icon: <IconUser size={18} />,
    href: '/settings',
  },
  {
    title: 'Account',
    icon: <IconTool size={18} />,
    href: '/settings/account',
  },
]
