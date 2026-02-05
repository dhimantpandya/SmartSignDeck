import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconChartBar, IconDownload, IconCalendar } from '@tabler/icons-react'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import html2canvas from 'html2canvas'
import { io } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { apiService } from '@/api'
import { format, subDays } from 'date-fns'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function Analytics() {
    const [dateRange, setDateRange] = useState({
        startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    })

    const { user } = useAuth()
    const queryClient = useQueryClient()
    const socketRef = useRef<any>(null)
    const dashboardRef = useRef<HTMLDivElement>(null)

    // Socket Integration for Real-time Analytics
    useEffect(() => {
        if (!user?.companyId) return

        const socket = io(import.meta.env.VITE_APP_URL || 'http://localhost:3000')

        socket.on('connect', () => {
            console.log('Analytics connected to socket')
            socket.emit('join_company', user.companyId)
        })

        socket.on('playback_update', () => {
            console.log('Real-time playback update received')

            // THROTTLE LOGIC:
            // Only refresh analytics at most once every 30 seconds
            // to prevent dashboard flickering and excessive reloads.
            if (!socketRef.current?.isThrottled) {
                socketRef.current.isThrottled = true

                setTimeout(() => {
                    console.log('Processing batch analytics update...')
                    queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
                    queryClient.invalidateQueries({ queryKey: ['analytics-timeline'] })
                    queryClient.invalidateQueries({ queryKey: ['analytics-content'] })

                    toast({
                        title: "Analytics Updated",
                        description: "New data available",
                        duration: 3000
                    })
                    if (socketRef.current) socketRef.current.isThrottled = false
                }, 30000) // 30 second delay/throttle
            }
        })

        socketRef.current = socket

        return () => {
            socket.disconnect()
        }
    }, [user, queryClient])

    const breadcrumbItems = [
        { href: '/', icon: <IconHome size={18} /> },
        { label: 'Analytics', icon: <IconChartBar size={18} /> },
    ]

    // Fetch analytics summary
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['analytics-summary', dateRange],
        queryFn: () =>
            apiService.get<any>(
                `/v1/analytics/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
            ),
    })

    // Fetch playback timeline
    const { data: timeline, isLoading: timelineLoading } = useQuery({
        queryKey: ['analytics-timeline', dateRange],
        queryFn: () =>
            apiService.get<any>(
                `/v1/analytics/timeline?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&interval=day`
            ),
    })

    // Fetch content performance
    const { data: contentPerformance, isLoading: contentLoading } = useQuery({
        queryKey: ['analytics-content', dateRange],
        queryFn: () =>
            apiService.get<any>(
                `/v1/analytics/content?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=10`
            ),
    })

    const handleDateRangeChange = (range: string) => {
        const end = new Date()
        let start: Date

        switch (range) {
            case '3days':
                start = subDays(end, 3)
                break
            case '7days':
                start = subDays(end, 7)
                break
            case '30days':
                start = subDays(end, 30)
                break
            case '90days':
                start = subDays(end, 90)
                break
            default:
                start = subDays(end, 7)
        }

        setDateRange({
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd'),
        })
    }

    const handleExport = async (type: 'csv' | 'pdf' | 'screenshot') => {
        try {
            toast({ title: `Generating ${type === 'screenshot' ? 'Screenshot' : type.toUpperCase()}...` })

            if (type === 'screenshot') {
                if (!dashboardRef.current) {
                    toast({ title: 'Dashboard not ready for capture', variant: 'destructive' })
                    return
                }

                const canvas = await html2canvas(dashboardRef.current, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: window.getComputedStyle(document.body).backgroundColor || '#ffffff'
                })

                const url = canvas.toDataURL('image/png')
                const link = document.createElement('a')
                link.href = url
                link.setAttribute(
                    'download',
                    `analytics-screenshot-${dateRange.startDate}-${dateRange.endDate}.png`
                )
                document.body.appendChild(link)
                link.click()
                link.remove()
                toast({ title: 'Screenshot capture successful' })
                return
            }

            const blob = await apiService.download(
                `/v1/analytics/export/${type}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
            )
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute(
                'download',
                `analytics-${type}-${dateRange.startDate}-${dateRange.endDate}.${type}`
            )
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast({ title: 'Export successful' })
        } catch (error) {
            toast({ title: 'Export failed', variant: 'destructive' })
        }
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        if (hours > 0) return `${hours}h ${minutes}m`
        if (minutes > 0) return `${minutes}m ${secs}s`
        return `${secs}s`
    }

    return (
        <Layout>
            <Layout.Header>
                <div className='flex w-full items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                        <BreadcrumbNavigation items={breadcrumbItems} />
                    </div>
                    <div className='flex items-center space-x-4'>
                        <ThemeSwitch />
                        <UserNav />
                    </div>
                </div>
            </Layout.Header>

            <Layout.Body>
                <div className='mb-6 flex items-center justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Analytics Dashboard</h1>
                        <p className='text-muted-foreground'>
                            Proof-of-Play insights and performance metrics
                        </p>
                    </div>
                    <div className='flex gap-2'>
                        <Select defaultValue='7days' onValueChange={handleDateRangeChange}>
                            <SelectTrigger className='w-[180px]'>
                                <IconCalendar size={16} className='mr-2' />
                                <SelectValue placeholder='Select range' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='3days'>Last 3 days</SelectItem>
                                <SelectItem value='7days'>Last 7 days</SelectItem>
                                <SelectItem value='30days'>Last 30 days</SelectItem>
                                <SelectItem value='90days'>Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(val) => handleExport(val as 'csv' | 'pdf' | 'screenshot')}>
                            <SelectTrigger className='w-[140px]'>
                                <IconDownload size={16} className='mr-2' />
                                <SelectValue placeholder='Export' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='csv'>CSV (Raw Logs)</SelectItem>
                                <SelectItem value='pdf'>PDF (Report)</SelectItem>
                                <SelectItem value='screenshot'>Screenshot (PNG)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {summaryLoading ? (
                    <div className='flex h-64 items-center justify-center'>
                        <Loader />
                    </div>
                ) : (
                    <div ref={dashboardRef}>
                        {/* KPI Cards */}
                        <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                            <Card>
                                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                    <CardTitle className='text-sm font-medium'>Total Plays</CardTitle>
                                    <IconChartBar className='h-4 w-4 text-muted-foreground' />
                                </CardHeader>
                                <CardContent>
                                    <div className='text-2xl font-bold'>
                                        {summary?.totalPlays?.toLocaleString() || 0}
                                    </div>
                                    <p className='text-xs text-muted-foreground'>
                                        Content impressions
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                    <CardTitle className='text-sm font-medium'>
                                        Total Duration
                                    </CardTitle>
                                    <IconChartBar className='h-4 w-4 text-muted-foreground' />
                                </CardHeader>
                                <CardContent>
                                    <div className='text-2xl font-bold'>
                                        {formatDuration(summary?.totalDuration || 0)}
                                    </div>
                                    <p className='text-xs text-muted-foreground'>
                                        Playback time
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                    <CardTitle className='text-sm font-medium'>
                                        Active Screens
                                    </CardTitle>
                                    <IconChartBar className='h-4 w-4 text-muted-foreground' />
                                </CardHeader>
                                <CardContent>
                                    <div className='text-2xl font-bold'>
                                        {summary?.activeScreens || 0}
                                    </div>
                                    <p className='text-xs text-muted-foreground'>
                                        Screens with activity
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                    <CardTitle className='text-sm font-medium'>
                                        Avg Duration
                                    </CardTitle>
                                    <IconChartBar className='h-4 w-4 text-muted-foreground' />
                                </CardHeader>
                                <CardContent>
                                    <div className='text-2xl font-bold'>
                                        {formatDuration(summary?.avgDuration || 0)}
                                    </div>
                                    <p className='text-xs text-muted-foreground'>
                                        Per content item
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Playback Timeline Chart */}
                        <Card className='mb-6'>
                            <CardHeader>
                                <CardTitle>Playback Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {timelineLoading ? (
                                    <div className='flex h-64 items-center justify-center'>
                                        <Loader />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width='100%' height={300}>
                                        <LineChart data={timeline || []}>
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis dataKey='period' />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type='monotone'
                                                dataKey='plays'
                                                stroke='#8884d8'
                                                name='Plays'
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Content Performance Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Content</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {contentLoading ? (
                                    <div className='flex h-64 items-center justify-center'>
                                        <Loader />
                                    </div>
                                ) : (
                                    <div className='overflow-x-auto'>
                                        <table className='w-full'>
                                            <thead>
                                                <tr className='border-b'>
                                                    <th className='pb-2 text-left'>Content URL</th>
                                                    <th className='pb-2 text-left'>Type</th>
                                                    <th className='pb-2 text-right'>Plays</th>
                                                    <th className='pb-2 text-right'>Duration</th>
                                                    <th className='pb-2 text-right'>Screens</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contentPerformance?.map((item: any, index: number) => (
                                                    <tr key={index} className='border-b'>
                                                        <td className='py-2 text-sm'>
                                                            {item.contentUrl?.substring(0, 50)}...
                                                        </td>
                                                        <td className='py-2 text-sm'>{item.contentType}</td>
                                                        <td className='py-2 text-right text-sm'>
                                                            {item.totalPlays}
                                                        </td>
                                                        <td className='py-2 text-right text-sm'>
                                                            {formatDuration(item.totalDuration)}
                                                        </td>
                                                        <td className='py-2 text-right text-sm'>
                                                            {item.screenCount}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </Layout.Body>
        </Layout>
    )
}
