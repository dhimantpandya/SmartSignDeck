import { useState, useEffect, useRef } from 'react'
import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { NotificationBell } from '@/components/notification-bell'
import { useNotifications } from '@/components/nav-notification-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { UserProfileDialog } from '@/app/pages/users/components/user-profile-dialog'
import { socialService } from '@/api/social.service'
import { userService } from '@/api/user.service'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'
import {
    Users,
    UserPlus,
    MessageSquare,
    Building2,
    Search as SearchIcon,
    Send
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function Collaboration() {
    const { user } = useAuth()
    const [friends, setFriends] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [sentRequests, setSentRequests] = useState<any[]>([])
    const [receivedRequests, setReceivedRequests] = useState<any[]>([])
    const [companyMessages, setCompanyMessages] = useState<any[]>([])
    const [inputText, setInputText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [activeTab, setActiveTab] = useState('friends')
    const [selectedFriend, setSelectedFriend] = useState<any>(null)
    const [privateMessages, setPrivateMessages] = useState<any[]>([])
    const [privateInputText, setPrivateInputText] = useState('')
    const [selectedProfileUser, setSelectedProfileUser] = useState<any>(null)
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
    const { socket } = useNotifications()

    const extractId = (idObj: any) => {
        if (!idObj) return null
        if (typeof idObj === 'string') return idObj
        return idObj.id || idObj._id || null
    }

    const isSameId = (id1: any, id2: any) => {
        const s1 = extractId(id1)
        const s2 = extractId(id2)
        return s1 && s2 && s1 === s2
    }

    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    // Auto-scroll to bottom when new messages arrive or when switching to the board tab
    useEffect(() => {
        if (activeTab === 'company') {
            const timer = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [companyMessages, activeTab])

    useEffect(() => {
        loadData()
    }, [user])

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

        const handleNewChat = (data: any) => {
            console.log('[Collaboration] New chat received:', data)
            if (data.type === 'company' || data.companyId) {
                console.log('[Collaboration] Processing company message')
                setCompanyMessages((prev) => {
                    // Prevent duplicate if added optimistically
                    if (prev.some(m => m.text === data.text && isSameId(m.senderId, data.senderId) && Math.abs(new Date(m.created_at).getTime() - new Date(data.created_at).getTime()) < 2000)) {
                        return prev
                    }
                    return [...prev, data]
                })
            } else if (data.type === 'private' || data.recipientId) {
                const friendId = extractId(selectedFriend)
                const senderId = extractId(data.senderId)
                const recipientId = extractId(data.recipientId)
                const myId = extractId(user)

                const isFromFriend = isSameId(senderId, friendId)
                const isFromMeToFriend = isSameId(senderId, myId) && isSameId(recipientId, friendId)

                console.log('[Collaboration] Private message check:', {
                    friendId, senderId, recipientId, myId,
                    isFromFriend, isFromMeToFriend
                })

                if (isFromFriend || isFromMeToFriend) {
                    setPrivateMessages((prev) => {
                        // Prevent duplicate if added optimistically
                        if (prev.some(m => m.text === data.text && isSameId(m.senderId, data.senderId) && Math.abs(new Date(m.created_at).getTime() - new Date(data.created_at).getTime()) < 2000)) {
                            console.log('[Collaboration] Skipping duplicate message')
                            return prev
                        }
                        return [...prev, data]
                    })
                } else {
                    console.log('[Collaboration] Message irrelevant to active chat window')
                }
            }
        }

        socket.on('friend_request_received', handleFriendRequestReceived)
        socket.on('friend_request_accepted', handleFriendRequestAccepted)
        socket.on('new_chat', handleNewChat)

        // Ensure rooms are joined (idempotent on backend)
        socket.emit('join_user', user.id)
        if (user.companyId) {
            socket.emit('join_company', user.companyId)
        }

        return () => {
            console.log('[Collaboration] Removing listeners from shared socket')
            socket.off('friend_request_received', handleFriendRequestReceived)
            socket.off('friend_request_accepted', handleFriendRequestAccepted)
            socket.off('new_chat', handleNewChat)
        }
    }, [socket, user, selectedFriend]) // selectedFriend dependency ensures listener uses latest value

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

            // Load company board messages
            if (user?.companyId) {
                const messagesRes = await socialService.getCompanyBoard()
                if (Array.isArray(messagesRes)) {
                    // Backend returns { created_at: -1 }, so we reverse for chronological
                    setCompanyMessages(messagesRes.filter(Boolean).reverse())
                }
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
            const usersWithIds = (res.data.users || []).map((u: any) => ({
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
        setSelectedFriend(friend)
        // Load messages
        try {
            if (user && friend) {
                const msgs = await socialService.getChatHistory(friend.id)
                setPrivateMessages(msgs.reverse())
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleSendPrivateMessage = async () => {
        if (!privateInputText.trim() || !user || !selectedFriend || isSending) return

        setIsSending(true)
        const payload = {
            text: privateInputText,
            recipientId: selectedFriend.id,
            senderName: `${user.first_name} ${user.last_name}`,
            senderId: user.id,
            avatar: user.avatar,
            type: 'private'
        }

        try {
            // Optimistic Update
            const optimisticMsg = {
                ...payload,
                created_at: new Date().toISOString(),
                isOptimistic: true
            }
            setPrivateMessages(prev => [...prev, optimisticMsg])

            await socialService.sendMessage({
                text: privateInputText,
                recipientId: selectedFriend.id
            })

            socket?.emit('send_chat', payload)
            setPrivateInputText('')
        } catch (err: any) {
            toast({
                title: 'Failed to send message',
                description: err.message,
                variant: 'destructive'
            })
        } finally {
            setIsSending(false)
        }
    }

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user || isSending) return

        setIsSending(true)
        const payload = {
            text: inputText,
            companyId: user.companyId,
            senderName: `${user.first_name} ${user.last_name}`,
            senderId: user.id,
            avatar: user.avatar,
            type: 'company'
        }

        try {
            // Optimistic Update
            const optimisticMsg = {
                ...payload,
                created_at: new Date().toISOString(),
                isOptimistic: true
            }
            setCompanyMessages(prev => [...prev, optimisticMsg])

            await socialService.sendMessage({
                text: inputText,
                companyId: user.companyId
            })

            socket?.emit('send_chat', payload)
            setInputText('')
        } catch (err: any) {
            toast({
                title: 'Failed to send message',
                description: err.message,
                variant: 'destructive'
            })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <Layout fixed>
                <Layout.Header>
                    <div className="flex items-center gap-2">
                        <Building2 size={24} className="text-primary" />
                        <h1 className='text-xl font-bold tracking-tight'>Collaboration Hub</h1>
                    </div>
                    <div className='ml-auto flex items-center space-x-4'>
                        <ThemeSwitch />
                        <NotificationBell />
                        <UserNav />
                    </div>
                </Layout.Header>

                <Layout.Body className='flex gap-0 p-0 overflow-hidden h-[calc(100vh-var(--header-height))]'>
                    {/* Local Sidebar */}
                    <aside className='w-72 border-r bg-muted/10 backdrop-blur-sm flex flex-col p-6 gap-6 flex-shrink-0'>
                        <div>
                            <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2'>Navigation</h2>
                            <TabsList className="flex flex-col h-auto bg-transparent gap-2 items-stretch p-0">
                                <TabsTrigger value="friends" className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10">
                                    <Users size={18} />
                                    <span className="font-medium">My Connections</span>
                                </TabsTrigger>
                                <TabsTrigger value="find" className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10">
                                    <UserPlus size={18} />
                                    <span className="font-medium">Find People</span>
                                </TabsTrigger>
                                <TabsTrigger value="requests" className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10 relative">
                                    <UserPlus size={18} />
                                    <span className="font-medium">Requests</span>
                                    {receivedRequests.length > 0 && (
                                        <Badge variant="destructive" className="ml-auto px-1.5 py-0.5 min-w-[1.25rem] h-5 justify-center text-[10px] animate-pulse">
                                            {receivedRequests.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="company" className="justify-start gap-3 px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all hover:bg-primary/10">
                                    <Building2 size={18} />
                                    <span className="font-medium">Company Board</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="mt-auto px-2">
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
                    <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-muted/5">
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

                            <TabsContent value="company" className="mt-0">
                                <div className="max-w-5xl mx-auto">
                                    <Card className="border-primary/10 shadow-xl overflow-hidden h-[700px] flex flex-col bg-background/50 backdrop-blur-sm">
                                        <CardHeader className="bg-primary/5 border-b py-3 flex-shrink-0 z-10">
                                            <div className="flex items-center justify-between w-full px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                                        <Building2 size={16} className="text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-sm font-semibold">Live Company Discussion</CardTitle>
                                                        <CardDescription className="text-[10px]">Coordinate in real-time with {user?.companyName || 'the team'}.</CardDescription>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-0 flex-1 flex flex-col min-h-0 bg-muted/5 relative">
                                            {/* Chat Container Background Effect */}
                                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_100%)] shadow-inner" />

                                            {companyMessages.length === 0 ? (
                                                <div className="flex-1 p-6 text-center flex flex-col items-center justify-center space-y-4 relative z-10">
                                                    <div className="p-6 bg-background rounded-full shadow-inner border border-primary/5">
                                                        <MessageSquare size={48} className="text-primary/20" />
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <h4 className="font-semibold text-foreground mb-1">No conversation here yet</h4>
                                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                                            Be the first to start a discussion! Type a message below to coordinate with your team.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative z-10">
                                                    <div className="max-w-4xl mx-auto space-y-6">
                                                        {companyMessages.map((msg, i) => {
                                                            if (!msg) return null;
                                                            const msgSenderId = msg.senderId?.id || msg.senderId?._id || msg.senderId;
                                                            const isOwnMessage = msgSenderId === user?.id;

                                                            const senderName = msg.senderName ||
                                                                (msg.senderId?.first_name ? `${msg.senderId.first_name} ${msg.senderId.last_name}` : 'Unknown User');
                                                            const messageDate = msg.created_at;

                                                            const senderAvatar = msg.senderId?.avatar || msg.avatar || null;
                                                            const senderInitials = senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

                                                            return (
                                                                <div key={i} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                    <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-background shadow-sm">
                                                                        <AvatarImage src={senderAvatar} />
                                                                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{senderInitials}</AvatarFallback>
                                                                    </Avatar>

                                                                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%]`}>
                                                                        {!isOwnMessage && (
                                                                            <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1 px-1">
                                                                                {senderName}
                                                                            </span>
                                                                        )}
                                                                        <div className={`group relative rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:shadow-md ${isOwnMessage
                                                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                                            : 'bg-background border border-primary/5 text-foreground rounded-tl-none'
                                                                            }`}>
                                                                            <p className="text-sm leading-relaxed">{msg.text}</p>

                                                                            {/* Hover Timestamp for self */}
                                                                            <div className={cn(
                                                                                "absolute -bottom-5 whitespace-nowrap text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                                                                                isOwnMessage ? "right-0" : "left-0"
                                                                            )}>
                                                                                {messageDate ? new Date(messageDate).toLocaleString('en-IN', {
                                                                                    month: 'short',
                                                                                    day: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                }) : 'Just now'}
                                                                            </div>
                                                                        </div>

                                                                        {/* Fixed Timestamp for non-group hover or mobile */}
                                                                        <span className="mt-1 px-1 text-[8px] text-muted-foreground/60 block group-hover:hidden">
                                                                            {messageDate ? new Date(messageDate).toLocaleString('en-IN', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                                hour12: true
                                                                            }) : 'Just now'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        <div ref={messagesEndRef} className="h-4" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Integrated Input Area - Exactly like Premium Chat */}
                                            <div className="p-5 border-t bg-background flex-shrink-0 z-10">
                                                <div className="flex gap-3 items-center">
                                                    <div className="relative flex-1 group">
                                                        <Input
                                                            placeholder="Write a message to the company..."
                                                            className="h-12 px-5 rounded-2xl bg-muted/30 border-primary/5 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all text-sm pr-12"
                                                            value={inputText}
                                                            onChange={(e) => setInputText(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                            disabled={isSending}
                                                        />
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex-shrink-0"
                                                        onClick={handleSendMessage}
                                                        disabled={!inputText.trim() || isSending}
                                                    >
                                                        <Send size={18} className={isSending ? 'animate-pulse' : ''} />
                                                    </Button>
                                                </div>
                                                <p className="mt-2 text-[9px] text-muted-foreground text-center opacity-60">
                                                    Messages sent here are visible to all employees in your organization.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </div>
                    </main>
                </Layout.Body>
            </Layout>

            <Dialog open={!!selectedFriend} onOpenChange={(open) => !open && setSelectedFriend(null)}>
                <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedFriend?.avatar} />
                                <AvatarFallback>{selectedFriend?.first_name?.[0]}</AvatarFallback>
                            </Avatar>
                            {selectedFriend?.first_name} {selectedFriend?.last_name}
                        </DialogTitle>
                        <DialogDescription>Private Conversation</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                        {privateMessages.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-10">
                                No messages yet. Say hi!
                            </div>
                        ) : (
                            privateMessages.map((msg, i) => {
                                if (!msg) return null;
                                const msgSenderId = msg.senderId?.id || msg.senderId?._id || msg.senderId;
                                const isOwn = msgSenderId === user?.id;
                                return (
                                    <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-xl px-4 py-2 ${isOwn ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted border rounded-tl-none'
                                            }`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <span className="text-[9px] opacity-70 block mt-1 text-right">
                                                {msg.created_at ? new Date(msg.created_at).toLocaleString('en-IN', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                }) : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <div className="p-4 border-t bg-background">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={privateInputText}
                                onChange={(e) => setPrivateInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendPrivateMessage()}
                            />
                            <Button size="icon" onClick={handleSendPrivateMessage} disabled={!privateInputText.trim() || isSending}>
                                <Send size={18} />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
