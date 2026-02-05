import { useState } from 'react'
import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService, Company } from '@/api/company.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import {
    Building2,
    Plus,
    Edit,
    Trash,
    Settings as SettingsIcon,
    ShieldCheck,
    Globe
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export default function AdminCompanies() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin-companies'],
        queryFn: () => companyService.getCompanies(),
    })

    const saveMutation = useMutation({
        mutationFn: (company: Partial<Company>) =>
            company.id
                ? companyService.updateCompany(company.id, company)
                : companyService.createCompany(company),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
            toast({ title: editingCompany?.id ? 'Company updated' : 'Company created' })
            setIsDialogOpen(false)
            setEditingCompany(null)
        },
        onError: (err: any) => {
            toast({ title: 'Operation failed', description: err.message, variant: 'destructive' })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => companyService.deleteCompany(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
            toast({ title: 'Company removed' })
        }
    })

    const handleOpenCreate = () => {
        setEditingCompany({ name: '', description: '' })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (company: Company) => {
        setEditingCompany(company)
        setIsDialogOpen(true)
    }

    const handleSave = () => {
        if (!editingCompany?.name) return
        saveMutation.mutate(editingCompany)
    }

    return (
        <Layout fixed>
            <Layout.Header>
                <div className='ml-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <UserNav />
                </div>
            </Layout.Header>

            <Layout.Body className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Organizations</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary" />
                            Super Admin Control Panel: Manage all registered companies.
                        </p>
                    </div>
                    <Button onClick={handleOpenCreate} className="gap-2 shadow-lg">
                        <Plus size={18} />
                        Register Company
                    </Button>
                </div>

                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader />
                    </div>
                ) : (
                    <Card className="border-primary/10 shadow-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[300px]">Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Public Assets</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.map((company) => (
                                    <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{company.name}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{company.description || 'No description'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                                Active
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono">{company.ownerId}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-primary">
                                                <Globe size={14} />
                                                <span className="text-xs font-semibold">Enabled</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(company)}>
                                                    <Edit size={16} className="text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="icon">
                                                    <SettingsIcon size={16} className="text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setConfirmDelete(company.id)}
                                                >
                                                    <Trash size={16} className="text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingCompany?.id ? 'Edit Organization' : 'Register New Organization'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input
                                    id="name"
                                    value={editingCompany?.name || ''}
                                    onChange={e => setEditingCompany({ ...editingCompany!, name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Description</Label>
                                <Input
                                    id="desc"
                                    value={editingCompany?.description || ''}
                                    onChange={e => setEditingCompany({ ...editingCompany!, description: e.target.value })}
                                    placeholder="Organization purpose..."
                                />
                            </div>
                            {!editingCompany?.id && (
                                <div className="grid gap-2">
                                    <Label htmlFor="owner">Owner User ID (Optional)</Label>
                                    <Input
                                        id="owner"
                                        value={editingCompany?.ownerId || ''}
                                        onChange={e => setEditingCompany({ ...editingCompany!, ownerId: e.target.value })}
                                        placeholder="MongoID of the first admin..."
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} loading={saveMutation.isPending}>
                                {editingCompany?.id ? 'Save Changes' : 'Register Company'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ConfirmationDialog
                    isOpen={!!confirmDelete}
                    title="Delete Organization"
                    message="Are you sure you want to delete this company? All data will be isolated or orphaned. This action cannot be undone."
                    variant="destructive"
                    confirmBtnText="Delete Organization"
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
