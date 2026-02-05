import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconLayout, IconPlus, IconTrash, IconEdit, IconCopy } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState } from 'react'
import TemplateEditor from './components/template-editor'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/api/template.service'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Globe, Lock, User, Eye } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { VisualMap } from '@/components/visual-map'
import { PreviewModal } from '@/components/preview-modal'
import { IconArrowLeft } from '@tabler/icons-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'


export default function Templates() {
    const { user } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const [showEditor, setShowEditor] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [previewTemplate, setPreviewTemplate] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'my-templates' | 'global'>('my-templates')
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const queryClient = useQueryClient()

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setShowEditor(true)
            // Remove the param after using it
            const nextParams = new URLSearchParams(searchParams)
            nextParams.delete('create')
            setSearchParams(nextParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

    // Query for user's own templates
    const { data: myTemplatesData, isLoading: isLoadingMy } = useQuery({
        queryKey: ['templates', 'my', user?.id],
        queryFn: () => templateService.getTemplates({ createdBy: user?.id }),
        enabled: !!user?.id,
    })

    // Query for global public templates (from other users)
    const { data: globalTemplatesData, isLoading: isLoadingGlobal } = useQuery({
        queryKey: ['templates', 'global'],
        queryFn: () => templateService.getTemplates({ isPublic: true }),
        enabled: true,
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => templateService.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            queryClient.invalidateQueries({ queryKey: ['templates', 'trashed'] })
            toast({ title: 'Template deleted' })
        },
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

    const renderTemplateCard = (template: any, isOwner: boolean) => (
        <Card key={template.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isPublic ? <Badge variant="secondary" className="gap-1"><Globe size={10} /> Global</Badge> : <Badge variant="outline" className="gap-1"><Lock size={10} /> Private</Badge>}
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>Resolution: {template.resolution}</span>
                    <span>Zones: {template.zones.length}</span>
                    <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                    {template.createdBy && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={template.createdBy.avatar} />
                                <AvatarFallback className="text-xs">
                                    {template.createdBy.first_name?.[0]}{template.createdBy.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">
                                Created by: {template.createdBy.first_name} {template.createdBy.last_name} {checkIsOwner(template) ? '(You)' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-4 py-2">
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(template)}>
                    <Eye size={16} className="mr-1" /> Preview
                </Button>
                {isOwner ? (
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
                ) : (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleClone(template.id)}
                        loading={cloneMutation.isPending}
                    >
                        <IconCopy size={16} className="mr-2" /> Use Template
                    </Button>
                )}
            </CardFooter>
        </Card>
    )

    const myTemplates = myTemplatesData?.results || []
    const globalTemplates = globalTemplatesData?.results || []

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
                        <h1 className='text-2xl font-bold tracking-tight'>Templates</h1>
                        <p className='text-muted-foreground'>
                            Design your signage layouts using zones.
                        </p>
                    </div>
                    {!showEditor && (
                        <Button onClick={handleCreate}>
                            <IconPlus className='mr-2' size={18} />
                            Create Template
                        </Button>
                    )}
                </div>

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
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="my-templates" className="gap-2">
                                <User size={16} />
                                My Templates ({myTemplates.length})
                            </TabsTrigger>
                            <TabsTrigger value="global" className="gap-2">
                                <Globe size={16} />
                                Global Library ({globalTemplates.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-templates" className="mt-6">
                            {isLoadingMy ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : myTemplates.length > 0 ? (
                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                    {myTemplates.map((template: any) => renderTemplateCard(template, true))}
                                </div>
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

                        <TabsContent value="global" className="mt-6">
                            {isLoadingGlobal ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader />
                                </div>
                            ) : globalTemplates.length > 0 ? (
                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                    {globalTemplates.map((template: any) => renderTemplateCard(template, checkIsOwner(template)))}
                                </div>
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
            </Layout.Body>
        </Layout>
    )
}

