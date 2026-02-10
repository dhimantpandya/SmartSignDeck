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
import { NotificationBell } from '@/components/notification-bell'
import { RecentActivity } from './components/recent-sales'
import { Overview } from './components/overview'
import { useState, useRef } from 'react'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconLayout, IconDeviceTv, IconCircleCheck } from '@tabler/icons-react'
import { Analytics } from './components/analytics'
import { useQuery } from '@tanstack/react-query'
import { screenService, templateService, apiService } from '@/api'
import { signageService } from '@/api/signage.service'
import { format, subDays } from 'date-fns'
import html2canvas from 'html2canvas'
import { useToast } from '@/components/ui/use-toast'

import { useAuth } from '@/hooks/use-auth'

import { useNavigate } from 'react-router-dom'
import { Routes } from '@/utilities/routes'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const dashboardRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(event.target.value)

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['signage-stats', user?.companyId],
    queryFn: () => signageService.getStats(),
    enabled: !!user,
  })

  const { data: recentScreens, isLoading: isScreensLoading } = useQuery({
    queryKey: ['recent-screens', user?.id],
    queryFn: () => screenService.getScreens({ limit: 5, createdBy: user?.id, sortBy: 'created_at:desc' }),
  })

  const { data: recentTemplates, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ['recent-templates', user?.id],
    queryFn: () => templateService.getTemplates({ limit: 5, createdBy: user?.id, sortBy: 'created_at:desc' }),
  })

  const { data: timelineData } = useQuery({
    queryKey: ['analytics-timeline-dashboard', user?.companyId],
    queryFn: () =>
      apiService.get<any>(
        `/v1/analytics/timeline?startDate=${format(subDays(new Date(), 7), 'yyyy-MM-dd')}&endDate=${format(new Date(), 'yyyy-MM-dd')}&interval=day`
      ),
    enabled: !!user?.companyId
  })

  // Combine and sort by date
  const recentActivity = [
    ...(recentScreens?.results || []).map(s => ({ ...s, type: 'screen' })),
    ...(recentTemplates?.results || []).map(t => ({ ...t, type: 'template' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const handleDownload = async () => {
    if (!dashboardRef.current) return

    try {
      toast({ title: 'Generating Dashboard Screenshot...' })
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const link = document.createElement('a')
      link.download = `smartsigndeck-dashboard-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast({ title: 'Dashboard saved successfully' })
    } catch (error) {
      toast({ title: 'Screenshot failed', variant: 'destructive' })
    }
  }

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
          <NotificationBell />
          <UserNav />
        </div>
      </Layout.Header>

      {/* ===== Main ===== */}
      <Layout.Body>
        <div ref={dashboardRef} className='p-1'>
          <BreadcrumbNavigation items={breadcrumbItems} />

          <div className='mb-6 flex items-center justify-between space-y-2'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Welcome back, {user?.first_name}!</h1>
              <p className='text-muted-foreground'>
                Here's what's happening with your workspace today.
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <Button onClick={handleDownload}>Download Reports</Button>
            </div>
          </div>

          <Tabs
            orientation='vertical'
            value={activeTab}
            onValueChange={setActiveTab}
            className='space-y-4'
          >
            <div className='w-full overflow-x-auto pb-2'>
              <TabsList>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger value='templates' className='gap-2'>
                  <IconLayout size={16} /> Templates ({stats?.totalTemplates ?? 0})
                </TabsTrigger>
                <TabsTrigger value='screens' className='gap-2'>
                  <IconDeviceTv size={16} /> Screens ({stats?.totalScreens ?? 0})
                </TabsTrigger>
                <TabsTrigger value='online' className='gap-2 text-green-600 dark:text-green-400'>
                  <IconCircleCheck size={16} /> Online ({stats?.onlineScreens ?? 0})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='overview' className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <Analytics stats={stats} isLoading={isStatsLoading} />
              </div>
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                <Card className='col-span-1 lg:col-span-4'>
                  <CardHeader>
                    <CardTitle>Weekly Impressions</CardTitle>
                    <CardDescription>
                      Total playback activity across all screens.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='pl-2'>
                    <Overview data={timelineData} />
                  </CardContent>
                </Card>
                <div className='col-span-1 lg:col-span-3 space-y-4'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Standard operations for your signage.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="flex flex-col h-20 gap-1" onClick={() => navigate(`${Routes.TEMPLATES}?create=true`)}>
                        <IconLayout size={20} />
                        <span className="text-xs">New Template</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col h-20 gap-1" onClick={() => navigate(`${Routes.SCREENS}?create=true`)}>
                        <IconDeviceTv size={20} />
                        <span className="text-xs">Add Screen</span>
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest {recentActivity.length} items added to your workspace.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentActivity items={recentActivity} isLoading={isScreensLoading || isTemplatesLoading} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='templates' className='space-y-4'>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Workspace Templates</CardTitle>
                    <CardDescription>Your custom design layouts.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => navigate(Routes.TEMPLATES)}>
                    <IconLayout size={16} className="mr-2" /> Manage All
                  </Button>
                </CardHeader>
                <CardContent>
                  <RecentActivity
                    items={(recentTemplates?.results || []).map(t => ({ ...t, type: 'template' }))}
                    isLoading={isTemplatesLoading}
                  />
                  {(recentTemplates?.results || []).length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">No templates found in your workspace.</p>
                      <Button onClick={() => navigate(Routes.TEMPLATES)}>Create First Template</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='screens' className='space-y-4'>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Smart Screens</CardTitle>
                    <CardDescription>All registered displays in your network.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => navigate(Routes.SCREENS)}>
                    <IconDeviceTv size={16} className="mr-2" /> Manage All
                  </Button>
                </CardHeader>
                <CardContent>
                  <RecentActivity
                    items={(recentScreens?.results || []).map(s => ({ ...s, type: 'screen' }))}
                    isLoading={isScreensLoading}
                  />
                  {(recentScreens?.results || []).length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">No screens registered yet.</p>
                      <Button onClick={() => navigate(Routes.SCREENS)}>Add Your First Screen</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='online' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Active Screens</CardTitle>
                  <CardDescription>Screens that are currently broadcasting content.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity
                    items={(recentScreens?.results || []).filter(s => s.status === 'online').map(s => ({ ...s, type: 'screen' }))}
                    isLoading={isScreensLoading}
                  />
                  {(recentScreens?.results || []).filter(s => s.status === 'online').length === 0 && (
                    <p className="text-center py-10 text-muted-foreground">No screens are currently online.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout.Body>
    </Layout>
  )
}
