import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { NotificationBell } from '@/components/notification-bell'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconUsers, IconCheck, IconX, IconTrash, IconExternalLink } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collaborationService } from '@/api/collaboration.service'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import { Routes } from '@/utilities/routes'

export default function Collaborations() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')

    const { data: incomingData, isLoading: isLoadingIncoming } = useQuery({
        queryKey: ['collaboration-requests', 'incoming'],
        queryFn: () => collaborationService.getRequests({ type: 'incoming' }),
    })

    const { data: outgoingData, isLoading: isLoadingOutgoing } = useQuery({
        queryKey: ['collaboration-requests', 'outgoing'],
        queryFn: () => collaborationService.getRequests({ type: 'outgoing' }),
    })

    const respondMutation = useMutation({
        mutationFn: ({ requestId, status }: { requestId: string; status: 'accepted' | 'declined' }) =>
            collaborationService.respondToRequest(requestId, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['collaboration-requests'] })
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            toast({
                title: `Request ${variables.status}`,
                description: `You have ${variables.status} the collaboration request.`,
            })
        },
        onError: (error: any) => {
            toast({
                title: 'Action Failed',
                description: error?.response?.data?.message || 'Failed to respond to request.',
                variant: 'destructive',
            })
        },
    })

    const cancelMutation = useMutation({
        mutationFn: (requestId: string) => collaborationService.cancelRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaboration-requests'] })
            toast({
                title: 'Request Cancelled',
                description: 'The collaboration request has been cancelled.',
            })
        },
        onError: (error: any) => {
            toast({
                title: 'Action Failed',
                description: error?.response?.data?.message || 'Failed to cancel request.',
                variant: 'destructive',
            })
        },
    })

    const breadcrumbItems = [
        { href: '/', icon: <IconHome size={18} /> },
        { label: 'Collaborations', icon: <IconUsers size={18} /> },
    ]

    const renderRequestCard = (request: any, isIncoming: boolean) => (
        <Card key={request.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">
                        {request.templateId?.name || 'Unknown Template'}
                    </CardTitle>
                    <Badge
                        variant={
                            request.status === 'pending' ? 'outline' :
                                request.status === 'accepted' ? 'default' :
                                    'secondary'
                        }
                    >
                        {request.status.toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {isIncoming ? 'From:' : 'To:'}
                        </span>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={isIncoming ? request.sender?.avatar : request.recipient?.avatar} />
                                <AvatarFallback className="text-xs">
                                    {isIncoming ? request.sender?.first_name?.[0] : request.recipient?.first_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                                {isIncoming
                                    ? `${request.sender?.first_name} ${request.sender?.last_name}`
                                    : `${request.recipient?.first_name} ${request.recipient?.last_name}`
                                }
                            </span>
                        </div>
                    </div>

                    {request.message && (
                        <div className="bg-muted/30 p-2 rounded text-sm italic">
                            "{request.message}"
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                        Sent on {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-4 py-2">
                {request.status === 'pending' ? (
                    isIncoming ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                                onClick={() => respondMutation.mutate({ requestId: request.id, status: 'declined' })}
                                disabled={respondMutation.isPending}
                            >
                                <IconX size={16} className="mr-1" /> Decline
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8"
                                onClick={() => respondMutation.mutate({ requestId: request.id, status: 'accepted' })}
                                disabled={respondMutation.isPending}
                            >
                                <IconCheck size={16} className="mr-1" /> Accept
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:bg-destructive/10"
                            onClick={() => cancelMutation.mutate(request.id)}
                            disabled={cancelMutation.isPending}
                        >
                            <IconTrash size={16} className="mr-1" /> Cancel Request
                        </Button>
                    )
                ) : request.status === 'accepted' ? (
                    <Button variant="ghost" size="sm" asChild className="h-8">
                        <Link to={Routes.TEMPLATES}>
                            <IconExternalLink size={16} className="mr-1" /> View Template
                        </Link>
                    </Button>
                ) : null}
            </CardFooter>
        </Card>
    )

    const incomingRequests = incomingData?.results || []
    const outgoingRequests = outgoingData?.results || []

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

                <div className='mb-6'>
                    <div className='flex items-center gap-2'>
                        <IconUsers size={24} className='text-primary' />
                        <h1 className='text-2xl font-bold tracking-tight'>Template Collaborations</h1>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                        Manage your incoming and outgoing collaboration requests for shared templates.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="incoming" className="gap-2">
                            Incoming ({incomingRequests.length})
                        </TabsTrigger>
                        <TabsTrigger value="outgoing" className="gap-2">
                            Outgoing ({outgoingRequests.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="incoming" className="mt-6">
                        {isLoadingIncoming ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader />
                            </div>
                        ) : incomingRequests.length > 0 ? (
                            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                {incomingRequests.map((request: any) => renderRequestCard(request, true))}
                            </div>
                        ) : (
                            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center text-muted-foreground'>
                                <IconUsers size={48} className='mb-4 opacity-20' />
                                <h2 className='text-xl font-semibold'>No incoming requests</h2>
                                <p>When someone invites you to collaborate, it will appear here.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="outgoing" className="mt-6">
                        {isLoadingOutgoing ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader />
                            </div>
                        ) : outgoingRequests.length > 0 ? (
                            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                {outgoingRequests.map((request: any) => renderRequestCard(request, false))}
                            </div>
                        ) : (
                            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center text-muted-foreground'>
                                <IconUsers size={48} className='mb-4 opacity-20' />
                                <h2 className='text-xl font-semibold'>No outgoing requests</h2>
                                <p>Templates you've invited others to collaborate on will show up here.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </Layout.Body>
        </Layout>
    )
}
