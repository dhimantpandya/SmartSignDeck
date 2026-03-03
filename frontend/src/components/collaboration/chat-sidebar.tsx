import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { socialService } from '@/api'
import {
    MessageCircle,
    X,
    Send,
    Building2,
    Search,
    ChevronLeft,
    MessageSquare,
    CheckCheck,
    Check,
    Clock,
    Reply,
    Copy,
    Trash2
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/components/nav-notification-provider'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, extractId, isSameId } from '../../lib/utils'

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
        suppressChatSection,
        socket,
        setActiveChat,
        onlineUsers,
        lastSeenMap
    } = useNotifications()
    const { toast } = useToast()

    const [boardMessages, setBoardMessages] = useState<any[]>([])
    const [privateMessages, setPrivateMessages] = useState<any[]>([])
    const [inputText, setInputText] = useState('')
    const [activeTab, setActiveTab] = useState('company')
    const [friends, setFriends] = useState<any[]>([])
    const [selectedFriend, setSelectedFriend] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const scrollRef = useRef<HTMLDivElement>(null)
    const selectedFriendRef = useRef<any>(null)
    const [replyTo, setReplyTo] = useState<any>(null)

    const formatChatDate = (date: string | Date) => {
        const d = new Date(date)
        if (isToday(d)) return 'Today'
        if (isYesterday(d)) return 'Yesterday'
        return format(d, 'MMMM d, yyyy')
    }

    const formatLastSeen = (userId: string, initialLastSeen?: string) => {
        // If user is currently online, don't show "Last seen"
        if (onlineUsers.has(userId)) return 'Online'

        const dateStr = lastSeenMap[userId] || initialLastSeen
        if (!dateStr) return 'Offline'
        const d = new Date(dateStr)
        if (isToday(d)) return `Last seen ${format(d, 'h:mm a')}`
        if (isYesterday(d)) return `Last seen yesterday at ${format(d, 'h:mm a')}`
        return `Last seen ${format(d, 'MMM d, h:mm a')}`
    }

    // Sync ref with state
    useEffect(() => {
        selectedFriendRef.current = selectedFriend
    }, [selectedFriend])

    // Load board data FIRST, before setting up socket listeners
    // This prevents race condition where socket messages arrive before history loads
    useEffect(() => {
        if (user?.companyId) {
            console.log('[ChatSidebar] 📥 Loading board history...')
            fetchBoardData()
        }
    }, [user?.companyId])

    useEffect(() => {
        if (!user || !socket) return

        console.log('[ChatSidebar] Setting up STABLE chat listeners')

        const handleNewChat = (data: any) => {
            console.log('[ChatSidebar] 🔵 new_chat arrived:', JSON.stringify(data, null, 2))


            // 🛡️ Filter for company messages
            if (data.type === 'company' || data.companyId) {
                console.log('[ChatSidebar] 🏢 Processing company message')
                setBoardMessages((prev) => {
                    const isDup = prev.some(m =>
                        (m._id === data._id || m.id === data.id) ||
                        (m.text === data.text && isSameId(m.senderId, data.senderId) && m.isOptimistic)
                    )

                    if (isDup) {
                        console.log('[ChatSidebar] ⚠️ Duplicate found, merging/replacing')
                        return prev.map(m => ((m.isOptimistic && m.text === data.text) || (m._id === data._id || m.id === data.id)) ? { ...data, isOptimistic: false } : m)
                    }

                    const newMsgs = [...prev, data]
                    console.log('[ChatSidebar] ✅ Added message. New count:', newMsgs.length)
                    return newMsgs
                })
            }
            // 🛡️ Filter for private messages
            else if (data.type === 'private' || data.recipientId) {
                const currentFriend = selectedFriendRef.current
                const friendId = extractId(currentFriend)
                const msgSenderId = extractId(data.senderId)
                const msgRecipientId = extractId(data.recipientId)
                const myId = extractId(user)

                const isFromFriend = isSameId(msgSenderId, friendId)
                const isFromMeToFriend = isSameId(msgSenderId, myId) && isSameId(msgRecipientId, friendId)

                console.log('[ChatSidebar] 🕵️ Private match check:', {
                    currentFriend: currentFriend?.first_name,
                    friendId, msgSenderId, msgRecipientId, myId,
                    isFromFriend, isFromMeToFriend
                })

                if (isFromFriend || isFromMeToFriend) {
                    console.log('[ChatSidebar] ✅ Match! Appending message')
                    setPrivateMessages((prev) => {
                        const isDup = prev.some(m =>
                            (m._id === data._id || m.id === data.id) ||
                            (m.text === data.text && isSameId(m.senderId, data.senderId) && m.isOptimistic)
                        )
                        if (isDup) {
                            console.log('[ChatSidebar] ⚠️ Private duplicate found, merging/replacing')
                            return prev.map(m => ((m.isOptimistic && m.text === data.text) || (m._id === data._id || m.id === data.id)) ? { ...data, isOptimistic: false } : m)
                        }
                        return [...prev, data]
                    })
                }
            }
        }

        const handleMessageSeen = (data: { messageId: string, seenBy: string, seenAt: string }) => {
            console.log('[ChatSidebar] 👁️ message_seen received:', data)
            const updater = (prev: any[]) => prev.map(m =>
                (m._id === data.messageId || m.id === data.messageId)
                    ? { ...m, seenBy: [...(m.seenBy || []), { userId: data.seenBy, seenAt: data.seenAt }] }
                    : m
            )
            setPrivateMessages(updater)
            setBoardMessages(updater)
        }

        const handleMessageDelivered = (data: { messageId: string, userId: string, deliveredAt: string }) => {
            console.log('[ChatSidebar] 📦 message_delivered received:', data)
            const updater = (prev: any[]) => prev.map(m =>
                (m._id === data.messageId || m.id === data.messageId)
                    ? { ...m, deliveredBy: [...(m.deliveredBy || []), { userId: data.userId, deliveredAt: data.deliveredAt }] }
                    : m
            )
            setPrivateMessages(updater)
            setBoardMessages(updater)
        }

        const handleMessageDeleted = (data: { messageId: string, scope: 'me' | 'everyone' }) => {
            console.log('[ChatSidebar] 🗑️ message_deleted received:', data)
            const deleter = (prev: any[]) => prev.map(m => {
                let updated = m
                // If this is the deleted message
                if (isSameId(m._id, data.messageId) || isSameId(m.id, data.messageId)) {
                    updated = { ...m, text: 'This message was deleted', isDeleted: true }
                }
                // If another message replies to this deleted message
                if (m.replyTo && (isSameId((m.replyTo as any)._id, data.messageId) || isSameId((m.replyTo as any).id, data.messageId))) {
                    updated = {
                        ...updated,
                        replyTo: { ...(m.replyTo as any), text: 'This message was deleted', isDeleted: true }
                    }
                }
                return updated
            })
            setBoardMessages(deleter)
            setPrivateMessages(deleter)
        }

        const handleFriendRequestReceived = () => loadRequests()
        const handleFriendRequestAccepted = () => {
            loadRequests()
            loadFriends()
        }

        socket.on('new_chat', handleNewChat)
        socket.on('message_seen', handleMessageSeen)
        socket.on('message_delivered', handleMessageDelivered)
        socket.on('message_deleted', handleMessageDeleted)
        socket.on('friend_request_received', handleFriendRequestReceived)
        socket.on('friend_request_accepted', handleFriendRequestAccepted)

        // Room join confirmation listener
        const handleRoomJoined = (data: any) => {
            console.log('[ChatSidebar] ✅ Room joined confirmation:', data)
        }
        socket.on('room_joined', handleRoomJoined)

        // Ensure rooms are joined
        const uid = extractId(user)
        const companyId = extractId(user.companyId)
        console.log('[ChatSidebar] 🔌 Joining rooms:', { uid, companyId, rawCompanyId: user.companyId })
        if (uid) socket.emit('join_user', uid)
        if (user.companyId) {
            console.log('[ChatSidebar] 📡 Emitting join_company with:', companyId)
            socket.emit('join_company', companyId)
        }

        return () => {
            socket.off('new_chat', handleNewChat)
            socket.off('message_seen', handleMessageSeen)
            socket.off('message_delivered', handleMessageDelivered)
            socket.off('message_deleted', handleMessageDeleted)
            socket.off('friend_request_received', handleFriendRequestReceived)
            socket.off('friend_request_accepted', handleFriendRequestAccepted)
            socket.off('room_joined', handleRoomJoined)
        }
    }, [user, socket]) // Stable dependencies, no selectedFriend here

    // Fetch private history when friend changes
    const fetchingHistoryForRef = useRef<string | null>(null)

    useEffect(() => {
        if (selectedFriend) {
            const fId = extractId(selectedFriend)
            console.log('[ChatSidebar] Friend changed, fetching history for:', fId)
            fetchingHistoryForRef.current = fId
            fetchChatHistory(fId)
            if (socket) socket.emit('join_user', extractId(user))
        }
    }, [selectedFriend, socket])

    const fetchBoardData = async () => {
        if (!user?.companyId) return
        try {
            const res = await socialService.getCompanyBoard()
            setBoardMessages(prev => {
                const history = [...res].reverse()
                const realTimeOnly = prev.filter(m => !history.some(h => h.text === m.text && isSameId(h.senderId, m.senderId)))
                return [...history, ...realTimeOnly]
            })
        } catch (err) {
        }
    }

    const scrollToMessage = (messageId: string) => {
        if (!messageId) return
        const element = document.getElementById(`msg-${messageId}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all', 'duration-500')
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
            }, 2000)
        }
    }

    const markAsSeen = async (msg: any) => {
        if (!user || isSameId(msg.senderId, user)) return
        const mid = msg._id || msg.id
        if (!mid || mid === 'undefined') return

        const isAlreadySeen = msg.seenBy?.some((s: any) => isSameId(s.userId, user))
        if (isAlreadySeen) return

        try {
            await socialService.markAsSeen(mid)
            const seenObj = { userId: user.id || (user as any)._id, seenAt: new Date().toISOString() }
            const updater = (prev: any[]) => prev.map(m =>
                (m._id === mid || m.id === mid)
                    ? { ...m, seenBy: [...(m.seenBy || []), seenObj] }
                    : m
            )
            setPrivateMessages(updater)
            setBoardMessages(updater)
        } catch (err) {
            console.error('Failed to mark as seen', err)
        }
    }

    const handleDeleteMessage = async (messageId: string, scope: 'me' | 'everyone') => {
        if (!messageId || messageId === 'undefined') {
            console.error('[ChatSidebar] Cannot delete message: undefined ID')
            return
        }
        try {
            await socialService.deleteMessage(messageId, scope)
            const updater = (prev: any[]) => prev.map(m =>
                (m._id === messageId || m.id === messageId)
                    ? (scope === 'everyone' ? { ...m, text: 'This message was deleted', isDeleted: true } : null)
                    : m
            ).filter(Boolean)

            setBoardMessages(updater)
            setPrivateMessages(updater)
            toast({ title: "Message deleted" })
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to delete message",
                variant: "destructive"
            })
        }
    }

    const handleCopyMessage = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({ title: "Copied to clipboard" })
    }

    const fetchChatHistory = async (friendId: string) => {
        try {
            const res = await socialService.getChatHistory(friendId)
            if (fetchingHistoryForRef.current !== friendId) return

            setPrivateMessages(prev => {
                const history = [...res].reverse()
                const realTimeArr = prev.filter(m => !history.some(h => h.text === m.text && isSameId(h.senderId, m.senderId)))
                return [...history, ...realTimeArr]
            })
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
            await socialService.getReceivedRequests()
        } catch (err) {
            console.error('Failed to load requests', err)
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


    // Update global active chat context so Provider knows NOT to increment badges
    useEffect(() => {
        if (!isOpen) {
            setActiveChat({ type: null, id: null })
            return
        }

        if (activeTab === 'company') {
            setActiveChat({ type: 'company' })
        } else if (activeTab === 'private' && selectedFriend) {
            setActiveChat({ type: 'private', id: extractId(selectedFriend) })
        } else {
            setActiveChat({ type: null, id: null })
        }
    }, [activeTab, selectedFriend, isOpen])

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user) return
        const text = inputText.trim()
        setInputText('')

        try {
            const recipientId = activeTab === 'private' ? extractId(selectedFriend) : undefined
            const companyId = activeTab === 'company' ? extractId(user.companyId) : undefined

            console.log('[ChatSidebar] Sending message:', { text, recipientId, companyId, rawCompanyId: user.companyId })

            // Optimistic update
            const optimisticMsg = {
                text,
                senderId: user.id,
                senderName: `${user.first_name} ${user.last_name}`,
                avatar: user.avatar,
                replyTo: replyTo ? { text: replyTo.text } : undefined,
                created_at: new Date().toISOString(),
                isOptimistic: true // Mark for tracing
            }

            if (activeTab === 'company') {
                setBoardMessages(prev => [...prev, optimisticMsg])
            } else {
                setPrivateMessages(prev => [...prev, optimisticMsg])
            }

            // API Call
            await socialService.sendMessage({
                text,
                recipientId,
                companyId,
                replyTo: replyTo?._id || replyTo?.id
            })
            if (replyTo) setReplyTo(null)
        } catch (error) {
            console.error('[ChatSidebar] Failed to send message:', error)
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive"
            })
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
                                    {(() => {
                                        const groups: Record<string, any[]> = {}
                                        boardMessages.forEach(m => {
                                            const d = formatChatDate(m.created_at)
                                            if (!groups[d]) groups[d] = []
                                            groups[d].push(m)
                                        })

                                        return Object.entries(groups).map(([date, msgs]) => (
                                            <div key={date} className="space-y-4">
                                                <div className="flex justify-center my-4">
                                                    <span className="text-[10px] font-medium bg-muted/50 px-2 py-1 rounded-full text-muted-foreground uppercase tracking-wider border border-primary/5">
                                                        {date}
                                                    </span>
                                                </div>
                                                {msgs.map((msg, i) => {
                                                    const isOwnMessage = isSameId(msg.senderId, user);
                                                    const senderName = msg.senderName ||
                                                        (msg.senderId?.first_name ? `${msg.senderId.first_name} ${msg.senderId.last_name}` : 'Unknown');
                                                    const messageDate = msg.created_at;

                                                    const senderAvatar = msg.senderId?.avatar || msg.avatar || null;
                                                    const senderInitials = senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

                                                    // Mark unread messages as seen
                                                    if (!isOwnMessage && isOpen && activeTab === 'company') {
                                                        markAsSeen(msg)
                                                    }

                                                    const isDeleted = msg.text === 'This message was deleted' || msg.isDeleted;

                                                    return (
                                                        <div key={msg._id || i} id={`msg-${msg._id || msg.id}`} className={cn("flex gap-3", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                                                            <Avatar className="h-7 w-7 flex-shrink-0 border shadow-sm">
                                                                <AvatarImage src={senderAvatar} />
                                                                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{senderInitials}</AvatarFallback>
                                                            </Avatar>

                                                            <div className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "items-end" : "items-start")}>
                                                                {!isOwnMessage && (
                                                                    <span className="text-[8px] font-bold text-muted-foreground mb-1 ml-1">
                                                                        {senderName}
                                                                    </span>
                                                                )}

                                                                {msg.replyTo && (
                                                                    <div
                                                                        onClick={() => scrollToMessage((msg.replyTo as any)._id || (msg.replyTo as any).id)}
                                                                        className="mb-1 bg-muted/40 p-2 rounded-lg border-l-4 border-primary/50 text-[10px] text-muted-foreground truncate w-full cursor-pointer hover:bg-muted/60 transition-colors flex flex-col gap-0.5"
                                                                    >
                                                                        <span className="font-bold text-[8px] uppercase opacity-50">Replying to</span>
                                                                        <span className={cn((msg.replyTo as any).isDeleted && "italic opacity-60")}>
                                                                            {(msg.replyTo as any).isDeleted ? 'Deleted message' : (msg.replyTo as any).text}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <div className={cn(
                                                                            "rounded-2xl px-3 py-2 text-xs shadow-sm cursor-pointer transition-all relative overflow-hidden",
                                                                            isOwnMessage
                                                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                                                : "bg-background border border-primary/5 text-foreground rounded-tl-none",
                                                                            isDeleted && "italic opacity-60 bg-muted/30 text-muted-foreground"
                                                                        )}>
                                                                            {msg.text}
                                                                        </div>
                                                                    </DropdownMenuTrigger>
                                                                    {!isDeleted && (
                                                                        <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'} className="w-40">
                                                                            <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => {
                                                                                setReplyTo(msg);
                                                                                setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
                                                                            }}>
                                                                                <Reply size={14} /> Reply
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => handleCopyMessage(msg.text)}>
                                                                                <Copy size={14} /> Copy
                                                                            </DropdownMenuItem>
                                                                            {isOwnMessage && (
                                                                                <DropdownMenuItem className="text-xs cursor-pointer gap-2 text-destructive" onClick={() => handleDeleteMessage(msg._id || msg.id, 'everyone')}>
                                                                                    <Trash2 size={14} /> Delete for Everyone
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                        </DropdownMenuContent>
                                                                    )}
                                                                </DropdownMenu>

                                                                <span className="text-[7px] text-muted-foreground/60 mt-1 px-1">
                                                                    {messageDate ? format(new Date(messageDate), 'h:mm a') : 'Now'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))
                                    })()}
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
                                        {filteredFriends.map(friend => {
                                            const friendId = friend._id || friend.id;
                                            return (
                                                <div
                                                    key={friendId}
                                                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-xl cursor-pointer transition-all group"
                                                    onClick={() => setSelectedFriend(friend)}
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10 border border-primary/10 group-hover:border-primary/30 transition-all">
                                                            <AvatarImage src={friend.avatar} />
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{friend.first_name?.[0]}{friend.last_name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        {onlineUsers.has(friendId) && (
                                                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col flex-1 overflow-hidden">
                                                        <span className="text-sm font-semibold truncate">{friend.first_name} {friend.last_name}</span>
                                                        <span className="text-[10px] text-muted-foreground truncate">{friend.email}</span>
                                                    </div>
                                                    {unreadChatCounts[friendId] > 0 && (
                                                        <Badge variant="destructive" className="h-5 w-5 rounded-full flex items-center justify-center p-0 text-[10px] font-bold">
                                                            {unreadChatCounts[friendId]}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )
                                        })}
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
                                            {onlineUsers.has(extractId(selectedFriend)) ? (
                                                <span className="text-[10px] text-green-500 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full" /> Online
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 bg-muted-foreground/30 rounded-full" />
                                                    {formatLastSeen(extractId(selectedFriend), selectedFriend.lastSeen)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Private Messages */}
                                    <div className="flex-1 overflow-y-auto px-3 py-1 flex flex-col custom-scrollbar min-h-0">
                                        <div className="space-y-4 py-2">
                                            {privateMessages.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                                    <MessageSquare size={48} className="mb-2" />
                                                    <p className="text-sm">No private messages yet.</p>
                                                </div>
                                            )}
                                            {(() => {
                                                const groups: Record<string, any[]> = {}
                                                privateMessages.forEach(m => {
                                                    const d = formatChatDate(m.created_at)
                                                    if (!groups[d]) groups[d] = []
                                                    groups[d].push(m)
                                                })

                                                return Object.entries(groups).map(([date, msgs]) => (
                                                    <div key={date} className="space-y-4">
                                                        <div className="flex justify-center my-4">
                                                            <span className="text-[10px] font-medium bg-muted/50 px-2 py-1 rounded-full text-muted-foreground uppercase tracking-wider border border-primary/5">
                                                                {date}
                                                            </span>
                                                        </div>
                                                        {msgs.map((msg, i) => {
                                                            const isOwnMessage = isSameId(msg.senderId, user);
                                                            const messageDate = msg.created_at;
                                                            const senderAvatar = isOwnMessage ? user.avatar : (msg.senderId?.avatar || msg.avatar || selectedFriend.avatar);
                                                            const senderInitials = isOwnMessage ? user.first_name[0] : selectedFriend.first_name[0];

                                                            // Mark unread messages as seen when they appear
                                                            if (!isOwnMessage && isOpen && activeTab === 'private') {
                                                                markAsSeen(msg)
                                                            }

                                                            const isSeenByRecipient = msg.seenBy?.some((s: any) => !isSameId(s.userId, msg.senderId));
                                                            const isDeliveredToRecipient = msg.deliveredBy?.some((d: any) => !isSameId(d.userId, msg.senderId));
                                                            const isDeleted = msg.text === 'This message was deleted' || msg.isDeleted;

                                                            return (
                                                                <div key={msg._id || i} id={`msg-${msg._id || msg.id}`} className={cn("flex gap-2 group relative", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                                                                    <Avatar className="h-7 w-7 flex-shrink-0 border shadow-sm">
                                                                        <AvatarImage src={senderAvatar} />
                                                                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{senderInitials}</AvatarFallback>
                                                                    </Avatar>

                                                                    <div className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "items-end" : "items-start")}>
                                                                        {msg.replyTo && (
                                                                            <div
                                                                                onClick={() => scrollToMessage((msg.replyTo as any)._id || (msg.replyTo as any).id)}
                                                                                className="mb-1 bg-muted/40 p-2 rounded-lg border-l-4 border-primary/50 text-[10px] text-muted-foreground truncate w-full cursor-pointer hover:bg-muted/60 transition-colors flex flex-col gap-0.5"
                                                                            >
                                                                                <span className="font-bold text-[8px] uppercase opacity-50">Replying to</span>
                                                                                <span className={cn((msg.replyTo as any).isDeleted && "italic opacity-60")}>
                                                                                    {(msg.replyTo as any).isDeleted ? 'Deleted message' : (msg.replyTo as any).text}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <div className={cn(
                                                                                    "rounded-2xl px-3 py-2 text-xs shadow-sm cursor-pointer transition-all relative overflow-hidden",
                                                                                    isOwnMessage
                                                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                                                        : "bg-background border border-primary/5 text-foreground rounded-tl-none",
                                                                                    isDeleted && "italic opacity-60 bg-muted/30 text-muted-foreground"
                                                                                )}>
                                                                                    {msg.text}
                                                                                </div>
                                                                            </DropdownMenuTrigger>
                                                                            {!isDeleted && (
                                                                                <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'} className="w-40">
                                                                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => {
                                                                                        setReplyTo(msg);
                                                                                        setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
                                                                                    }}>
                                                                                        <Reply size={14} /> Reply
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => handleCopyMessage(msg.text)}>
                                                                                        <Copy size={14} /> Copy
                                                                                    </DropdownMenuItem>
                                                                                    {isOwnMessage && (
                                                                                        <>
                                                                                            {!isSeenByRecipient && (
                                                                                                <DropdownMenuItem className="text-xs cursor-pointer gap-2 text-destructive" onClick={() => handleDeleteMessage(msg._id || msg.id, 'everyone')}>
                                                                                                    <Trash2 size={14} /> Delete for Everyone
                                                                                                </DropdownMenuItem>
                                                                                            )}
                                                                                            <DropdownMenuItem className="text-xs cursor-pointer gap-2 text-destructive" onClick={() => handleDeleteMessage(msg._id || msg.id, 'me')}>
                                                                                                <Trash2 size={14} /> Delete for Me
                                                                                            </DropdownMenuItem>
                                                                                        </>
                                                                                    )}
                                                                                </DropdownMenuContent>
                                                                            )}
                                                                        </DropdownMenu>

                                                                        <div className="flex items-center gap-1 mt-1 px-1">
                                                                            <span className="text-[7px] text-muted-foreground/60">
                                                                                {messageDate ? format(new Date(messageDate), 'h:mm a') : 'Now'}
                                                                            </span>
                                                                            {isOwnMessage && !isDeleted && (
                                                                                <span className="ml-1">
                                                                                    {msg.isOptimistic ? (
                                                                                        <Clock size={8} className="text-muted-foreground/40 animate-pulse" />
                                                                                    ) : isSeenByRecipient ? (
                                                                                        <CheckCheck size={10} className="text-blue-500" />
                                                                                    ) : isDeliveredToRecipient ? (
                                                                                        <CheckCheck size={10} className="text-muted-foreground/60" />
                                                                                    ) : (
                                                                                        <Check size={10} className="text-muted-foreground/60" />
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ))
                                            })()}
                                            <div ref={scrollRef} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                    </div>

                    {/* Input Area (Shared between Board and Direct if friend selected) */}
                    {(activeTab === 'company' || (activeTab === 'private' && selectedFriend)) && (
                        <div className="p-3 border-t bg-muted/10">
                            {replyTo && (
                                <div className="mb-2 bg-muted/50 p-2 rounded-lg border-l-4 border-primary flex justify-between items-center animate-in slide-in-from-bottom-2">
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[9px] font-bold text-primary flex items-center gap-1">
                                            <Reply size={10} /> Replying to
                                        </span>
                                        <p className="text-[10px] text-muted-foreground truncate">{replyTo.text}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
                                        <X size={14} />
                                    </Button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Input
                                    id="chat-input"
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
                    {/* Connection Diagnostic */}
                    <div className="px-3 py-1 bg-muted/5 border-t text-[8px] text-muted-foreground/40 flex justify-between items-center">
                        <div className="flex gap-2">
                            <span>Socket: {socket?.connected ? '✅' : '❌'} {socket?.id?.substring(0, 6)}</span>
                            <span>Comp: {extractId(user?.companyId).substring(0, 6)}...</span>
                        </div>
                        <button
                            onClick={() => {
                                if (socket) {
                                    socket.disconnect();
                                    setTimeout(() => socket.connect(), 500);
                                    toast({ title: "Reconnecting socket..." });
                                }
                            }}
                            className="hover:text-primary transition-colors"
                            title="Force Reconnect"
                        >
                            Reconnect
                        </button>
                    </div>
                </Tabs>
            </div>
        </aside>
    )
}
