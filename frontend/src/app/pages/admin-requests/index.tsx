import { FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminRequestService } from '@/api'
import { Layout } from '@/components/custom/layout'
import { UserNav } from '@/components/user-nav'
import ThemeSwitch from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock } from 'lucide-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useState } from 'react'

const AdminRequests: FC = () => {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery({
        queryKey: ['admin-requests'],
        queryFn: () => adminRequestService.getAllRequests(),
    })

    const { mutate: processRequest, isPending } = useMutation({
        mutationFn: ({ requestId, status }: { requestId: string, status: 'APPROVED' | 'REJECTED' }) =>
            adminRequestService.processRequest(requestId, status),
        onSuccess: () => {
            toast({ title: 'Request processed successfully' })
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to process request',
                description: error?.response?.data?.message || error?.message,
                variant: 'destructive'
            })
        }
    })

    const [confirmAction, setConfirmAction] = useState<{ requestId: string, status: 'APPROVED' | 'REJECTED' } | null>(null)

    const requests = (data as any) || []

    return (
        <Layout>
            <Layout.Header sticky>
                <h2 className='text-2xl font-bold tracking-tight'>Management Requests</h2>
                <div className='ml-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <UserNav />
                </div>
            </Layout.Header>
            <Layout.Body className="space-y-4">
                {isLoading ? (
                    <div>Loading requests...</div>
                ) : requests.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No pending requests found.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {requests.map((request: any) => (
                            <Card key={request.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <Badge variant={request.type === 'DELETE' ? 'destructive' : 'default'}>
                                            {request.type}
                                        </Badge>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            {request.status === 'PENDING' ? <Clock size={12} /> : null}
                                            {request.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="mt-2">
                                        {request.type === 'DELETE' ? 'Delete User' : 'Update Role'}
                                    </CardTitle>
                                    <CardDescription>
                                        Requested by: {request.requesterId?.first_name} {request.requesterId?.last_name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-sm">
                                        <p><strong>Target User:</strong> {request.targetUserId?.first_name} {request.targetUserId?.last_name}</p>
                                        <p><strong>Email:</strong> {request.targetUserId?.email}</p>
                                        {request.type === 'ROLE_UPDATE' && (
                                            <p><strong>New Role:</strong> {request.details?.proposedRole}</p>
                                        )}
                                    </div>

                                    {request.status === 'PENDING' && (
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                                                onClick={() => setConfirmAction({ requestId: request.id || request._id, status: 'APPROVED' })}
                                                loading={isPending}
                                            >
                                                <Check size={16} /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="flex-1 gap-1"
                                                onClick={() => setConfirmAction({ requestId: request.id || request._id, status: 'REJECTED' })}
                                                loading={isPending}
                                            >
                                                <X size={16} /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <ConfirmationDialog
                    isOpen={!!confirmAction}
                    title={confirmAction?.status === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
                    message={`Are you sure you want to ${confirmAction?.status.toLowerCase()} this management request? This action will be executed immediately.`}
                    variant={confirmAction?.status === 'APPROVED' ? 'success' : 'destructive'}
                    confirmBtnText={confirmAction?.status === 'APPROVED' ? 'Approve' : 'Reject'}
                    onConfirm={() => {
                        if (confirmAction) {
                            processRequest(confirmAction)
                        }
                        setConfirmAction(null)
                    }}
                    onClose={() => setConfirmAction(null)}
                />
            </Layout.Body>
        </Layout>
    )
}

export default AdminRequests
