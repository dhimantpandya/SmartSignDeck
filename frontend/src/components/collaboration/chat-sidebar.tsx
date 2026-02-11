import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { socialService } from '@/api'
import { io, Socket } from 'socket.io-client'
import {
    MessageCircle,
    X,
    Send,
    Building2,
    Search,
    ChevronLeft,
    MessageSquare,
    UserPlus,
    CheckCheck
} from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/components/nav-notification-provider'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export const ChatSidebar = ({ isOpen, onClose }: ChatSidebarProps) => {
    const { user } = useAuth()
    const {
        unreadChatCounts,
        unreadCompanyChatCount,
        clearChatNotifications,
        setIsChatOpen,
        suppressedChatSections,
        suppressChatSection
    } = useNotifications()

    const [boardMessages, setBoardMessages] = useState<any[]>([])
    const [privateMessages, setPrivateMessages] = useState<any[]>([])
    const [inputText, setInputText] = useState('')
    const [activeTab, setActiveTab] = useState('company')
    const [friends, setFriends] = useState<any[]>([])
    const [receivedRequests, setReceivedRequests] = useState<any[]>([])
    const [selectedFriend, setSelectedFriend] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const socketRef = useRef<Socket | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!user || !isOpen) return

        const socket = io(import.meta.env.VITE_APP_URL || 'http://localhost:5000')
        socketRef.current = socket

        socket.on('connect', () => {
            if (user.companyId) {
                socket.emit('join_company', user.companyId)
            }
            socket.emit('join_user', user.id)
        })

        socket.on('new_chat', (data) => {
            if (data.type === 'company' || data.companyId) {
                setBoardMessages((prev) => [...prev, data])
            } else if (data.type === 'private' || data.recipientId) {
                setPrivateMessages((prev) => [...prev, data])
            }
        })

        socket.on('friend_request_received', () => {
            loadRequests()
        })

        socket.on('friend_request_accepted', () => {
            loadFriends()
            loadRequests()
        })

        socket.on('new_friend_message', (data) => {
            // Re-fetch history if this friend's chat is active
            if (selectedFriend && (data.senderId === selectedFriend.id || data.recipientId === selectedFriend.id)) {
                fetchChatHistory(selectedFriend.id)
            }
        })

        // Load board data initially
        fetchBoardData()

        return () => {
            socket.disconnect()
        }
    }, [user, isOpen])

    // Fetch private history when friend changes
    useEffect(() => {
        if (selectedFriend) {
            fetchChatHistory(selectedFriend.id)
        }
    }, [selectedFriend])

    const fetchBoardData = async () => {
        if (!user?.companyId) return
        try {
            const res = await socialService.getCompanyBoard()
            // Backend returns { created_at: -1 }, reverse for ascending
            setBoardMessages(res.reverse())
        } catch (err) {
            console.error('Failed to load board data', err)
        }
    }

    const fetchChatHistory = async (friendId: string) => {
        try {
            const res = await socialService.getChatHistory(friendId)
            // Backend returns { created_at: -1 }, reverse for ascending
            setPrivateMessages(res.reverse())
        } catch (err) {
            console.error('Failed to load chat history', err)
        }
    }

    const loadFriends = async () => {
        try {
            const res = await socialService.getFriends()
            setFriends(res)
        } catch (err) {
            console.error('Failed to load friends', err)
        }
    }

    const loadRequests = async () => {
        try {
            const res = await socialService.getReceivedRequests()
            setReceivedRequests(res)
        } catch (err) {
            console.error('Failed to load requests', err)
        }
    }

    const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            await socialService.respondToFriendRequest(requestId, status)
            loadRequests()
            if (status === 'accepted') loadFriends()
        } catch (err) {
            console.error('Failed to respond to request', err)
        }
    }

    useEffect(() => {
        // Scroll to bottom with a slight delay to ensure content is rendered
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'smooth' })
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [boardMessages, privateMessages, activeTab, selectedFriend])

    useEffect(() => {
        if (isOpen) {
            setIsChatOpen(true)
            loadFriends()
            loadRequests()

            // If opening and on company board, clear it
            if (activeTab === 'company') {
                clearChatNotifications('company')
            }
        }
        return () => {
            setIsChatOpen(false)
        }
    }, [isOpen])

    // Clear notifications or suppress badges when tab changes
    useEffect(() => {
        if (!isOpen) return;

        if (activeTab === 'company') {
            clearChatNotifications('company')
        } else if (activeTab === 'private') {
            // When clicking the Direct tab, we suppress the tab-level notification count
            // but we do NOT call clearChatNotifications(type) for all private yet
            // because the user wants to see individual counts (e.g. "3") in the list.
            suppressChatSection('private')
        }
    }, [activeTab, isOpen])

    // Clear individual when selected
    useEffect(() => {
        if (isOpen && activeTab === 'private' && selectedFriend) {
            clearChatNotifications('private', selectedFriend.id)
        }
    }, [selectedFriend, isOpen])

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user) return

        const payload = {
            text: inputText,
            companyId: activeTab === 'company' ? user.companyId : undefined,
            recipientId: activeTab === 'private' ? selectedFriend?.id : undefined,
            senderName: `${user.first_name} ${user.last_name}`,
            senderId: user.id,
            avatar: user.avatar
        }

        try {
            await socialService.sendMessage({
                text: inputText,
                companyId: payload.companyId,
                recipientId: payload.recipientId
            })

            socketRef.current?.emit('send_chat', payload)
            setInputText('')
        } catch (err) {
            console.error('Failed to send message', err)
        }
    }

    const filteredFriends = friends?.filter(f =>
        f && f.first_name && (
            (f.first_name + ' ' + f.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ) || []

    if (!user) return null

    return (
        <aside className={cn(
            "fixed inset-y-0 right-0 z-50 w-80 bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out transform",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <MessageCircle size={20} />
                        <h2 className="font-bold">Collaboration</h2>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10" onClick={onClose}>
                        <X size={18} />
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(val) => {
                    setActiveTab(val)
                    if (val === 'company') setSelectedFriend(null)
                }} className="flex-1 flex flex-col overflow-hidden gap-0">
                    <TabsList className="grid w-full grid-cols-4 rounded-none bg-muted/50 p-0 h-10 m-0">
                        <TabsTrigger value="company" className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary transition-all text-[10px] px-1 relative">
                            Board
                            {unreadCompanyChatCount > 0 && !suppressedChatSections.has('company') && (
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center p-0 text-[7px] animate-pulse">
                                    1
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="private" className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary transition-all text-[10px] px-1 relative">
                            Direct
                            {Object.keys(unreadChatCounts).length > 0 && !suppressedChatSections.has('private') && (
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center p-0 text-[7px] animate-pulse">
                                    {Object.keys(unreadChatCounts).length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary transition-all text-[10px] px-1 relative">
                            Reqs
                            {receivedRequests.length > 0 && (
                                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="find" className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary transition-all text-[10px] px-1">
                            Find
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden relative flex flex-col mt-0 p-0 justify-start">
                        {/* Company Board */}
                        <TabsContent value="company" className="flex-1 m-0 p-0 flex flex-col overflow-hidden !mt-0 !pt-0 data-[state=inactive]:hidden">
                            <div className="flex-1 overflow-y-auto p-3 flex flex-col justify-end custom-scrollbar">
                                <div className="space-y-2">
                                    {boardMessages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                            <Building2 size={48} className="mb-2" />
                                            <p className="text-sm">No board messages yet.</p>
                                        </div>
                                    )}
                                    {boardMessages.map((msg, i) => {
                                        const msgSenderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id || msg.senderId?.id;
                                        const isOwnMessage = msgSenderId === user.id;

                                        const senderName = msg.senderName ||
                                            (msg.senderId?.first_name ? `${msg.senderId.first_name} ${msg.senderId.last_name}` : 'Unknown');
                                        const messageDate = msg.created_at;

                                        const senderAvatar = msg.senderId?.avatar || msg.avatar || null;
                                        const senderInitials = senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

                                        return (
                                            <div key={i} className={cn("flex gap-3", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                                                <Avatar className="h-7 w-7 flex-shrink-0 border shadow-sm">
                                                    <AvatarImage src={senderAvatar} />
                                                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{senderInitials}</AvatarFallback>
                                                </Avatar>

                                                <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
                                                    {!isOwnMessage && (
                                                        <span className="text-[8px] font-bold text-muted-foreground mb-1 ml-1">
                                                            {senderName}
                                                        </span>
                                                    )}
                                                    <div className={cn(
                                                        "rounded-2xl px-3 py-2 text-xs shadow-sm max-w-[90%]",
                                                        isOwnMessage
                                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                                            : "bg-background border border-primary/5 text-foreground rounded-tl-none"
                                                    )}>
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[7px] text-muted-foreground/60 mt-1 px-1">
                                                        {messageDate ? new Date(messageDate).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        }) : 'Now'}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Private Chat */}
                        <TabsContent value="private" className="flex-1 m-0 p-0 flex flex-col overflow-hidden !mt-0 !pt-0 data-[state=inactive]:hidden">
                            {!selectedFriend ? (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="px-3 pb-2 pt-0 border-b bg-muted/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search connections..."
                                                    className="pl-9 h-9 text-xs"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-muted-foreground hover:text-primary"
                                                            onClick={() => clearChatNotifications('private')}
                                                        >
                                                            <CheckCheck size={18} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-[10px]">Mark all as read</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--primary)) transparent' }}>
                                        {filteredFriends.length === 0 && (
                                            <div className="text-center text-xs text-muted-foreground mt-10">
                                                No connections found.
                                            </div>
                                        )}
                                        {filteredFriends.map(friend => (
                                            <div
                                                key={friend.id}
                                                className="flex items-center gap-3 p-3 hover:bg-muted rounded-xl cursor-pointer transition-all group"
                                                onClick={() => setSelectedFriend(friend)}
                                            >
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border border-primary/10 group-hover:border-primary/30 transition-all">
                                                        <AvatarImage src={friend.avatar} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{friend.first_name?.[0]}{friend.last_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                                                </div>
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="text-sm font-semibold truncate">{friend.first_name} {friend.last_name}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">{friend.email}</span>
                                                </div>
                                                {unreadChatCounts[friend.id] > 0 && (
                                                    <Badge variant="destructive" className="h-5 w-5 rounded-full flex items-center justify-center p-0 text-[10px] font-bold">
                                                        {unreadChatCounts[friend.id]}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* Friend Header */}
                                    <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/30">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedFriend(null)}>
                                            <ChevronLeft size={18} />
                                        </Button>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={selectedFriend.avatar} />
                                            <AvatarFallback className="text-xs font-bold">{selectedFriend.first_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className="text-xs font-bold truncate">{selectedFriend.first_name} {selectedFriend.last_name}</span>
                                            <span className="text-[10px] text-green-500 flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 bg-green-500 rounded-full" /> Online
                                            </span>
                                        </div>
                                    </div>
                                    {/* Private Messages */}
                                    <div className="flex-1 overflow-y-auto px-3 py-1 flex flex-col custom-scrollbar min-h-0">
                                        <div className="space-y-2">
                                            {privateMessages.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                                    <MessageSquare size={48} className="mb-2" />
                                                    <p className="text-sm">No private messages yet.</p>
                                                </div>
                                            )}
                                            {privateMessages.map((msg, i) => {
                                                const msgSenderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id || msg.senderId?.id;
                                                const isOwnMessage = msgSenderId === user.id;
                                                const messageDate = msg.timestamp || msg.created_at;

                                                const senderAvatar = isOwnMessage ? user.avatar : (msg.senderId?.avatar || msg.avatar || selectedFriend.avatar);
                                                const senderInitials = isOwnMessage ? user.first_name[0] : selectedFriend.first_name[0];

                                                return (
                                                    <div key={i} className={cn("flex gap-3", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                                                        <Avatar className="h-7 w-7 flex-shrink-0 border shadow-sm">
                                                            <AvatarImage src={senderAvatar} />
                                                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{senderInitials}</AvatarFallback>
                                                        </Avatar>
                                                        <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
                                                            <div className={cn(
                                                                "rounded-2xl px-3 py-2 text-xs shadow-sm max-w-[90%]",
                                                                isOwnMessage
                                                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                                                    : "bg-background border border-primary/5 text-foreground rounded-tl-none"
                                                            )}>
                                                                {msg.text}
                                                            </div>
                                                            <span className="text-[7px] text-muted-foreground/60 mt-1 px-1">
                                                                {messageDate ? new Date(messageDate).toLocaleTimeString('en-IN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                }) : 'Now'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <div ref={scrollRef} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Requests List */}
                        <TabsContent value="requests" className="flex-1 m-0 p-0 flex flex-col overflow-hidden !mt-0 !pt-0 data-[state=inactive]:hidden">
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {receivedRequests.length === 0 ? (
                                    <div className="text-center text-xs text-muted-foreground mt-10">
                                        No pending requests.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {receivedRequests.map(req => (
                                            <div key={req.id} className="p-3 bg-muted/30 rounded-xl border border-primary/5">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={req.fromId?.avatar} />
                                                        <AvatarFallback className="text-[10px]">{req.fromId?.first_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate">{req.fromId?.first_name} {req.fromId?.last_name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{req.fromId?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={() => handleRequestResponse(req.id || req._id, 'accepted')}>Accept</Button>
                                                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => handleRequestResponse(req.id || req._id, 'rejected')}>Reject</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Find People tab in sidebar */}
                        <TabsContent value="find" className="flex-1 m-0 p-0 flex flex-col overflow-hidden !mt-0 !pt-0 data-[state=inactive]:hidden">
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                <div className="p-4 bg-primary/5 rounded-full">
                                    <UserPlus size={32} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Grow your network</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use the main Collaboration Hub to find and connect with new people.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        window.location.href = '/collaboration?tab=find';
                                    }}
                                >
                                    Open Hub
                                </Button>
                            </div>
                        </TabsContent>
                    </div>

                    {/* Input Area (Shared between Board and Direct if friend selected) */}
                    {(activeTab === 'company' || (activeTab === 'private' && selectedFriend)) && (
                        <div className="p-3 border-t bg-muted/10">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    className="h-10 text-xs focus-visible:ring-primary border-primary/10 bg-background"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button size="icon" className="h-10 w-10 shrink-0 shadow-lg" onClick={handleSendMessage} disabled={!inputText.trim()}>
                                    <Send size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Tabs>
            </div>
        </aside>
    )
}
