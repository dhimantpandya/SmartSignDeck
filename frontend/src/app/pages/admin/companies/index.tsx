import { useState, useEffect } from 'react'
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
import { userService } from '@/api/user.service'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Building2,
    Trash,
    Settings as SettingsIcon,
    ShieldCheck,
    Globe,
    ChevronRight,
    ChevronDown,
    User as UserIcon,
    CreditCard,
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PasswordInput } from '@/components/custom/password-input'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/components/nav-notification-provider'

// --- Management Modal Component ---
function ManageCompanyModal({ company, isOpen, onClose }: { company: Company, isOpen: boolean, onClose: () => void }) {
    const { data: userData, isLoading: isUsersLoading } = useQuery({
        queryKey: ['company-users', company.id],
        queryFn: () => userService.getAllUsers({
            pagination: { pageIndex: 0, pageSize: 100 },
            filter: { companyId: company.id, role: [], search: '' }
        }),
        enabled: !!company.id && isOpen
    })

    const queryClient = useQueryClient()
    const { socket } = useNotifications()

    useEffect(() => {
        if (!socket || !isOpen) return

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['company-users', company.id] })
        }

        socket.on('user_updated', handleUpdate)
        socket.on('user_deleted', handleUpdate)

        return () => {
            socket.off('user_updated', handleUpdate)
            socket.off('user_deleted', handleUpdate)
        }
    }, [socket, isOpen, company.id, queryClient])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl">{company.name}</DialogTitle>
                            <p className="text-sm text-muted-foreground line-clamp-1">{company.description || 'Organization Management'}</p>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="general" className="flex-1 flex flex-col">
                    <div className="px-6 border-b">
                        <TabsList className="w-full justify-start bg-transparent h-12 p-0 gap-6">
                            <TabsTrigger value="general" className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all">
                                General
                            </TabsTrigger>
                            <TabsTrigger value="users" className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all">
                                Users
                            </TabsTrigger>
                            <TabsTrigger value="license" className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all">
                                License
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="general" className="mt-0 outline-none space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Organization ID</Label>
                                    <p className="font-mono text-sm bg-muted/50 p-2 rounded border border-dashed truncate">{company.id}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Owner ID</Label>
                                    <p className="font-mono text-sm bg-muted/50 p-2 rounded border border-dashed truncate">{company.ownerId}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Globe size={18} className="text-primary" />
                                    Public Asset Connectivity
                                </h4>
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">Public Access</p>
                                        <p className="text-xs text-muted-foreground">Allow company templates to be visible in global marketplace</p>
                                    </div>
                                    <Badge className="bg-green-500/20 text-green-600 border-green-500/20">Enabled</Badge>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="users" className="mt-0 outline-none">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg">Platform Users</h4>
                                <Badge variant="outline">{userData?.data?.users?.length || 0} Members</Badge>
                            </div>
                            {isUsersLoading ? (
                                <div className="flex flex-col gap-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-12 w-full animate-pulse bg-muted rounded" />)}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {userData?.data?.users?.map((user: any) => (
                                        <div key={user.id || user._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold">{user.first_name} {user.last_name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="capitalize text-[10px] h-5">{user.role}</Badge>
                                        </div>
                                    ))}
                                    {(!userData?.data?.users || userData.data.users.length === 0) && (
                                        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <UserIcon size={24} className="opacity-20" />
                                            <p className="text-sm">No users associated with this record</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="license" className="mt-0 outline-none space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-4">
                                <CreditCard className="text-blue-500 mt-1" />
                                <div>
                                    <h4 className="font-bold text-blue-700">Enterprise Subscription</h4>
                                    <p className="text-xs text-blue-600/80">Premium features, dedicated support, and advanced analytics included.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Valid Until</span>
                                    <span className="font-bold">December 31, 2026</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Max User Slots</span>
                                    <span className="font-bold">Unlimited</span>
                                </div>
                                <Separator />
                                <div className="pt-2">
                                    {/* Removed View Invoices button as per request */}
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminCompanies() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [deletePassword, setDeletePassword] = useState('')
    const [managingCompany, setManagingCompany] = useState<Company | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
    const { socket } = useNotifications()

    const queryClient = useQueryClient()
    const { logout } = useAuth()

    useEffect(() => {
        if (!socket) return

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
        }

        socket.on('user_updated', handleUpdate)
        socket.on('user_deleted', handleUpdate)
        socket.on('company_updated', handleUpdate)
        socket.on('company_deleted', handleUpdate)

        return () => {
            socket.off('user_updated', handleUpdate)
            socket.off('user_deleted', handleUpdate)
            socket.off('company_updated', handleUpdate)
            socket.off('company_deleted', handleUpdate)
        }
    }, [socket, queryClient])

    const { data, isLoading } = useQuery({
        queryKey: ['admin-companies'],
        queryFn: () => companyService.getCompanies(),
    })

    // Group companies by name
    const groupedCompanies = data ? data.reduce((acc, company) => {
        const name = company.name || 'Unknown'
        if (!acc[name]) {
            acc[name] = []
        }
        acc[name].push(company)
        return acc
    }, {} as Record<string, Company[]>) : {}

    const groupNames = Object.keys(groupedCompanies).sort()

    const toggleGroup = (name: string) => {
        setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }))
    }

    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

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
        mutationFn: ({ id, password }: { id: string, password: string }) =>
            companyService.deleteCompany(id, { password }),
        onSuccess: () => {
            setDeletePassword('')
            setConfirmDelete(null)
            // Force a hard refresh of the data
            queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
        },
        onError: (err: any) => {
            if (err?.status === 401 || err?.response?.status === 401) {
                toast({
                    title: 'Security Protocol Initiated',
                    description: 'Incorrect password. Automatic logout triggered.',
                    variant: 'destructive'
                })
                logout()
                return
            }
            toast({ title: 'Operation failed', description: err?.response?.data?.message || err.message, variant: 'destructive' })
        }
    })

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
                </div>
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center" >
                        <Loader />
                    </div>
                ) : (
                    <Card className="border-primary/10 shadow-xl overflow-hidden bg-background/50 backdrop-blur-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead className="w-[300px]">Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Records</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupNames.map((groupName) => {
                                    const group = groupedCompanies[groupName]
                                    const isExpanded = expandedGroups[groupName]

                                    return (
                                        <>
                                            <TableRow key={`group-${groupName}`} className="hover:bg-muted/10 transition-colors bg-background">
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleGroup(groupName)}>
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                                            <Building2 size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-lg">{toTitleCase(groupName)}</span>
                                                            <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold">Grouped Organization</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 font-bold px-2 py-0">
                                                        Active
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono">
                                                            {group.reduce((sum, c) => sum + (c.memberCount || 0), 0)} Members
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-primary/70">
                                                        <Globe size={14} />
                                                        <span className="text-xs font-semibold tracking-tight">Public Connectivity</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1.5 px-2">
                                                        {/* Hidden Edit Organization button as per request */}
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500 transition-all shadow-sm"
                                                            onClick={() => setManagingCompany(group[0])}
                                                            title="Manage Organization"
                                                        >
                                                            <SettingsIcon size={14} />
                                                        </Button>
                                                        {group[0].name?.toLowerCase() !== 'smartsigndeck' && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all shadow-sm"
                                                                onClick={() => {
                                                                    setConfirmDelete(group[0].id)
                                                                    setDeletePassword('')
                                                                }}
                                                                title="Delete Organization"
                                                            >
                                                                <Trash size={14} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && group.map((company, idx) => (
                                                <TableRow key={company.id} className="bg-muted/20 hover:bg-muted/40 transition-colors border-l-2 border-l-primary/30">
                                                    <TableCell></TableCell>
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col border-l border-muted-foreground/20 pl-4 py-1">
                                                            <span className="font-semibold text-sm">Instance #{idx + 1}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{company.id}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-[10px] text-muted-foreground font-bold italic uppercase tracking-tighter">Instance Active</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mb-1">Owner Account</span>
                                                            <span className="text-xs font-mono bg-muted-foreground/10 px-1 py-0.5 rounded border border-muted-foreground/20 truncate max-w-[120px]">{company.ownerId}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-green-500/80">
                                                            <ShieldCheck size={12} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1.5 px-2">
                                                            {/* Hidden Edit Details button as per request */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500 transition-all shadow-sm"
                                                                onClick={() => setManagingCompany(company)}
                                                                title="Manage Organization"
                                                            >
                                                                <SettingsIcon size={14} />
                                                            </Button>
                                                            {company.name?.toLowerCase() !== 'smartsigndeck' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all shadow-sm"
                                                                    onClick={() => {
                                                                        setConfirmDelete(company.id)
                                                                        setDeletePassword('')
                                                                    }}
                                                                    title="Delete Organization"
                                                                >
                                                                    <Trash size={14} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </Card>
                )
                }

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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCompany({ ...editingCompany!, name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Description</Label>
                                <Input
                                    id="desc"
                                    value={editingCompany?.description || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCompany({ ...editingCompany!, description: e.target.value })}
                                    placeholder="Organization purpose..."
                                />
                            </div>
                            {!editingCompany?.id && (
                                <div className="grid gap-2">
                                    <Label htmlFor="owner">Owner User ID (Optional)</Label>
                                    <Input
                                        id="owner"
                                        value={editingCompany?.ownerId || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCompany({ ...editingCompany!, ownerId: e.target.value })}
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

                {/* Management Modal */}
                {
                    managingCompany && (
                        <ManageCompanyModal
                            company={managingCompany}
                            isOpen={!!managingCompany}
                            onClose={() => setManagingCompany(null)}
                        />
                    )
                }

                <ConfirmationDialog
                    isOpen={!!confirmDelete}
                    title="Delete Organization"
                    message="DANGER: This will permanently delete this company and ALL its active employees. Please enter your administrator password to confirm."
                    variant="destructive"
                    confirmBtnText="Confirm Permanent Deletion"
                    isLoading={deleteMutation.isPending}
                    onConfirm={() => {
                        if (confirmDelete) {
                            deleteMutation.mutate({ id: confirmDelete, password: deletePassword })
                        }
                    }}
                    onClose={() => {
                        setConfirmDelete(null)
                        setDeletePassword('')
                    }}
                >
                    <div className="mt-4 w-full text-left">
                        <Label htmlFor="delete-password" title="Organization deletion requires verification">
                            Super Admin Verification
                        </Label>
                        <PasswordInput
                            id="delete-password"
                            placeholder="Type your admin password to proceed"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="mt-2"
                        />
                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                            DANGER: Deleting an organization removes all associated users and data. This action cannot be undone.
                        </p>
                    </div>
                </ConfirmationDialog>
            </Layout.Body >
        </Layout >
    )
}
