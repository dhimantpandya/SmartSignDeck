import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconTrash, IconRefresh, IconTrashX, IconClock } from '@tabler/icons-react'
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
import { Badge } from '@/components/ui/badge'

export default function RecycleBin() {
    const [, setActiveTab] = useState('screens')
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'screen' | 'template' } | null>(null)
    const queryClient = useQueryClient()

    const { data: screensData, isLoading: isScreensLoading } = useQuery({
        queryKey: ['screens', 'trashed'],
        queryFn: () => screenService.getScreens({ trashed: 'true', sortBy: 'updated_at:desc', limit: 100 }),
    })

    const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
        queryKey: ['templates', 'trashed'],
        queryFn: () => templateService.getTemplates({ trashed: 'true', sortBy: 'updated_at:desc', limit: 100 }),
    })

    const restoreScreenMutation = useMutation({
        mutationFn: (id: string) => screenService.restoreScreen(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            toast({ title: 'Screen restored' })
        },
    })

    const permanentDeleteScreenMutation = useMutation({
        mutationFn: (id: string) => screenService.permanentDeleteScreen(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            toast({ title: 'Screen permanently deleted' })
        },
    })

    const restoreTemplateMutation = useMutation({
        mutationFn: (id: string) => templateService.restoreTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            toast({ title: 'Template restored' })
        },
    })

    const permanentDeleteTemplateMutation = useMutation({
        mutationFn: (id: string) => templateService.permanentDeleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            toast({ title: 'Template permanently deleted' })
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

                <div className='mb-6'>
                    <h1 className='text-2xl font-bold tracking-tight'>Recycle Bin</h1>
                    <p className='text-muted-foreground'>
                        Items here will be permanently deleted after 30 days.
                    </p>
                </div>

                <Tabs defaultValue='screens' onValueChange={setActiveTab} className='space-y-4'>
                    <TabsList>
                        <TabsTrigger value='screens'>
                            Screens ({screensData?.results?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value='templates'>
                            Templates ({templatesData?.results?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value='screens' className='space-y-4'>
                        {isScreensLoading ? (
                            <div className="flex h-64 items-center justify-center"><Loader /></div>
                        ) : screensData?.results && screensData.results.length > 0 ? (
                            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                {screensData.results.map((screen: any) => {
                                    const daysRemaining = calculateDaysRemaining(screen.deletedAt)
                                    return (
                                        <Card key={screen.id}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">{screen.name}</CardTitle>
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
                                                <Button variant="outline" size="sm" onClick={() => restoreScreenMutation.mutate(screen.id)}>
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
                                    return (
                                        <Card key={template.id}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
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
                                                <Button variant="outline" size="sm" onClick={() => restoreTemplateMutation.mutate(template.id)}>
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
                </Tabs>

                <ConfirmationDialog
                    isOpen={!!confirmDelete}
                    title="Permanent Delete"
                    message={`Are you sure you want to permanently delete this ${confirmDelete?.type}? This action cannot be undone.`}
                    variant="destructive"
                    confirmBtnText="Delete Permanently"
                    onConfirm={() => {
                        if (confirmDelete?.type === 'screen') {
                            permanentDeleteScreenMutation.mutate(confirmDelete.id)
                        } else if (confirmDelete?.type === 'template') {
                            permanentDeleteTemplateMutation.mutate(confirmDelete.id)
                        }
                        setConfirmDelete(null)
                    }}
                    onClose={() => setConfirmDelete(null)}
                />
            </Layout.Body>
        </Layout>
    )
}
