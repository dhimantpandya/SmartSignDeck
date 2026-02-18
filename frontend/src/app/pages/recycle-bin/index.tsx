import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconTrash, IconRefresh, IconTrashX, IconClock, IconX } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { screenService } from '@/api/screen.service'
import { templateService } from '@/api/template.service'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { templateGroupService } from '@/api/template-group.service'
import { Folder } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export default function RecycleBin() {
    const [activeTab, setActiveTabOriginal] = useState('screens')
    const [confirmDelete, setConfirmDelete] = useState<{ id: string | string[], type: 'screen' | 'template' | 'group' } | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const queryClient = useQueryClient()

    const setActiveTab = (tab: string) => {
        setActiveTabOriginal(tab)
        setSelectedIds([]) // Clear selection on tab change
    }

    const { data: screensData, isLoading: isScreensLoading } = useQuery({
        queryKey: ['screens', 'trashed'],
        queryFn: () => screenService.getScreens({ trashed: 'true', sortBy: 'updated_at:desc', limit: 100 }),
    })

    const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
        queryKey: ['templates', 'trashed'],
        queryFn: () => templateService.getTemplates({ trashed: 'true', sortBy: 'updated_at:desc', limit: 100 }),
    })

    const { data: groupsData, isLoading: isGroupsLoading } = useQuery({
        queryKey: ['template-groups', 'trashed'],
        queryFn: () => templateGroupService.getGroups({ trashed: 'true', sortBy: 'updated_at:desc', limit: 100 }),
    })

    const getCurrentTabData = () => {
        if (activeTab === 'screens') return screensData?.results || []
        if (activeTab === 'templates') return templatesData?.results || []
        if (activeTab === 'groups') return groupsData?.results || []
        return []
    }

    const tabData = getCurrentTabData()
    const isAllSelected = tabData.length > 0 && selectedIds.length === tabData.length

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([])
        } else {
            setSelectedIds(tabData.map((item: any) => item.id))
        }
    }

    const toggleSelectItem = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const restoreMutation = useMutation({
        mutationFn: async ({ ids, type }: { ids: string[], type: string }) => {
            const promises = ids.map(id => {
                if (type === 'screen') return screenService.restoreScreen(id)
                if (type === 'template') return templateService.restoreTemplate(id)
                if (type === 'group') return templateGroupService.restoreGroup(id)
                return Promise.resolve()
            })
            return Promise.all(promises)
        },
        onSuccess: (_, { type }) => {
            const key = type === 'screen' ? 'screens' : type === 'template' ? 'templates' : 'template-groups'
            queryClient.invalidateQueries({ queryKey: [key] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)}s restored` })
            setSelectedIds([])
        },
    })

    const permanentDeleteMutation = useMutation({
        mutationFn: async ({ ids, type }: { ids: string[], type: string }) => {
            const promises = ids.map(id => {
                if (type === 'screen') return screenService.permanentDeleteScreen(id)
                if (type === 'template') return templateService.permanentDeleteTemplate(id)
                if (type === 'group') return templateGroupService.permanentDeleteGroup(id)
                return Promise.resolve()
            })
            return Promise.all(promises)
        },
        onSuccess: (_, { type }) => {
            const key = type === 'screen' ? 'screens' : type === 'template' ? 'templates' : 'template-groups'
            queryClient.invalidateQueries({ queryKey: [key] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)}s permanently deleted` })
            setSelectedIds([])
        },
    })

    const calculateDaysRemaining = (deletedAt: string | null | undefined) => {
        if (!deletedAt) return null
        const deleted = new Date(deletedAt)
        const purgeDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000)
        const now = new Date()
        const daysRemaining = Math.ceil((purgeDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        return daysRemaining > 0 ? daysRemaining : 0
    }

    const breadcrumbItems = [
        { href: '/', icon: <IconHome size={18} /> },
        { label: 'Recycle Bin', icon: <IconTrash size={18} /> },
    ]

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

                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Recycle Bin</h1>
                        <p className='text-muted-foreground'>
                            Items here will be permanently deleted after 30 days.
                        </p>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-4">
                            <span className="text-sm font-bold text-primary px-2">
                                {selectedIds.length} Selected
                            </span>
                            <Separator orientation="vertical" className="h-4 bg-primary/20" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:bg-primary/20 h-8"
                                onClick={() => restoreMutation.mutate({ ids: selectedIds, type: activeTab as any })}
                            >
                                <IconRefresh size={16} className="mr-1" /> Restore
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 h-8"
                                onClick={() => setConfirmDelete({ id: selectedIds, type: activeTab as any })}
                            >
                                <IconTrashX size={16} className="mr-1" /> Purge
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 p-1"
                                onClick={() => setSelectedIds([])}
                            >
                                <IconX size={16} />
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs defaultValue='screens' onValueChange={setActiveTab} className='space-y-4'>
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value='screens'>
                                Screens ({screensData?.results?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value='templates'>
                                Templates ({templatesData?.results?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value='groups'>
                                Groups ({groupsData?.results?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        {tabData.length > 0 && (
                            <div className="flex items-center gap-2 pr-2">
                                <Checkbox
                                    id="select-all"
                                    checked={isAllSelected}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <label
                                    htmlFor="select-all"
                                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Select All
                                </label>
                            </div>
                        )}
                    </div>

                    <TabsContent value='screens' className='space-y-4'>
                        {isScreensLoading ? (
                            <div className="flex h-64 items-center justify-center"><Loader /></div>
                        ) : screensData?.results && screensData.results.length > 0 ? (
                            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                {screensData.results.map((screen: any) => {
                                    const daysRemaining = calculateDaysRemaining(screen.deletedAt)
                                    const isSelected = selectedIds.includes(screen.id)
                                    return (
                                        <Card key={screen.id} className={cn("transition-all", isSelected && "ring-2 ring-primary border-primary")}>
                                            <CardHeader className="pb-2 relative">
                                                <div className="absolute top-4 right-4 z-10">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleSelectItem(screen.id)}
                                                    />
                                                </div>
                                                <CardTitle className="text-lg pr-8">{screen.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <p className="text-sm text-muted-foreground">
                                                    Deleted: {screen.deletedAt ? new Date(screen.deletedAt).toLocaleDateString() : 'Unknown'}
                                                </p>
                                                {daysRemaining !== null && (
                                                    <Badge variant={daysRemaining <= 7 ? "destructive" : "secondary"} className="gap-1">
                                                        <IconClock size={12} />
                                                        Purges in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                                                    </Badge>
                                                )}
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate({ ids: [screen.id], type: 'screen' })}>
                                                    <IconRefresh size={16} className="mr-1" /> Restore
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                                                    setConfirmDelete({ id: screen.id, type: 'screen' })
                                                }}>
                                                    <IconTrashX size={16} className="mr-1" /> Purge
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
                                <p className="text-muted-foreground">No screens in recycle bin.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value='templates' className='space-y-4'>
                        {isTemplatesLoading ? (
                            <div className="flex h-64 items-center justify-center"><Loader /></div>
                        ) : templatesData?.results && templatesData.results.length > 0 ? (
                            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                {templatesData.results.map((template: any) => {
                                    const daysRemaining = calculateDaysRemaining(template.deletedAt)
                                    const isSelected = selectedIds.includes(template.id)
                                    return (
                                        <Card key={template.id} className={cn("transition-all", isSelected && "ring-2 ring-primary border-primary")}>
                                            <CardHeader className="pb-2 relative">
                                                <div className="absolute top-4 right-4 z-10">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleSelectItem(template.id)}
                                                    />
                                                </div>
                                                <CardTitle className="text-lg pr-8">{template.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <p className="text-sm text-muted-foreground">
                                                    Deleted: {template.deletedAt ? new Date(template.deletedAt).toLocaleDateString() : 'Unknown'}
                                                </p>
                                                {daysRemaining !== null && (
                                                    <Badge variant={daysRemaining <= 7 ? "destructive" : "secondary"} className="gap-1">
                                                        <IconClock size={12} />
                                                        Purges in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                                                    </Badge>
                                                )}
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate({ ids: [template.id], type: 'template' })}>
                                                    <IconRefresh size={16} className="mr-1" /> Restore
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                                                    setConfirmDelete({ id: template.id, type: 'template' })
                                                }}>
                                                    <IconTrashX size={16} className="mr-1" /> Purge
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
                                <p className="text-muted-foreground">No templates in recycle bin.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value='groups' className='space-y-4'>
                        {isGroupsLoading ? (
                            <div className="flex h-64 items-center justify-center"><Loader /></div>
                        ) : groupsData?.results && groupsData.results.length > 0 ? (
                            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                {groupsData.results.map((group: any) => {
                                    const daysRemaining = calculateDaysRemaining(group.deletedAt)
                                    const isSelected = selectedIds.includes(group.id)
                                    return (
                                        <Card key={group.id} className={cn("transition-all", isSelected && "ring-2 ring-primary border-primary")}>
                                            <CardHeader className="pb-2 relative">
                                                <div className="absolute top-4 right-4 z-10">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleSelectItem(group.id)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 pr-8">
                                                    <Folder className="h-4 w-4 text-primary" />
                                                    <CardTitle className="text-lg">{group.name}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {group.description || 'No description provided.'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Deleted: {group.deletedAt ? new Date(group.deletedAt).toLocaleDateString() : 'Unknown'}
                                                </p>
                                                {daysRemaining !== null && (
                                                    <Badge variant={daysRemaining <= 7 ? "destructive" : "secondary"} className="gap-1">
                                                        <IconClock size={12} />
                                                        Purges in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                                                    </Badge>
                                                )}
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate({ ids: [group.id], type: 'group' })}>
                                                    <IconRefresh size={16} className="mr-1" /> Restore
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                                                    setConfirmDelete({ id: group.id, type: 'group' })
                                                }}>
                                                    <IconTrashX size={16} className="mr-1" /> Purge
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
                                <p className="text-muted-foreground">No groups in recycle bin.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <ConfirmationDialog
                    isOpen={!!confirmDelete}
                    title="Permanent Delete"
                    message={`Are you sure you want to permanently delete ${Array.isArray(confirmDelete?.id) ? `${confirmDelete.id.length} selected items` : `this ${confirmDelete?.type}`}? This action cannot be undone.`}
                    variant="destructive"
                    confirmBtnText="Delete Permanently"
                    onConfirm={() => {
                        if (confirmDelete) {
                            const ids = Array.isArray(confirmDelete.id) ? confirmDelete.id : [confirmDelete.id]
                            permanentDeleteMutation.mutate({ ids, type: confirmDelete.type })
                        }
                        setConfirmDelete(null)
                    }}
                    onClose={() => setConfirmDelete(null)}
                />
            </Layout.Body>
        </Layout>
    )
}
