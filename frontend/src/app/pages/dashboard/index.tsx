import { Layout } from '@/components/custom/layout'
import { Button } from '@/components/custom/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Search } from '@/components/search'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { RecentActivity } from './components/recent-sales'
import { Overview } from './components/overview'
import { useState } from 'react'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome } from '@tabler/icons-react'
import { Analytics } from './components/analytics'
import { useQuery } from '@tanstack/react-query'
import { screenService } from '@/api/screen.service'

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(event.target.value)

  const { data: recentScreens, isLoading: isScreensLoading } = useQuery({
    queryKey: ['recent-screens'],
    queryFn: () => screenService.getScreens(),
  })

  const breadcrumbItems = [
    { href: '/', icon: <IconHome size={18} /> },
    { label: 'Dashboard' },
  ]

  return (
    <Layout>
      {/* ===== Top Heading ===== */}
      <Layout.Header>
        {/* <TopNav links={topNav} /> */}
        <div className='ml-auto flex items-center space-x-4'>
          <Search searchTerm={searchTerm} onChange={handleSearch} />
          <ThemeSwitch />
          <UserNav />
        </div>
      </Layout.Header>

      {/* ===== Main ===== */}
      <Layout.Body>
        <BreadcrumbNavigation items={breadcrumbItems} />

        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'>
            <Button>Download</Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Analytics />
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Weekly Impressions</CardTitle>
                </CardHeader>
                <CardContent className='pl-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest {recentScreens?.results?.length || 0} screens added.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity screens={recentScreens?.results} isLoading={isScreensLoading} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Layout.Body>
    </Layout>
  )
}
