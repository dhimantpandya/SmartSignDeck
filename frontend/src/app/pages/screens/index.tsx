import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { NotificationBell } from '@/components/notification-bell'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconDeviceTv, IconPlus, IconTrash, IconEdit, IconPlayerPlay, IconRefresh, IconCopy } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { Checkbox } from '@/components/ui/checkbox'
import { apiService, screenService, templateGroupService } from '@/api'
import ScreenForm from './components/screen-form'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Globe, User, Folder, Folders } from 'lucide-react'
import { useSearchParams, useParams } from 'react-router-dom'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export default function Screens() {
    const { user } = useAuth()
    const isAdvertiser = (user as any)?.role === 'advertiser'
    const { id: routeId } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const [showForm, setShowForm] = useState(false)
    const [editingScreen, setEditingScreen] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'my-screens' | 'global' | 'groups'>(isAdvertiser ? 'global' : 'my-screens')
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [selectedScreens, setSelectedScreens] = useState<string[]>([])
    const queryClient = useQueryClient()

    const toggleScreenSelection = (id: string) => {
        setSelectedScreens(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        )
    }

    const clearSelection = () => setSelectedScreens([])

    const selectAll = (screens: any[]) => {
        const ids = screens.map(s => s.id)
        setSelectedScreens(ids)
    }

    const isAllSelected = (screens: any[]) => {
        return screens.length > 0 && screens.every(s => selectedScreens.includes(s.id))
    }

    const toggleSelectAll = (screens: any[]) => {
        if (isAllSelected(screens)) {
            clearSelection()
        } else {
            selectAll(screens)
        }
    }

    useEffect(() => {
        const s = io(import.meta.env.VITE_APP_URL || 'http://localhost:5000')
        return () => { s.disconnect() }
    }, [])

    useEffect(() => {
        if (routeId) {
            // Find the screen in our data or fetch it
            const findAndEdit = async () => {
                try {
                    const screen = await screenService.getScreen(routeId)
                    if (screen) {
                        setEditingScreen(screen)
                        setShowForm(true)
                    }
                } catch (error) {
                    console.error('Failed to load screen from route:', error)
                }
            }
            findAndEdit()
        }
    }, [routeId])

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

    // Query for global public screens
    const { data: globalScreensData, isLoading: isLoadingGlobal } = useQuery({
        queryKey: ['screens', 'global'],
        queryFn: () => screenService.getScreens({ isPublic: true }),
        enabled: true,
    })

    // Query for template groups
    const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
        queryKey: ['template-groups'],
        queryFn: () => templateGroupService.getGroups({ limit: 100 }),
        enabled: true,
    })

    // Query for selected group details (ensures reactive updates)
    const { data: selectedGroup, isLoading: isLoadingSelectedGroup, isError: isGroupError } = useQuery({
        queryKey: ['template-groups', 'detail', selectedGroupId],
        queryFn: () => templateGroupService.getGroup(selectedGroupId!),
        enabled: !!selectedGroupId,
        retry: false,
    })

    useEffect(() => {
        if (isGroupError) {
            setSelectedGroupId(null)
        }
    }, [isGroupError])

    const deleteMutation = useMutation({
        mutationFn: (id: string) => screenService.deleteScreen(id),
        onMutate: async (id: string) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['screens'] })

            // Snapshot the previous value
            const previousScreens = queryClient.getQueryData(['screens', 'my'])

            // Optimistically update to the new value
            queryClient.setQueryData(['screens', 'my'], (old: any) => {
                if (!old || !old.docs) return old
                return {
                    ...old,
                    docs: old.docs.filter((s: any) => s.id !== id && s._id !== id),
                    totalDocs: (old.totalDocs || 1) - 1
                }
            })

            return { previousScreens }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }) // Update counts
            toast({ title: 'Screen moved to Recycle Bin', description: 'You can restore it within 30 days.' })
        },
        onError: (err, id, context: any) => {
            if (context?.previousScreens) {
                queryClient.setQueryData(['screens', 'my'], context.previousScreens)
            }
            toast({ title: 'Deletion failed', variant: 'destructive' })
        }
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => screenService.bulkDeleteScreens(ids),
        onMutate: async (ids: string[]) => {
            await queryClient.cancelQueries({ queryKey: ['screens'] })
            const previousScreens = queryClient.getQueryData(['screens', 'my'])

            queryClient.setQueryData(['screens', 'my'], (old: any) => {
                if (!old || !old.docs) return old
                return {
                    ...old,
                    docs: old.docs.filter((s: any) => !ids.includes(s.id) && !ids.includes(s._id)),
                    totalDocs: Math.max(0, (old.totalDocs || ids.length) - ids.length)
                }
            })

            return { previousScreens }
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            const deletedCount = data.deletedCount || selectedScreens.length
            toast({
                title: 'Bulk Action Completed',
                description: `${deletedCount} screens moved to Recycle Bin.`
            })
            clearSelection()
        },
        onError: (error: any, ids, context: any) => {
            if (context?.previousScreens) {
                queryClient.setQueryData(['screens', 'my'], context.previousScreens)
            }
            toast({
                title: 'Bulk Deletion Failed',
                description: error?.response?.data?.message || 'Failed to delete some screens.',
                variant: 'destructive'
            })
        }
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

    const handleCreate = (preselectedTemplate?: any) => {
        if (preselectedTemplate) {
            setEditingScreen({ templateId: preselectedTemplate })
        } else {
            setEditingScreen(null)
        }
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
                    <div className="flex items-center gap-3">
                        {!isAdvertiser && (
                            <Checkbox
                                checked={selectedScreens.includes(screen.id)}
                                onCheckedChange={() => toggleScreenSelection(screen.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                        <CardTitle className="text-lg">{screen.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        {screen.isPublic && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1 text-[10px]">
                                <Globe size={10} /> Global
                            </Badge>
                        )}
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${getStatusColor(screen.status)}`} />
                            {screen.status}
                        </Badge>
                    </div>
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
                                    {(screen.createdBy.first_name || '')[0]}{(screen.createdBy.last_name || '')[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">
                                Created by : {screen.createdBy.first_name} {screen.createdBy.last_name} {checkIsOwner(screen) ? '(You)' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-4 py-2">
                {/* Preview is always available */}
                <Button variant="ghost" size="sm" onClick={() => window.open(`/player/${screen.id}${screen.secretKey ? `?key=${screen.secretKey}` : ''}`, '_blank')}>
                    <IconPlayerPlay size={16} className="mr-1" /> Preview
                </Button>
                {/* Owner controls (non-advertiser) */}
                {isOwner && !isAdvertiser && (
                    <>
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
                )}
                {/* Use Screen — only for non-owners who are NOT advertisers */}
                {!isOwner && !isAdvertiser && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleClone(screen.id)}
                        loading={cloneMutation.isPending}
                    >
                        <IconCopy size={16} className="mr-2" /> Use Screen
                    </Button>
                )}
            </CardFooter>
        </Card>
    )

    const myScreens = myScreensData?.results || []
    const globalScreens = (globalScreensData?.results || []).filter((s: any) => s.createdBy)

    return (
        <Layout>
            <Layout.Header>
                <div className='ml-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <NotificationBell />
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
                    {!showForm && !isAdvertiser && (
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
                        {/* Advertisers only see Global Library */}
                        {isAdvertiser ? (
                            <TabsList className="grid w-full max-w-xs grid-cols-1">
                                <TabsTrigger value="global" className="gap-2">
                                    <Globe size={16} />
                                    <span>Global Library</span> ({globalScreens.length})
                                </TabsTrigger>
                            </TabsList>
                        ) : (
                            <TabsList className="grid w-full max-w-md grid-cols-3">
                                <TabsTrigger value="my-screens" className="gap-2">
                                    <User size={16} />
                                    <span className="hidden sm:inline">My Screens</span> ({myScreens.length})
                                </TabsTrigger>
                                <TabsTrigger value="global" className="gap-2">
                                    <Globe size={16} />
                                    <span className="hidden sm:inline">Global Library</span> ({globalScreens.length})
                                </TabsTrigger>
                                <TabsTrigger value="groups" className="gap-2">
                                    <Folders size={16} />
                                    <span className="hidden sm:inline">Groups</span> ({groupsData?.results?.length || 0})
                                </TabsTrigger>
                            </TabsList>
                        )}

                        <TabsContent value="my-screens" className="mt-6">
                            {isLoadingMy ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : myScreens.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-muted/30 rounded-lg border">
                                        <Checkbox
                                            id="select-all-my-screens"
                                            checked={isAllSelected(myScreens)}
                                            onCheckedChange={() => toggleSelectAll(myScreens)}
                                        />
                                        <label htmlFor="select-all-my-screens" className="text-sm font-medium cursor-pointer flex-1">
                                            Select All My Screens ({myScreens.length})
                                        </label>
                                    </div>
                                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                        {myScreens.map((screen: any) => renderScreenCard(screen, true))}
                                    </div>
                                </>
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
                                <>
                                    <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-muted/30 rounded-lg border">
                                        <Checkbox
                                            id="select-all-global-screens"
                                            checked={isAllSelected(globalScreens)}
                                            onCheckedChange={() => toggleSelectAll(globalScreens)}
                                        />
                                        <label htmlFor="select-all-global-screens" className="text-sm font-medium cursor-pointer flex-1">
                                            Select All Global Screens ({globalScreens.length})
                                        </label>
                                    </div>
                                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                        {globalScreens.map((screen: any) => renderScreenCard(screen, checkIsOwner(screen)))}
                                    </div>
                                </>
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

                        <TabsContent value="groups" className="mt-6">
                            {isLoadingGroups ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : (groupsData?.results?.length ?? 0) > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {groupsData?.results?.map((group: any) => (
                                        <Card
                                            key={group.id}
                                            className={`cursor-pointer transition-all hover:shadow-md ${selectedGroupId === group.id ? 'ring-2 ring-primary border-primary' : ''}`}
                                            onClick={() => setSelectedGroupId(group.id)}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                        <Folder size={20} />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-sm font-bold truncate max-w-[120px]">{group.name}</CardTitle>
                                                        <p className="text-[10px] text-muted-foreground">{group.templates?.length || 0} Templates</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardFooter className="pt-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-full text-[10px] font-bold"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedGroupId(group.id);
                                                    }}
                                                >
                                                    View Group
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
                                    <Folders size={48} className='mb-4 text-muted-foreground' />
                                    <h2 className='text-xl font-semibold'>No template groups</h2>
                                    <p className='text-muted-foreground'>
                                        Organize templates into groups in the Templates section.
                                    </p>
                                </div>
                            )}

                            {selectedGroupId && (
                                <div className="mt-8 pt-8 border-t border-dashed">
                                    {isLoadingSelectedGroup ? (
                                        <div className="flex h-32 items-center justify-center"><Loader /></div>
                                    ) : selectedGroup ? (
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="text-primary h-6 w-6" />
                                                    <h2 className="text-xl font-bold">{selectedGroup.name} Collection</h2>
                                                    <Badge variant="secondary">{selectedGroup.templates?.length || 0} Templates</Badge>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedGroupId(null)}>
                                                    Close Collection
                                                </Button>
                                            </div>
                                            {selectedGroup.templates && selectedGroup.templates.length > 0 ? (
                                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                                    {selectedGroup.templates.map((template: any) => (
                                                        <Card key={template.id} className="overflow-hidden bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg h-full flex flex-col">
                                                            <div className="relative aspect-video">
                                                                <div className="absolute inset-0 flex items-center justify-center bg-muted/40 overflow-hidden">
                                                                    <div className="scale-[0.15] pointer-events-none opacity-40">
                                                                        <IconDeviceTv size={120} />
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                                                                </div>
                                                                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold truncate text-foreground">{template.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{template.resolution}</span>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[9px] bg-background/50">{template.zones?.length || 0} Zones</Badge>
                                                                </div>
                                                            </div>
                                                            <CardFooter className="p-2 pt-0 mt-auto">
                                                                <Button
                                                                    variant="default"
                                                                    className="w-full h-8 gap-1 text-[11px] font-bold shadow-sm"
                                                                    onClick={() => handleCreate(template)}
                                                                >
                                                                    <IconPlus size={14} /> Create Screen
                                                                </Button>
                                                            </CardFooter>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center bg-muted/20 rounded-xl border border-dashed">
                                                    <p className="text-muted-foreground">No templates assigned to this group yet.</p>
                                                </div>
                                            )}
                                        </>
                                    ) : null}
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

                {selectedScreens.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-2 border-r pr-6">
                            <Badge variant="default" className="rounded-full h-6 w-6 flex items-center justify-center p-0">
                                {selectedScreens.length}
                            </Badge>
                            <span className="text-sm font-medium">Items Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                                className="h-9 px-4 rounded-full"
                            >
                                Clear
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    if (confirm(`${selectedScreens.length} items will be moved to Recycle Bin. Proceed?`)) {
                                        bulkDeleteMutation.mutate(selectedScreens)
                                    }
                                }}
                                className="h-9 px-6 rounded-full gap-2"
                                loading={bulkDeleteMutation.isPending}
                            >
                                <IconTrash size={16} />
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                )}
            </Layout.Body>
        </Layout>
    )
}
