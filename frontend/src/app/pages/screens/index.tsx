import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconDeviceTv, IconPlus, IconTrash, IconEdit, IconPlayerPlay, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { apiService } from '@/api'
import ScreenForm from './components/screen-form'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

export default function Screens() {
    const { user } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [editingScreen, setEditingScreen] = useState<any>(null)
    const queryClient = useQueryClient()

    useEffect(() => {
        const s = io(import.meta.env.VITE_APP_URL || 'http://localhost:5000')
        return () => { s.disconnect() }
    }, [])

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['screens'],
        queryFn: () => apiService.get<{ results: any[] }>('/v1/screens'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiService.delete(`/v1/screens/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            queryClient.invalidateQueries({ queryKey: ['screens', 'trashed'] })
            toast({ title: 'Screen deleted' })
        },
    })

    const breadcrumbItems = [
        { href: '/', icon: <IconHome size={18} /> },
        { label: 'Screens', icon: <IconDeviceTv size={18} /> },
    ]

    const handleEdit = (screen: any) => {
        setEditingScreen(screen)
        setShowForm(true)
    }

    const handleCreate = () => {
        setEditingScreen(null)
        setShowForm(true)
    }

    const handleForceRefresh = async (screenId: string) => {
        try {
            await apiService.post(`/v1/screens/${screenId}/refresh`, {})
            toast({ title: 'Refresh command sent' })
        } catch (error) {
            toast({ title: 'Failed to send refresh command', variant: 'destructive' })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-500'
            case 'offline': return 'bg-gray-500'
            case 'maintenance': return 'bg-yellow-500'
            default: return 'bg-blue-500'
        }
    }

    return (
        <Layout>
            <Layout.Header>
                <div className='ml-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <UserNav />
                </div>
            </Layout.Header>

            <Layout.Body>
                <BreadcrumbNavigation items={breadcrumbItems} />

                <div className='mb-2 flex items-center justify-between space-y-2'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Screens</h1>
                        <p className='text-muted-foreground'>
                            Manage your physical displays and content binding.
                        </p>
                    </div>
                    {!showForm && (
                        <Button onClick={handleCreate}>
                            <IconPlus className='mr-2' size={18} />
                            Add Screen
                        </Button>
                    )}
                </div>

                {showForm ? (
                    <ScreenForm
                        initialData={editingScreen}
                        onCancel={() => {
                            setShowForm(false)
                            setEditingScreen(null)
                        }}
                    />
                ) : isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader />
                    </div>
                ) : isError ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-4 text-destructive">
                        <p>Failed to load screens. Please try again.</p>
                        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
                    </div>
                ) : data?.results && data.results.length > 0 ? (
                    <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {data.results.map((screen: any) => (
                            <Card key={screen.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{screen.name}</CardTitle>
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <span className={`h-2 w-2 rounded-full ${getStatusColor(screen.status)}`} />
                                            {screen.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                        <span>Template: {screen.templateId?.name || 'Unknown'}</span>
                                        <span>Default Zones: {Object.keys(screen.defaultContent || {}).length}</span>
                                        <span>Time Slots: {screen.schedules?.length || 0}</span>
                                        <span>Last Ping: {screen.lastPing ? new Date(screen.lastPing).toLocaleString() : 'Never'}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-4 py-2">
                                    {(user?.role === 'super_admin' || screen.companyId === user?.companyId) ? (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`/player/${screen.id}`, '_blank')}>
                                                <IconPlayerPlay size={16} className="mr-1" /> Preview
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleForceRefresh(screen.id)}>
                                                <IconRefresh size={16} className="mr-1" /> Refresh
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(screen)}>
                                                <IconEdit size={16} className="mr-1" /> Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                                                if (window.confirm('Move this screen to Recycle Bin? You can restore it within 30 days.')) {
                                                    deleteMutation.mutate(screen.id)
                                                }
                                            }}>
                                                <IconTrash size={16} className="mr-1" /> Delete
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`/player/${screen.id}`, '_blank')}>
                                                <IconPlayerPlay size={16} className="mr-1" /> View
                                            </Button>
                                            <Badge variant="outline" className="opacity-50">Global Read-Only</Badge>
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className='mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
                        <IconDeviceTv size={48} className='mb-4 text-muted-foreground' />
                        <h2 className='text-xl font-semibold'>No screens added</h2>
                        <p className='mb-6 text-muted-foreground'>
                            Assign a content skin to a template to create a screen.
                        </p>
                        <Button onClick={handleCreate}>
                            Get Started
                        </Button>
                    </div>
                )}
            </Layout.Body>
        </Layout>
    )
}
