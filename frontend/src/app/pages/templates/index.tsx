import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconLayout, IconPlus, IconTrash, IconEdit } from '@tabler/icons-react'
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
import { Globe, Lock } from 'lucide-react'

export default function Templates() {
    const { user } = useAuth()
    const [showEditor, setShowEditor] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['templates'],
        queryFn: () => templateService.getTemplates(),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => templateService.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            queryClient.invalidateQueries({ queryKey: ['templates', 'trashed'] })
            toast({ title: 'Template deleted' })
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
                ) : isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader />
                    </div>
                ) : data?.results && data.results.length > 0 ? (
                    <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {data.results.map((template: any) => (
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
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-4 py-2">
                                    {(user?.role === 'super_admin' || template.companyId === user?.companyId) ? (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                                                <IconEdit size={16} className="mr-1" /> Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                                                if (window.confirm('Move this template to Recycle Bin? You can restore it within 30 days.')) {
                                                    deleteMutation.mutate(template.id)
                                                }
                                            }}>
                                                <IconTrash size={16} className="mr-1" /> Delete
                                            </Button>
                                        </>
                                    ) : (
                                        <Badge variant="outline" className="opacity-50">View Only</Badge>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className='mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center'>
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
            </Layout.Body>
        </Layout>
    )
}
