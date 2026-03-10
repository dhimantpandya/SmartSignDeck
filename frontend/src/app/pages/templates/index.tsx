import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { NotificationBell } from '@/components/notification-bell'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconLayout, IconPlus, IconTrash, IconEdit, IconCopy } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState, useEffect } from 'react'
import TemplateEditor from './components/template-editor'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/api/template.service'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Globe, Lock, User, Eye, FolderPlus, Folder, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams } from 'react-router-dom'
import { PreviewModal } from '@/components/preview-modal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { templateGroupService } from '@/api/template-group.service'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { CollaborateDialog } from './components/collaborate-dialog'
import { useNotifications } from '@/components/nav-notification-provider'


export default function Templates() {
    const { user } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const [showEditor, setShowEditor] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [previewTemplate, setPreviewTemplate] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'my-templates' | 'shared' | 'global' | 'groups'>('my-templates')
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null)
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDesc, setNewGroupDesc] = useState('')
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
    const [isCollaborateOpen, setIsCollaborateOpen] = useState(false)
    const [selectedTemplateForCollab, setSelectedTemplateForCollab] = useState<any>(null)
    const queryClient = useQueryClient()
    const { socket } = useNotifications()

    // Real-time global template updates via socket
    useEffect(() => {
        if (!socket) return

        const invalidateTemplates = () => {
            // Invalidate everything under 'templates' to catch Global, My Templates, and Metadata (Last Changed By) updates
            queryClient.invalidateQueries({ queryKey: ['templates'] })
        }

        socket.on('template_published', invalidateTemplates)
        socket.on('template_deleted', invalidateTemplates)
        socket.on('template_updated', invalidateTemplates)

        return () => {
            socket.off('template_published', invalidateTemplates)
            socket.off('template_deleted', invalidateTemplates)
            socket.off('template_updated', invalidateTemplates)
        }
    }, [socket, queryClient])

    const toggleTemplateSelection = (id: string) => {
        setSelectedTemplates(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        )
    }

    const clearSelection = () => setSelectedTemplates([])

    const selectAll = (templates: any[]) => {
        const ids = templates.map(t => t.id)
        setSelectedTemplates(ids)
    }

    const isAllSelected = (templates: any[]) => {
        return templates.length > 0 && templates.every(t => selectedTemplates.includes(t.id))
    }

    const handleSelectAll = (templates: any[]) => {
        if (isAllSelected(templates)) {
            clearSelection()
        } else {
            selectAll(templates)
        }
    }

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setShowEditor(true)
            // Remove the param after using it
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('create')
            setSearchParams(nextParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

    // Query for user's own templates (All personal work, public or private)
    const { data: myTemplatesData, isLoading: isLoadingMy } = useQuery({
        queryKey: ['templates', 'my', user?.id],
        queryFn: () => templateService.getTemplates({ createdBy: user?.id, sortBy: 'created_at:desc' }),
        enabled: !!user?.id,
    })

    // Query for template groups
    const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
        queryKey: ['template-groups', user?.id],
        queryFn: () => templateGroupService.getGroups({ createdBy: user?.id }),
        enabled: !!user?.id,
    })

    // Query for global public templates
    const { data: globalTemplatesData, isLoading: isLoadingGlobal } = useQuery({
        queryKey: ['templates', 'global'],
        queryFn: () => templateService.getTemplates({ isPublic: true, sortBy: 'created_at:desc' }),
        enabled: true,
    })

    // Query for templates shared with the user (where user is a collaborator)
    const { data: sharedWithMeData, isLoading: isLoadingSharedWithMe } = useQuery({
        queryKey: ['templates', 'shared-with-me', user?.id],
        queryFn: async () => {
            console.log('[DEBUG] Fetching shared-with-me for user:', user?.id);
            const res = await templateService.getTemplates({ collaborators: user?.id, sortBy: 'created_at:desc' });
            console.log('[DEBUG] shared-with-me results:', res.results);
            return res;
        },
        enabled: !!user?.id,
    })

    // Query for templates shared BY the user (owned by user and have collaborators)
    const { data: sharedByMeData, isLoading: isLoadingSharedByMe } = useQuery({
        queryKey: ['templates', 'shared-by-me', user?.id],
        queryFn: async () => {
            console.log('[DEBUG] Fetching shared-by-me for user:', user?.id);
            const result = await templateService.getTemplates({ createdBy: user?.id, sortBy: 'created_at:desc' })
            // Filter only those that have at least one collaborator
            if (result.results) {
                result.results = result.results.filter((t: any) => t.collaborators && t.collaborators.length > 0)
            }
            console.log('[DEBUG] shared-by-me results (after filter):', result.results);
            return result
        },
        enabled: !!user?.id,
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

    const createGroupMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) => templateGroupService.createGroup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['template-groups'] })
            toast({ title: 'Group created', description: 'Template group created successfully.' })
            setIsCreateGroupOpen(false)
            setNewGroupName('')
            setNewGroupDesc('')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => templateService.deleteTemplate(id),
        onMutate: async (id) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['templates'] })

            // Snapshot the previous value
            const previousQueries = queryClient.getQueriesData({ queryKey: ['templates'] })

            // Optimistically update to the new value across all relevant template queries
            queryClient.setQueriesData({ queryKey: ['templates'] }, (old: any) => {
                if (!old || !old.results) return old
                return {
                    ...old,
                    results: old.results.filter((t: any) => (t.id || t._id) !== id)
                }
            })

            // Trigger toast instantly
            toast({ title: 'Template moved to Recycle Bin', description: 'You can restore it within 30 days.' })

            return { previousQueries }
        },
        onError: (error: any, __, context: any) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
                    queryClient.setQueryData(queryKey, oldData)
                })
            }
            toast({
                title: 'Operation Failed',
                description: error?.message || 'Failed to move template to Recycle Bin.',
                variant: 'destructive',
            })
        },
        onSettled: () => {
            // Always refetch after error or success to ensure sync
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            queryClient.invalidateQueries({ queryKey: ['template-groups'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => templateService.bulkDeleteTemplates(ids),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: ['templates'] })
            const previousQueries = queryClient.getQueriesData({ queryKey: ['templates'] })

            queryClient.setQueriesData({ queryKey: ['templates'] }, (old: any) => {
                if (!old || !old.results) return old
                return {
                    ...old,
                    results: old.results.filter((t: any) => !ids.includes(t.id || t._id))
                }
            })

            return { previousQueries }
        },
        onSuccess: (data: any) => {
            const deletedCount = data.deletedCount || 0
            const errors = data.errors || []

            if (deletedCount > 0) {
                toast({
                    title: 'Bulk Action Completed',
                    description: `${deletedCount} templates moved to Recycle Bin.${errors.length > 0 ? ` (${errors.length} failed)` : ''}`
                })
            }

            if (errors.length > 0) {
                toast({
                    title: 'Partial Success',
                    description: `Some templates couldn't be deleted: ${errors[0]}${errors.length > 1 ? ` and ${errors.length - 1} more` : ''}`,
                    variant: 'destructive'
                })
            }

            clearSelection()
        },
        onError: (error: any, __, context: any) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
                    queryClient.setQueryData(queryKey, oldData)
                })
            }
            toast({
                title: 'Bulk Deletion Failed',
                description: error?.message || 'Failed to delete some templates.',
                variant: 'destructive'
            })
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            queryClient.invalidateQueries({ queryKey: ['template-groups'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        }
    })

    const cloneMutation = useMutation({
        mutationFn: (id: string) => templateService.cloneTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates', 'my'] })
            toast({ title: 'Template saved successfully', description: 'It has been added to your personal templates.' })
        },
        onError: (error: any) => {
            toast({
                title: 'Operation failed',
                description: error?.response?.data?.message || 'Failed to save template',
                variant: 'destructive',
            })
        },
    })

    const assignToGroupMutation = useMutation({
        mutationFn: (data: { groupId: string; templateId: string }) =>
            templateGroupService.addTemplatesToGroup(data.groupId, [data.templateId]),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['template-groups'] })
            toast({ title: 'Template assigned', description: 'Template added to group successfully.' })
        },
    })

    const removeFromGroupMutation = useMutation({
        mutationFn: (data: { groupId: string; templateId: string }) =>
            templateGroupService.removeTemplatesFromGroup(data.groupId, [data.templateId]),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['template-groups'] })
            toast({ title: 'Removed from group', description: 'Template removed from this collection.' })
        },
        onError: (error: any) => {
            toast({
                title: 'Operation Failed',
                description: error?.message || 'Failed to remove template from group.',
                variant: 'destructive',
            })
        },
    })

    const deleteGroupMutation = useMutation({
        mutationFn: (id: string) => templateGroupService.deleteGroup(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['template-groups'] })
            if (selectedGroupId === id) {
                setSelectedGroupId(null)
            }
            toast({ title: 'Group deleted', description: 'Template group moved to Recycle Bin.' })
        },
        onError: (error: any) => {
            toast({
                title: 'Deletion Failed',
                description: error?.message || 'Failed to delete template group.',
                variant: 'destructive',
            })
        },
    })

    const breadcrumbItems = [
        { href: '/', icon: <IconHome size={18} /> },
        { label: 'Templates', icon: <IconLayout size={18} /> },
    ]

    const handleEdit = (template: any) => {
        setEditingTemplate(template)
        setShowEditor(true)
    }

    const handleCreate = () => {
        setEditingTemplate(null)
        setShowEditor(true)
    }

    const handleClone = (templateId: string) => {
        cloneMutation.mutate(templateId)
    }

    const checkIsOwner = (template: any) => {
        if (!template || !user) return false;

        // 1. Get Template Creator ID
        let createdById = null;
        if (typeof template.createdBy === 'string') {
            createdById = template.createdBy;
        } else if (template.createdBy && typeof template.createdBy === 'object') {
            createdById = template.createdBy.id || template.createdBy._id;
        }

        // 2. Get Current User ID
        const currentUserId = user.id || (user as any)._id;

        // 3. Compare safely
        if (!createdById || !currentUserId) return false;

        return createdById.toString() === currentUserId.toString();
    }

    const renderTemplateCard = (template: any, isOwner: boolean, inGroupView: boolean = false, isGlobalView: boolean = false) => {
        let lastModifiedBlock = null;
        if (template.lastModifiedBy) {
            const modifierDate = template.updated_at ? new Date(template.updated_at) : new Date(template.created_at);

            // Format modifier time as e.g. "Sunday 11:48 PM"
            const options: Intl.DateTimeFormatOptions = { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true };
            const timeStr = modifierDate.toLocaleDateString(undefined, options).replace(/, /g, ' ');

            lastModifiedBlock = (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Last changed by: <span className="font-bold text-foreground">
                            {template.lastModifiedBy.first_name} {template.lastModifiedBy.last_name || ''}
                        </span> at {timeStr}
                    </span>
                </div>
            );
        }

        return (
            <Card key={template.id} className="overflow-hidden flex flex-col h-full">
                <CardHeader className="bg-muted/50 pb-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={selectedTemplates.includes(template.id)}
                                onCheckedChange={() => toggleTemplateSelection(template.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        {template.isPublic ? <Badge variant="secondary" className="gap-1"><Globe size={10} /> Global</Badge> : <Badge variant="outline" className="gap-1"><Lock size={10} /> Private</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="pt-4 flex-grow">
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span>Resolution: {template.resolution}</span>
                        <span>Zones: {template.zones.length}</span>
                        <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                        {template.createdBy && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                <span className="text-xs font-medium text-foreground">
                                    Created by : {template.createdBy.first_name} {template.createdBy.last_name} {checkIsOwner(template) ? '(You)' : ''}
                                </span>
                            </div>
                        )}
                        {lastModifiedBlock}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/20 px-4 py-2 shrink-0">
                    <div className="flex gap-1">
                        {inGroupView ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:bg-destructive/10"
                                onClick={() => removeFromGroupMutation.mutate({ groupId: selectedGroupId!, templateId: template.id })}
                                title="Remove from Group"
                            >
                                <FolderPlus className="h-4 w-4 rotate-45" />
                            </Button>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Folder className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuLabel>Assign to Group</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {groupsData?.results && groupsData.results.length > 0 ? (
                                        groupsData.results.map((group: any) => (
                                            <DropdownMenuItem
                                                key={group.id}
                                                onClick={() => assignToGroupMutation.mutate({ groupId: group.id, templateId: template.id })}
                                            >
                                                <Folder className="mr-2 h-4 w-4" />
                                                <span>{group.name}</span>
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <DropdownMenuItem disabled>No groups found</DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(template)}>
                            <Eye size={16} className="mr-1" /> Preview
                        </Button>

                        {isGlobalView ? (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleClone(template.id)}
                                loading={cloneMutation.isPending}
                            >
                                <IconCopy size={16} className="mr-2" /> Use Template
                            </Button>
                        ) : isOwner && !inGroupView ? (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                                    <IconEdit size={16} className="mr-1" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                                    setConfirmDelete(template.id)
                                }}>
                                    <IconTrash size={16} className="mr-1" /> Delete
                                </Button>
                            </>
                        ) : template.collaborators?.some((c: any) => (c.id || c._id || c) === user?.id) && !inGroupView ? (
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => handleEdit(template)}
                            >
                                <Users size={16} className="mr-2" /> Edit Together
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                {isOwner && !inGroupView && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 border-primary/20 hover:bg-primary/5 text-primary"
                                        onClick={() => {
                                            setSelectedTemplateForCollab(template)
                                            setIsCollaborateOpen(true)
                                        }}
                                    >
                                        <Users size={14} /> Collaborate
                                    </Button>
                                )}
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleClone(template.id)}
                                    loading={cloneMutation.isPending}
                                >
                                    <IconCopy size={16} className="mr-2" /> Use Template
                                </Button>
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        )
    }

    const myTemplates = myTemplatesData?.results || []
    const globalTemplates = (globalTemplatesData?.results || []).filter((t: any) => t.createdBy)

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



                <div className='mb-1 flex items-center justify-between space-y-2'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <IconLayout size={24} className='text-primary' />
                            <h1 className='text-2xl font-bold tracking-tight'>Templates</h1>
                        </div>
                        <p className='text-muted-foreground text-sm'>
                            Design your signage layouts using zones.
                        </p>
                    </div>
                    {!showEditor && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsCreateGroupOpen(true)}>
                                <FolderPlus className='mr-2' size={18} />
                                Create Group
                            </Button>
                            <Button onClick={handleCreate}>
                                <IconPlus className='mr-2' size={18} />
                                Create Template
                            </Button>
                        </div>
                    )}
                </div>

                {selectedTemplates.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-2 border-r pr-6">
                            <Badge variant="default" className="rounded-full h-6 w-6 flex items-center justify-center p-0">
                                {selectedTemplates.length}
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
                                onClick={() => setConfirmBulkDelete(true)}
                                className="h-9 px-6 rounded-full gap-2"
                                loading={bulkDeleteMutation.isPending}
                            >
                                <IconTrash size={16} />
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                )}

                {showEditor ? (
                    <TemplateEditor
                        initialData={editingTemplate}
                        onCancel={() => {
                            setShowEditor(false)
                            setEditingTemplate(null)
                        }}
                    />
                ) : (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-6">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="my-templates" className="gap-2">
                                <User size={16} />
                                My Templates ({myTemplates.length})
                            </TabsTrigger>
                            <TabsTrigger value="shared" className="gap-2">
                                <Users size={16} />
                                Shared ({(sharedWithMeData?.results?.length || 0) + (sharedByMeData?.results?.length || 0)})
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="gap-2">
                                <Folder size={16} />
                                Groups ({groupsData?.results?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="global" className="gap-2">
                                <Globe size={16} />
                                Global ({globalTemplates.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-templates" className="mt-6">
                            {isLoadingMy ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : myTemplates.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-muted/30 rounded-lg border">
                                        <Checkbox
                                            id="select-all-my"
                                            checked={isAllSelected(myTemplates)}
                                            onCheckedChange={() => handleSelectAll(myTemplates)}
                                        />
                                        <label htmlFor="select-all-my" className="text-sm font-medium cursor-pointer flex-1">
                                            Select All Templates ({myTemplates.length})
                                        </label>
                                    </div>
                                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                        {myTemplates.map((template: any) => renderTemplateCard(template, true, false))}
                                    </div>
                                </>
                            ) : (
                                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
                                    <IconLayout size={48} className='mb-4 text-muted-foreground' />
                                    <h2 className='text-xl font-semibold'>No templates yet</h2>
                                    <p className='mb-6 text-muted-foreground'>
                                        Start by creating your first design layout.
                                    </p>
                                    <Button onClick={handleCreate}>
                                        Get Started
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="shared" className="mt-6">
                            <Tabs defaultValue="received" className="w-full">
                                <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
                                    <TabsTrigger value="received" className="rounded-lg px-6">
                                        Received ({sharedWithMeData?.results?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="sent" className="rounded-lg px-6">
                                        Sent ({sharedByMeData?.results?.length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="received">
                                    {isLoadingSharedWithMe ? (
                                        <div className="flex h-64 items-center justify-center">
                                            <Loader />
                                        </div>
                                    ) : (sharedWithMeData?.results?.length || 0) > 0 ? (
                                        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                            {sharedWithMeData?.results.map((template: any) =>
                                                renderTemplateCard(template, checkIsOwner(template), false)
                                            )}
                                        </div>
                                    ) : (
                                        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
                                            <Users size={48} className='mb-4 text-muted-foreground' />
                                            <h2 className='text-xl font-semibold'>No received templates</h2>
                                            <p className='text-muted-foreground text-sm max-w-xs'>
                                                Templates shared with you by others will appear here.
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="sent">
                                    {isLoadingSharedByMe ? (
                                        <div className="flex h-64 items-center justify-center">
                                            <Loader />
                                        </div>
                                    ) : (sharedByMeData?.results?.length || 0) > 0 ? (
                                        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                            {sharedByMeData?.results.map((template: any) =>
                                                renderTemplateCard(template, true, false)
                                            )}
                                        </div>
                                    ) : (
                                        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
                                            <Users size={48} className='mb-4 text-muted-foreground' />
                                            <h2 className='text-xl font-semibold'>No sent shares</h2>
                                            <p className='text-muted-foreground text-sm max-w-xs'>
                                                Templates you have shared with others will appear here.
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </TabsContent>

                        <TabsContent value="groups" className="mt-6">
                            {isLoadingGroups ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : groupsData?.results && groupsData.results.length > 0 ? (
                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                    {groupsData.results.map((group: any) => (
                                        <Card key={group.id} className="overflow-hidden border-dashed border-2 hover:border-primary transition-colors cursor-pointer group">
                                            <CardHeader className="bg-muted/30 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Folder className="text-primary h-5 w-5" />
                                                        <CardTitle className="text-lg">{group.name}</CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{group.templates?.length || 0} Templates</Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmDeleteGroup(group.id);
                                                            }}
                                                        >
                                                            <IconTrash size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-4 h-24">
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {group.description || 'No description provided.'}
                                                </p>
                                            </CardContent>
                                            <CardFooter className="flex justify-between border-t bg-muted/10 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                                    Topic Collection
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs font-bold"
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
                                    <Folder size={48} className='mb-4 text-muted-foreground' />
                                    <h2 className='text-xl font-semibold'>No groups yet</h2>
                                    <p className='mb-6 text-muted-foreground text-sm max-w-xs'>
                                        Group related templates for topics like Hotels, Retail, or Events.
                                    </p>
                                    <Button onClick={() => setIsCreateGroupOpen(true)}>
                                        Organize Now
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

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
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-1"
                                                    onClick={() => {
                                                        setEditingTemplate({
                                                            name: `New Template for ${selectedGroup.name}`,
                                                            resolution: '1920x1080',
                                                            zones: [],
                                                            autoAssignGroupId: selectedGroup.id
                                                        });
                                                        setShowEditor(true);
                                                    }}
                                                >
                                                    <IconPlus size={14} /> Create Template
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedGroupId(null)}>
                                                    Close Collection
                                                </Button>
                                            </div>
                                        </div>
                                        {selectedGroup.templates?.length > 0 ? (
                                            <>
                                                <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-muted/30 rounded-lg border">
                                                    <Checkbox
                                                        id="select-all-group"
                                                        checked={isAllSelected(selectedGroup.templates)}
                                                        onCheckedChange={() => handleSelectAll(selectedGroup.templates)}
                                                    />
                                                    <label htmlFor="select-all-group" className="text-sm font-medium cursor-pointer flex-1">
                                                        Select All Templates ({selectedGroup.templates.length})
                                                    </label>
                                                </div>
                                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                                    {selectedGroup.templates.map((template: any) => renderTemplateCard(template, checkIsOwner(template), true))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-12 text-center bg-muted/20 rounded-xl border border-dashed">
                                                <p className="text-muted-foreground">No templates assigned to this group yet.</p>
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        )}


                        <TabsContent value="global" className="mt-6">
                            {isLoadingGlobal ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : globalTemplates.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-muted/30 rounded-lg border">
                                        <Checkbox
                                            id="select-all-global"
                                            checked={isAllSelected(globalTemplates)}
                                            onCheckedChange={() => handleSelectAll(globalTemplates)}
                                        />
                                        <label htmlFor="select-all-global" className="text-sm font-medium cursor-pointer flex-1">
                                            Select All Templates ({globalTemplates.length})
                                        </label>
                                    </div>
                                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                        {globalTemplates.map((template: any) => renderTemplateCard(template, checkIsOwner(template), false, true))}
                                    </div>
                                </>
                            ) : (
                                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
                                    <Globe size={48} className='mb-4 text-muted-foreground' />
                                    <h2 className='text-xl font-semibold'>No global templates available</h2>
                                    <p className='text-muted-foreground'>
                                        Public templates from other users will appear here.
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                <PreviewModal
                    isOpen={!!previewTemplate}
                    onClose={() => setPreviewTemplate(null)}
                    template={previewTemplate}
                />

                <ConfirmationDialog
                    isOpen={!!confirmDelete}
                    title="Move to Recycle Bin"
                    message="Are you sure you want to move this template to the Recycle Bin? You can restore it within 30 days."
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

                <ConfirmationDialog
                    isOpen={!!confirmDeleteGroup}
                    title="Move Group to Recycle Bin"
                    message="Are you sure you want to move this group to the Recycle Bin? All templates within this group will also be moved to the Recycle Bin."
                    variant="destructive"
                    confirmBtnText="Move Group to Trash"
                    onConfirm={() => {
                        if (confirmDeleteGroup) {
                            deleteGroupMutation.mutate(confirmDeleteGroup)
                        }
                        setConfirmDeleteGroup(null)
                    }}
                    onClose={() => setConfirmDeleteGroup(null)}
                />

                <ConfirmationDialog
                    isOpen={confirmBulkDelete}
                    title="Bulk Move to Trash"
                    message={`Are you sure you want to move ${selectedTemplates.length} templates to the Recycle Bin?`}
                    variant="destructive"
                    confirmBtnText="Move to Trash"
                    onConfirm={() => {
                        bulkDeleteMutation.mutate(selectedTemplates)
                        setConfirmBulkDelete(false)
                    }}
                    onClose={() => setConfirmBulkDelete(false)}
                />

                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Template Group</DialogTitle>
                            <DialogDescription>
                                Group related templates for a specific project or topic.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Group Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Grand Hotel Digital Signage"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    placeholder="Entrance screens, Menus, Information boards..."
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>Cancel</Button>
                            <Button
                                onClick={() => createGroupMutation.mutate({ name: newGroupName, description: newGroupDesc })}
                                disabled={!newGroupName || createGroupMutation.isPending}
                            >
                                {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {isCollaborateOpen && selectedTemplateForCollab && (
                    <CollaborateDialog
                        isOpen={isCollaborateOpen}
                        onClose={() => {
                            setIsCollaborateOpen(false)
                            setSelectedTemplateForCollab(null)
                        }}
                        templateId={selectedTemplateForCollab.id}
                        currentCollaborators={selectedTemplateForCollab.collaborators || []}
                    />
                )}
            </Layout.Body>
        </Layout>
    )
}


