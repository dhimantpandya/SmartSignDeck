import { useState, useEffect } from 'react'
import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { NotificationBell } from '@/components/notification-bell'
import { useNotifications } from '@/components/nav-notification-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { UserProfileDialog } from '@/app/pages/users/components/user-profile-dialog'
import { socialService } from '@/api/social.service'
import { userService } from '@/api/user.service'
import { collaborationService } from '@/api/collaboration.service'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Users,
    UserPlus,
    MessageSquare,
    Search as SearchIcon,
    Send,
    FileText,
    Check,
    X,
    Trash,
    ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Routes } from '@/utilities/routes'
import Loader from '@/components/loader'

export default function Collaboration() {
    const { user } = useAuth()
    const [friends, setFriends] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [sentRequests, setSentRequests] = useState<any[]>([])
    const [receivedRequests, setReceivedRequests] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState('friends')
    const [selectedProfileUser, setSelectedProfileUser] = useState<any>(null)
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
    const { socket, setActiveChat, decrementRequestCount, openChatWithFriend } = useNotifications()

    const queryClient = useQueryClient()

    const { data: incomingTemplatesData, isLoading: isLoadingIncomingTemplates } = useQuery({
        queryKey: ['collaboration-requests', 'incoming', user?.id, 'pending'],
        queryFn: () => collaborationService.getRequests({ type: 'incoming', status: 'pending' }),
        enabled: !!user?.id,
    })

    const { data: outgoingTemplatesData, isLoading: isLoadingOutgoingTemplates } = useQuery({
        queryKey: ['collaboration-requests', 'outgoing', user?.id, 'pending'],
        queryFn: () => collaborationService.getRequests({ type: 'outgoing', status: 'pending' }),
        enabled: !!user?.id,
    })

    const respondTemplateMutation = useMutation({
        mutationFn: ({ requestId, status }: { requestId: string; status: 'accepted' | 'declined' }) =>
            collaborationService.respondToRequest(requestId, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['collaboration-requests'] })
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            decrementRequestCount()
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

    const cancelTemplateMutation = useMutation({
        mutationFn: (requestId: string) => collaborationService.cancelRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaboration-requests'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            decrementRequestCount()
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

    const incomingRequestsNum = (incomingTemplatesData as any)?.results?.filter((r: any) => {
        if (!r) return false;
        return r.status === 'pending' || r.status === 'pending'; // redundant but safe
    }).length || 0



    const extractId = (obj: any): string => {
        if (!obj) return ''
        if (typeof obj === 'string') return obj.trim().toLowerCase()
        // Check standard valid ID fields from populated OR raw objects
        const id = obj._id || obj.id || obj.userId || obj.friendId || (obj.sender && (obj.sender._id || obj.sender.id)) || (obj.recipient && (obj.recipient._id || obj.recipient.id))
        if (id) return id.toString().trim().toLowerCase()
        return ''
    }

    const renderTemplateInviteCard = (request: any, isIncoming: boolean) => {
        const otherUser = isIncoming ? request.sender : request.recipient;
        const status = request.status || 'pending';

        return (
            <Card key={request.id} className="overflow-hidden border-primary/10 hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold truncate max-w-[180px]">
                            {request.templateId?.name || (typeof request.templateId === 'string' ? `Template: ${request.templateId.slice(-6)}` : 'Unknown Template')}
                        </CardTitle>
                        <Badge
                            variant={
                                status === 'pending' ? 'outline' :
                                    status === 'accepted' ? 'default' :
                                        'secondary'
                            }
                            className="text-[10px] h-5"
                        >
                            {status.toUpperCase()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 pb-2">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {isIncoming ? 'From' : 'To'}
                            </span>
                            <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={otherUser?.avatar} />
                                    <AvatarFallback className="text-[8px]">
                                        {otherUser?.first_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate">
                                    {otherUser?.first_name ? `${otherUser.first_name} ${otherUser.last_name || ''}` : extractId(otherUser).slice(-8)}
                                </span>
                            </div>
                        </div>

                        {request.message && (
                            <div className="bg-primary/5 p-2 rounded text-[11px] italic text-muted-foreground line-clamp-2">
                                "{request.message}"
                            </div>
                        )}

                        <div className="text-[10px] text-muted-foreground">
                            Sent {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-muted/10 px-4 py-2 mt-2">
                    {status === 'pending' ? (
                        isIncoming ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                                    onClick={() => respondTemplateMutation.mutate({ requestId: request.id, status: 'declined' })}
                                    disabled={respondTemplateMutation.isPending}
                                >
                                    <X size={12} className="mr-1" /> Decline
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-7 text-[11px] px-2"
                                    onClick={() => respondTemplateMutation.mutate({ requestId: request.id, status: 'accepted' })}
                                    disabled={respondTemplateMutation.isPending}
                                >
                                    <Check size={12} className="mr-1" /> Accept
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] px-2 text-destructive hover:bg-destructive/5"
                                onClick={() => cancelTemplateMutation.mutate(request.id)}
                                disabled={cancelTemplateMutation.isPending}
                            >
                                <Trash size={12} className="mr-1" /> Cancel
                            </Button>
                        )
                    ) : status === 'accepted' ? (
                        <Button variant="ghost" size="sm" asChild className="h-7 text-[11px] px-2">
                            <Link to={Routes.TEMPLATES}>
                                <ExternalLink size={12} className="mr-1" /> View
                            </Link>
                        </Button>
                    ) : null}
                </CardFooter>
            </Card>
        );
    };

    useEffect(() => {
        loadData()
    }, [user])



    // Cleanup on unmount
    useEffect(() => {
        return () => setActiveChat({ type: null, id: null })
    }, [])

    // Handle real-time updates via shared socket
    useEffect(() => {
        if (!socket || !user) return

        console.log('[Collaboration] Setting up listeners on shared socket')

        const handleFriendRequestReceived = (data: any) => {
            console.log('Friend request received:', data)
            toast({ title: 'New friend request received!' })
            loadData()
        }

        const handleFriendRequestAccepted = (data: any) => {
            console.log('Friend request accepted:', data)
            toast({ title: 'A friend request was accepted!' })
            loadData()
        }





        socket.on('friend_request_received', handleFriendRequestReceived)
        socket.on('friend_request_accepted', handleFriendRequestAccepted)

        // Ensure rooms are joined (idempotent on backend)
        const uid = extractId(user)
        if (uid) socket.emit('join_user', uid)

        const cid = extractId(user.companyId)
        if (cid) {
            console.log('[Collaboration] 🏢 Joining company room:', cid)
            socket.emit('join_company', cid)
        }

        return () => {
            console.log('[Collaboration] Removing listeners from shared socket')
            socket.off('friend_request_received', handleFriendRequestReceived)
            socket.off('friend_request_accepted', handleFriendRequestAccepted)
        }
    }, [socket, user])

    const loadData = async () => {
        try {
            const friendsRes = await socialService.getFriends()
            if (Array.isArray(friendsRes)) {
                setFriends(friendsRes.filter(Boolean))
            } else {
                setFriends([])
            }

            const sentRes = await socialService.getSentRequests()
            if (Array.isArray(sentRes)) {
                setSentRequests(sentRes.filter(Boolean));
            }

            const receivedRes = await socialService.getReceivedRequests()
            if (Array.isArray(receivedRes)) {
                setReceivedRequests(receivedRes.filter(Boolean));
            }
        } catch (err) {
            console.error('Failed to load social data', err)
        }
    }

    const handleUserSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 3) return

        setIsLoading(true)
        try {
            const res = await userService.getAllUsers({
                pagination: { pageIndex: 0, pageSize: 15 }, // Increased pageSize slightly
                filter: { search: query, role: [] }
            })
            // Safety check for user ID comparison
            const usersWithIds = ((res as any).data.users || []).map((u: any) => ({
                ...u,
                id: u.id || u._id
            }))
            setSearchResults(usersWithIds.filter((u: any) => u.id !== user?.id))
        } catch (err) {
            console.error('Search failed', err)
        } finally {
            setIsLoading(false)
        }
    }
    const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            await socialService.respondToFriendRequest(requestId, status)
            toast({ title: `Request ${status} successfully!` })
            loadData()
        } catch (err: any) {
            toast({ title: 'Failed to respond to request', description: err.message, variant: 'destructive' })
        }
    }

    const sendRequest = async (toId: string) => {
        try {
            await socialService.sendFriendRequest(toId)
            toast({ title: 'Friend request sent!' })
            loadData()
        } catch (err: any) {
            toast({ title: 'Failed to send request', description: err.message, variant: 'destructive' })
        }
    }

    const handleDM = async (friend: any) => {
        openChatWithFriend(friend)
    }





    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <Layout fixed>
                <Layout.Header>
                    <div className="flex items-center gap-2">
                        <Users size={24} className="text-primary" />
                        <h1 className='text-xl font-bold tracking-tight'>Collaboration Hub</h1>
                    </div>
                    <div className='ml-auto flex items-center space-x-4'>
                        <ThemeSwitch />
                        <NotificationBell />
                        <UserNav />
                    </div>
                </Layout.Header>

                <Layout.Body className='flex gap-0 p-0 overflow-hidden h-[calc(100vh-var(--header-height))] flex-col md:flex-row'>
                    {/* Local Sidebar */}
                    <aside className='w-full md:w-72 border-r-0 md:border-r border-b md:border-b-0 bg-muted/10 backdrop-blur-sm flex flex-col p-4 md:p-6 gap-4 md:gap-6 flex-shrink-0'>
                        <div>
                            <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 md:mb-4 px-2 hidden md:block'>Navigation</h2>
                            <TabsList className="flex flex-row md:flex-col h-auto bg-transparent gap-2 items-stretch p-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                                <TabsTrigger value="friends" className="justify-center md:justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10 flex-shrink-0 whitespace-nowrap">
                                    <Users size={18} />
                                    <span className="font-medium">My Connections</span>
                                </TabsTrigger>
                                <TabsTrigger value="find" className="justify-center md:justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10 flex-shrink-0 whitespace-nowrap">
                                    <UserPlus size={18} />
                                    <span className="font-medium">Find People</span>
                                </TabsTrigger>
                                <TabsTrigger value="requests" className="justify-center md:justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10 relative flex-shrink-0 whitespace-nowrap">
                                    <UserPlus size={18} />
                                    <span className="font-medium">Friend Requests</span>
                                    {receivedRequests.length > 0 && (
                                        <Badge variant="destructive" className="ml-auto px-1.5 py-0.5 min-w-[1.25rem] h-5 justify-center text-[10px] animate-pulse">
                                            {receivedRequests.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                {user?.role !== 'advertiser' && (
                                    <TabsTrigger value="template-requests" className="justify-center md:justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10 relative flex-shrink-0 whitespace-nowrap">
                                        <FileText size={18} />
                                        <span className="font-medium">Template Invites</span>
                                        {incomingRequestsNum > 0 && (
                                            <Badge variant="destructive" className="ml-auto px-1.5 py-0.5 min-w-[1.25rem] h-5 justify-center text-[10px] animate-pulse">
                                                {incomingRequestsNum}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                )}

                            </TabsList>
                        </div>

                        <div className="mt-auto px-2 hidden md:block">
                            <Card className="bg-primary/5 border-none shadow-none">
                                <CardContent className="p-4">
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        Use the Collaboration Hub to coordinate with your team and expand your network.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-scroll custom-scrollbar p-6 md:p-10 bg-muted/5">
                        <div className="max-w-6xl mx-auto pb-10">
                            <TabsContent value="friends" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                                    {friends?.length === 0 && (
                                        <Card className="col-span-full py-12 text-center border-dashed">
                                            <CardContent className="flex flex-col items-center">
                                                <Users size={48} className="text-muted-foreground/30 mb-4" />
                                                <CardTitle className="mb-2 text-muted-foreground">No connections yet</CardTitle>
                                                <CardDescription>Go to "Find People" to start growing your network.</CardDescription>
                                            </CardContent>
                                        </Card>
                                    )}
                                    {friends?.filter(f => f && (f.id || f._id)).map((friend) => (
                                        <Card key={friend.id || friend._id} className="hover:shadow-md transition-shadow border-primary/10">
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                                                        <AvatarImage src={friend.avatar} />
                                                        <AvatarFallback className="text-xl bg-primary/5 text-primary">
                                                            {friend.first_name?.[0]}{friend.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold truncate">{friend.first_name} {friend.last_name}</h3>
                                                        <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
                                                        <Badge variant="secondary" className="mt-1 text-[10px] h-4">
                                                            {friend.companyName || 'Member'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex gap-2">
                                                    <Button variant="outline" size="sm" className="flex-1 gap-2 border-primary/20 hover:bg-primary/5" onClick={() => handleDM(friend)}>
                                                        <MessageSquare size={14} />
                                                        Message
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedProfileUser(friend)
                                                            setIsProfileDialogOpen(true)
                                                        }}
                                                    >
                                                        Profile
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="requests" className="mt-0">
                                <div className="space-y-6">
                                    <section>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            Received Requests
                                            {receivedRequests.length > 0 && <Badge variant="secondary">{receivedRequests.length}</Badge>}
                                        </h3>
                                        {receivedRequests.length === 0 ? (
                                            <p className="text-muted-foreground text-sm italic">No pending incoming requests.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {receivedRequests.map(req => (
                                                    <Card key={req.id || req._id} className="border-primary/10">
                                                        <CardContent className="p-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar>
                                                                    <AvatarImage src={req.fromId?.avatar} />
                                                                    <AvatarFallback>{req.fromId?.first_name?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-bold">{req.fromId?.first_name} {req.fromId?.last_name}</div>
                                                                    <div className="text-xs text-muted-foreground">{req.fromId?.email}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button size="sm" onClick={() => handleRequestResponse(req.id || req._id, 'accepted')} className="h-8">Accept</Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleRequestResponse(req.id || req._id, 'rejected')} className="h-8 border-destructive/20 text-destructive hover:bg-destructive/5">Reject</Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    <section className="pt-8 border-t">
                                        <h3 className="text-lg font-bold mb-4 opacity-70">Sent Requests</h3>
                                        {sentRequests.length === 0 ? (
                                            <p className="text-muted-foreground text-sm italic">No pending sent requests.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-3">
                                                {sentRequests.map(req => (
                                                    <Badge key={req.id} variant="secondary" className="px-3 py-1.5 flex gap-2 items-center">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={req.toId?.avatar} />
                                                            <AvatarFallback className="text-[8px]">{req.toId?.first_name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        {req.toId?.first_name} {req.toId?.last_name}
                                                        <span className="text-[10px] opacity-50 ml-1">Pending</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </TabsContent>

                            <TabsContent value="find" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Search Users</CardTitle>
                                        <CardDescription>Enter a name to find people to collaborate with.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative max-w-md">
                                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <input
                                                className="w-full bg-muted/30 border rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                placeholder="Type at least 3 characters..."
                                                value={searchQuery}
                                                onChange={(e) => handleUserSearch(e.target.value)}
                                            />
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            {isLoading ? (
                                                <div className="text-center py-8">Searching...</div>
                                            ) : searchResults.length > 0 ? (
                                                searchResults.map(u => {
                                                    const isFriend = friends.some(f => (f.id || f._id) === u.id);
                                                    const isSent = sentRequests.some(r => (r.toId?.id || r.toId?._id || r.toId) === u.id);
                                                    const isReceived = receivedRequests.some(r => (r.fromId?.id || r.fromId?._id || r.fromId) === u.id);

                                                    return (
                                                        <div key={u.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <Avatar>
                                                                    <AvatarImage src={u.avatar} />
                                                                    <AvatarFallback>{u.first_name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-bold">{u.first_name} {u.last_name}</div>
                                                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                onClick={() => isReceived ? setActiveTab('requests') : sendRequest(u.id)}
                                                                disabled={u.id === user?.id || isFriend || isSent}
                                                                className="gap-2 shadow-lg"
                                                                variant={isSent || isReceived ? 'secondary' : 'default'}
                                                            >
                                                                {isFriend ? 'Connected' : isSent ? 'Requested' : isReceived ? 'Respond' : 'Add Friend'}
                                                                {!isFriend && !isSent && !isReceived && <UserPlus size={16} />}
                                                            </Button>
                                                        </div>
                                                    )
                                                })
                                            ) : searchQuery.length >= 3 && (
                                                <div className="text-center py-8 text-muted-foreground italic">No users found.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {user?.role !== 'advertiser' && (
                                <TabsContent value="template-requests" className="mt-0">
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/50 backdrop-blur-md p-4 rounded-2xl border border-primary/10 shadow-sm">
                                            <div>
                                                <h2 className="text-lg font-bold">Template Invitations</h2>
                                                <p className="text-xs text-muted-foreground">Manage collaboration requests for templates.</p>
                                            </div>
                                        </div>

                                        <Tabs defaultValue="incoming-tm" className="w-full">
                                            <TabsList className="bg-muted/30 p-1 rounded-xl">
                                                <TabsTrigger value="incoming-tm" className="rounded-lg px-6">
                                                    Incoming ({incomingRequestsNum})
                                                </TabsTrigger>
                                                <TabsTrigger value="outgoing-tm" className="rounded-lg px-6">
                                                    Outgoing ({(outgoingTemplatesData as any)?.results?.filter((r: any) => r.status === 'pending').length || 0})
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="incoming-tm" className="mt-6">
                                                {isLoadingIncomingTemplates ? (
                                                    <div className="flex h-40 items-center justify-center">
                                                        <Loader />
                                                    </div>
                                                ) : incomingRequestsNum > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {(incomingTemplatesData as any).results
                                                            .filter((r: any) => r.status === 'pending')
                                                            .map((request: any) =>
                                                                renderTemplateInviteCard(request, true)
                                                            )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 text-center">
                                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                                            <FileText size={32} className="text-primary/40" />
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-foreground">No incoming invites</h3>
                                                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                                            When someone invites you to collaborate on a template, it will appear here.
                                                        </p>
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="outgoing-tm" className="mt-6">
                                                {isLoadingOutgoingTemplates ? (
                                                    <div className="flex h-40 items-center justify-center">
                                                        <Loader />
                                                    </div>
                                                ) : (outgoingTemplatesData as any)?.results?.filter((r: any) => r.status === 'pending').length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {(outgoingTemplatesData as any).results
                                                            .filter((r: any) => r.status === 'pending')
                                                            .map((request: any) =>
                                                                renderTemplateInviteCard(request, false)
                                                            )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 text-center">
                                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                                            <Send size={32} className="text-primary/40" />
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-foreground">No outgoing requests</h3>
                                                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                                            Templates you've invited others to collaborate on will show up here.
                                                        </p>
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </TabsContent>
                            )}


                        </div>
                    </main>
                </Layout.Body>
            </Layout>
                  {/* Chat Dialog removed - now using global ChatSidebar via openChatWithFriend */}
            <UserProfileDialog
                isOpen={isProfileDialogOpen}
                handleClose={() => {
                    setIsProfileDialogOpen(false)
                    setSelectedProfileUser(null)
                }}
                user={selectedProfileUser}
            />
        </Tabs>
    )
}
