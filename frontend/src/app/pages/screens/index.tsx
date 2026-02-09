import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconDeviceTv, IconPlus, IconTrash, IconEdit, IconPlayerPlay, IconRefresh, IconCopy } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { apiService, screenService } from '@/api'
import ScreenForm from './components/screen-form'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Globe, User } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export default function Screens() {
    const { user } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const [showForm, setShowForm] = useState(false)
    const [editingScreen, setEditingScreen] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'my-screens' | 'global'>('my-screens')
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const queryClient = useQueryClient()

    useEffect(() => {
        const s = io(import.meta.env.VITE_APP_URL || 'http://localhost:5000')
        return () => { s.disconnect() }
    }, [])

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setShowForm(true)
            // Remove the param after using it
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('create')
            setSearchParams(nextParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

    // Query for user's own screens
    const { data: myScreensData, isLoading: isLoadingMy } = useQuery({
        queryKey: ['screens', 'my', user?.id],
        queryFn: () => screenService.getScreens({ createdBy: user?.id }),
        enabled: !!user?.id,
    })

    // DEBUG: Inspect Screen Data
    useEffect(() => {
        if (myScreensData?.results) {
            console.log('[Screens] Loaded myScreens:', myScreensData.results);
            myScreensData.results.forEach((s: any) => {
                if (s.secretKey && s.secretKey.length > 32) {
                    console.error('[Screens] CORRUPTED KEY DETECTED:', s.id, s.secretKey);
                }
            });
        }
    }, [myScreensData]);

    // Query for global public screens
    const { data: globalScreensData, isLoading: isLoadingGlobal } = useQuery({
        queryKey: ['screens', 'global'],
        queryFn: () => screenService.getScreens({ isPublic: true }),
        enabled: true,
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiService.delete(`/v1/screens/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            queryClient.invalidateQueries({ queryKey: ['screens', 'trashed'] })
            toast({ title: 'Screen deleted' })
        },
    })

    const cloneMutation = useMutation({
        mutationFn: (id: string) => screenService.cloneScreen(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens', 'my'] })
            toast({ title: 'Screen saved successfully', description: 'It and its template have been added to your personal screens.' })
        },
        onError: (error: any) => {
            toast({
                title: 'Operation failed',
                description: error?.response?.data?.message || 'Failed to save screen',
                variant: 'destructive',
            })
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

    const handleClone = (screenId: string) => {
        cloneMutation.mutate(screenId)
    }

    const checkIsOwner = (screen: any) => {
        if (!screen || !user) return false;
        const createdById = screen.createdBy?.id || screen.createdBy?._id || screen.createdBy;
        const currentUserId = user.id || (user as any)._id;
        return createdById?.toString() === currentUserId?.toString();
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

    const renderScreenCard = (screen: any, isOwner: boolean) => (
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
                    {screen.createdBy && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={screen.createdBy.avatar} />
                                <AvatarFallback className="text-xs">
                                    {screen.createdBy.first_name?.[0]}{screen.createdBy.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">
                                Created by: {screen.createdBy.first_name} {screen.createdBy.last_name} {checkIsOwner(screen) ? '(You)' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-4 py-2">
                {isOwner ? (
                    <>
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/player/${screen.id}${screen.secretKey ? `?key=${screen.secretKey}` : ''}`, '_blank')}>
                            <IconPlayerPlay size={16} className="mr-1" /> Preview
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleForceRefresh(screen.id)}>
                            <IconRefresh size={16} className="mr-1" /> Refresh
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(screen)}>
                            <IconEdit size={16} className="mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                            setConfirmDelete(screen.id)
                        }}>
                            <IconTrash size={16} className="mr-1" /> Delete
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/player/${screen.id}${screen.secretKey ? `?key=${screen.secretKey}` : ''}`, '_blank')}>
                            <IconPlayerPlay size={16} className="mr-1" /> Preview
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleClone(screen.id)}
                            loading={cloneMutation.isPending}
                        >
                            <IconCopy size={16} className="mr-2" /> Use Screen
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    )

    const myScreens = myScreensData?.results || []
    const globalScreens = globalScreensData?.results || []

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
                ) : (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-6">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="my-screens" className="gap-2">
                                <User size={16} />
                                My Screens ({myScreens.length})
                            </TabsTrigger>
                            <TabsTrigger value="global" className="gap-2">
                                <Globe size={16} />
                                Global Library ({globalScreens.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-screens" className="mt-6">
                            {isLoadingMy ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : myScreens.length > 0 ? (
                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                    {myScreens.map((screen: any) => renderScreenCard(screen, true))}
                                </div>
                            ) : (
                                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
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
                        </TabsContent>

                        <TabsContent value="global" className="mt-6">
                            {isLoadingGlobal ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : globalScreens.length > 0 ? (
                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                    {globalScreens.map((screen: any) => renderScreenCard(screen, checkIsOwner(screen)))}
                                </div>
                            ) : (
                                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
                                    <Globe size={48} className='mb-4 text-muted-foreground' />
                                    <h2 className='text-xl font-semibold'>No global screens available</h2>
                                    <p className='text-muted-foreground'>
                                        Public screens from other users will appear here.
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
                <ConfirmationDialog
                    isOpen={!!confirmDelete}
                    title="Move to Recycle Bin"
                    message="Are you sure you want to move this screen to the Recycle Bin? You can restore it within 30 days."
                    variant="destructive"
                    confirmBtnText="Move to Trash"
                    onConfirm={() => {
                        if (confirmDelete) {
                            deleteMutation.mutate(confirmDelete)
                        }
                        setConfirmDelete(null)
                    }}
                    onClose={() => setConfirmDelete(null)}
                />
            </Layout.Body>
        </Layout>
    )
}
