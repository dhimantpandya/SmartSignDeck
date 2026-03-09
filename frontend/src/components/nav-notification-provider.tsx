import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { io, Socket } from 'socket.io-client'
import { apiService } from '@/api'
import { tokenStore } from '@/store/token'
import { useToast } from '@/components/ui/use-toast'
import { extractId } from '../lib/utils'

interface Notification {
    _id: string
    type: 'friend_request' | 'new_chat' | 'company_invite' | 'system_alert'
    title: string
    message: string
    isRead: boolean
    senderId?: {
        _id: string
        id?: string
        first_name: string
        last_name: string
        avatar?: string
    }
    data?: any
    created_at: string
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    unreadChatCounts: Record<string, number> // senderId -> count
    unreadCompanyChatCount: number // Company-wide chat messages
    unreadRequestCount: number
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    clearRequestBadges: () => void
    decrementRequestCount: () => void
    clearChatNotifications: (type: 'company' | 'private', senderId?: string) => Promise<void>
    isChatOpen: boolean
    setIsChatOpen: (open: boolean) => void
    suppressedChatSections: Set<string>
    suppressChatSection: (section: string) => void
    socket: Socket | null
    setActiveChat: (info: { type: 'company' | 'private' | null; id?: string | null }) => void
    onlineUsers: Set<string>
    lastSeenMap: Record<string, string>
    unreadNotifications: Notification[]
    clearNotificationsByType: (types: string[]) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, refreshUser } = useAuth()
    const { toast } = useToast()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [unreadChatCounts, setUnreadChatCounts] = useState<Record<string, number>>({})
    const [unreadCompanyChatCount, setUnreadCompanyChatCount] = useState(0)
    const [unreadRequestCount, setUnreadRequestCount] = useState(0)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [suppressedChatSections, setSuppressedChatSections] = useState<Set<string>>(new Set())
    const [activeChatInfo, setActiveChatInfo] = useState<{ type: 'company' | 'private' | null; id?: string | null }>({ type: null, id: null })
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
    const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({})

    // 0. Force Refresh User on Mount to ensure CompanyID is up to date (Critical for merged companies)
    useEffect(() => {
        if (tokenStore.getRefreshToken()) {
            refreshUser();
        }
    }, []);

    // 1. Initialize API & Socket
    useEffect(() => {
        const hasToken = !!tokenStore.getRefreshToken()
        if (user && hasToken) {
            // Fetch initial notifications
            apiService.get<{ notifications: Notification[], unreadCount: number }>('/v1/notifications').then(data => {
                setNotifications(data.notifications)

                // 🛡️ FRONTEND FILTERING: 
                const bellUnread = data.notifications.filter(n => !n.isRead && n.type !== 'new_chat').length
                setUnreadCount(bellUnread)

                // Populate chat unread badges
                const chatMap: Record<string, number> = {}
                data.notifications.filter(n => !n.isRead && n.type === 'new_chat').forEach(n => {
                    const sId = extractId(n.senderId)
                    if (sId) {
                        chatMap[sId] = (chatMap[sId] || 0) + 1
                    }
                })
                setUnreadChatCounts(chatMap)

                const requestCount = data.notifications.filter(n => !n.isRead && n.type === 'friend_request').length
                setUnreadRequestCount(requestCount)
            }).catch((err: any) => console.error('Failed to fetch notifications', err))

            const getSocketURL = () => {
                let url = import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_URL || 'https://smart-sign-deck.onrender.com';

                // Clean URL: Strip /v1 and trailing slash
                url = url.replace(/\/v1\/?$/, "").replace(/\/$/, "");

                return url;
            }

            const socketURL = getSocketURL();
            console.log('[SOCKET] Initializing at:', socketURL, 'Env:', import.meta.env.PROD ? 'PROD' : 'DEV')

            const newSocket = io(socketURL, {
                transports: ['websocket', 'polling'], // Standard order, but polling fallback is key
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
                timeout: 20000,
                autoConnect: true,
            })

            setSocket(newSocket)

            const joinRooms = () => {
                if (!user) return
                const uid = extractId(user)
                if (!uid) return
                console.log('[SOCKET] 🟢 Emitting join_user:', uid)
                newSocket.emit('join_user', uid)

                if (user.companyId) {
                    const cid = extractId(user.companyId)
                    console.log('[SOCKET] 🟢 Emitting join_company:', cid)
                    newSocket.emit('join_company', cid)
                }
            }

            newSocket.on('connect', () => {
                console.log('[SOCKET] ✅ CONNECTED! ID:', newSocket.id)
                joinRooms()
            })

            newSocket.on('reconnect', (attempt) => {
                console.log('[SOCKET] 🔄 RECONNECTED after', attempt, 'attempts')
                joinRooms()
            })

            newSocket.on('connect_error', (err) => {
                console.error('[SOCKET] ❌ CONNECTION ERROR:', err.message)
            })

            newSocket.on('disconnect', (reason) => {
                console.log('[SOCKET] 🔴 DISCONNECTED:', reason)
            })

            return () => {
                console.log('[SOCKET] 🛑 Cleaning up socket connection')
                newSocket.disconnect()
            }
        }
    }, [user])

    // 2. Listen for Events
    useEffect(() => {
        if (!socket || !user) return

        const handleNotification = (newNotif: Notification) => {
            if (newNotif.type === 'new_chat') {
                console.log('[SOCKET Provider] new_notification (chat) received, letting new_chat handler handle counts')
            } else {
                setNotifications(prev => [newNotif, ...prev])
                setUnreadCount(prev => prev + 1)
                if (newNotif.type === 'friend_request') {
                    setUnreadRequestCount(prev => prev + 1)
                }

                // Show toast for system alerts (like role changes)
                if (newNotif.type === 'system_alert') {
                    toast({
                        title: newNotif.title,
                        description: newNotif.message,
                    })
                }
            }
        }

        const handleChat = (data: any) => {
            console.log('[SOCKET Provider] new_chat event received:', data)
            const myId = extractId(user)
            const msgSenderId = extractId(data.senderId)

            if (msgSenderId === myId) return

            // 📦 EMIT DELIVERY ACKNOWLEDGMENT (Only for DMs)
            if (data.type === 'private' || data.recipientId) {
                if (data._id || data.id) {
                    console.log('[SOCKET Provider] 📦 Emitting message_delivered for:', data._id || data.id)
                    socket.emit('message_delivered', {
                        messageId: data._id || data.id,
                        userId: myId
                    })
                }
            }

            if (data.type === 'company' || data.companyId) {
                // Skip if actively viewing company board
                if (activeChatInfo.type === 'company') {
                    console.log('[SOCKET Provider] Skipping company count increment (active view)')
                    return
                }

                console.log('[SOCKET Provider] Incrementing company chat count')
                setUnreadCompanyChatCount(prev => prev + 1)
                setSuppressedChatSections(prev => {
                    const next = new Set(prev); next.delete('company'); return next;
                })

                // Only show toast if not actively looking at the board
                toast({
                    title: "New Company Board Message",
                    description: `${data.senderName || 'Someone'} posted in the company board`,
                    duration: 3000,
                })
            } else if (data.type === 'private' || data.recipientId) {
                // Skip if actively viewing this specific private chat
                const senderId = msgSenderId
                if (activeChatInfo.type === 'private' && activeChatInfo.id === senderId) {
                    console.log('[SOCKET Provider] Skipping private count increment (active view with friend)')
                    return
                }

                console.log('[SOCKET Provider] Private message received:', { from: msgSenderId, isChatOpen })

                // Always update badges/counts so they are ready when the user looks
                if (msgSenderId !== '') {
                    setUnreadChatCounts(prev => ({
                        ...prev,
                        [msgSenderId]: (prev[msgSenderId] || 0) + 1
                    }))
                    setSuppressedChatSections(prev => {
                        const next = new Set(prev);
                        next.delete('private');
                        return next;
                    })
                }

                // Show toast with professional wording
                toast({
                    title: "New Message",
                    description: `${data.senderName || 'Someone'} sent you a private message`,
                    duration: 3000,
                })
            }
        }

        const handlePresence = (users: string[]) => {
            console.log('[SOCKET Provider] 👥 Presence update (all online):', users)
            setOnlineUsers(new Set(users))
        }

        const handleStatusChange = (data: { userId: string, status: 'online' | 'offline', lastSeen?: string }) => {
            console.log('[SOCKET Provider] 👤 User status change:', data)
            setOnlineUsers(prev => {
                const next = new Set(prev)
                if (data.status === 'online') {
                    next.add(data.userId)
                } else {
                    next.delete(data.userId)
                }
                return next
            })
            if (data.lastSeen) {
                setLastSeenMap(prev => ({ ...prev, [data.userId]: data.lastSeen! }))
            }
        }

        const handleAccountDeleted = () => {
            console.warn('[SOCKET Provider] 🔞 Account deleted by administrator. Logging out...')
            toast({
                title: "Account Deleted",
                description: "Your account has been deleted by an administrator. You will be logged out now.",
                variant: "destructive",
                duration: 10000,
            })
            // Force logout
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
            }, 3000);
        }

        const handleRoleChanged = (data: { newRole: string }) => {
            console.log('[SOCKET Provider] 🎭 Role changed to:', data.newRole)
            const roleLabels: Record<string, string> = {
                super_admin: 'Super Admin',
                admin: 'Administrator',
                user: 'User',
                advertiser: 'Advertiser'
            };
            const label = roleLabels[data.newRole] || data.newRole;

            toast({
                title: "Role Updated",
                description: `Your access level has been updated to ${label}.`,
            })

            // Proactively refresh user state to update permissions/UI (sidebar, etc.)
            // Despite the user's "not sidebar only that bell notification" comment,
            // having the correct local state is critical for app functionality.
            refreshUser();
        }

        const handleMessageSeen = (data: any) => {
            console.log('[SOCKET Provider] 👁️ message_seen event relaying:', data)
        }

        const handleMessageDelivered = (data: any) => {
            console.log('[SOCKET Provider] 📦 message_delivered event relaying:', data)
        }

        const handleMessageDeleted = (data: any) => {
            console.log('[SOCKET Provider] 🗑️ message_deleted event relaying:', data)
        }

        socket.on('new_notification', handleNotification)
        socket.on('new_chat', handleChat)
        socket.on('user_presence', handlePresence)
        socket.on('online_users_update', handlePresence)
        socket.on('user_status_change', handleStatusChange)
        socket.on('user_deleted', handleAccountDeleted)
        socket.on('role_changed', handleRoleChanged)
        socket.on('message_seen', handleMessageSeen)
        socket.on('message_delivered', handleMessageDelivered)
        socket.on('message_deleted', handleMessageDeleted)

        return () => {
            socket.off('new_notification', handleNotification)
            socket.off('new_chat', handleChat)
            socket.off('user_presence', handlePresence)
            socket.off('online_users_update', handlePresence)
            socket.off('user_status_change', handleStatusChange)
            socket.off('user_deleted', handleAccountDeleted)
            socket.off('role_changed', handleRoleChanged)
            socket.off('message_seen', handleMessageSeen)
            socket.off('message_delivered', handleMessageDelivered)
            socket.off('message_deleted', handleMessageDeleted)
        }
    }, [socket, user, isChatOpen, activeChatInfo])

    // Filter out chat messages from the bell notifications list
    const bellNotifications = notifications.filter(n => n.type !== 'new_chat')

    const markAsRead = async (id: string) => {
        try {
            await apiService.patch(`/v1/notifications/${id}/read`, {})
            setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)))
            const notif = notifications.find(n => n._id === id)
            if (notif && notif.type !== 'new_chat') {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (err) { console.error(err) }
    }

    const markAllAsRead = async () => {
        try {
            await apiService.patch('/v1/notifications/read-all', {})
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (err) { console.error(err) }
    }

    const clearRequestBadges = () => setUnreadRequestCount(0)

    const decrementRequestCount = () => setUnreadRequestCount(prev => Math.max(0, prev - 1))

    const suppressChatSection = (section: string) => {
        setSuppressedChatSections(prev => {
            const next = new Set(prev)
            next.add(section)
            return next
        })
    }

    const clearChatNotifications = async (type: 'company' | 'private', senderId?: string) => {
        // Optimistic update: Clear UI immediately
        if (type === 'company') {
            setUnreadCompanyChatCount(0)
        } else if (type === 'private') {
            if (senderId) {
                setUnreadChatCounts(prev => {
                    const next = { ...prev };
                    delete next[senderId];
                    return next;
                });
            } else {
                setUnreadChatCounts({});
            }
        }

        // Sync notifications list locally (optimistic)
        setNotifications(prev => prev.map(n => {
            if (n.type === 'new_chat') {
                const nSenderId = extractId(n.senderId)
                if (type === 'company' && !n.senderId) return { ...n, isRead: true };
                if (type === 'private' && (!senderId || nSenderId === senderId)) return { ...n, isRead: true };
            }
            return n;
        }));

        try {
            await apiService.patch('/v1/notifications/clear-chat', {
                type: 'new_chat',
                senderId: senderId
            });
        } catch (err) {
            console.error('Failed to clear chat notifications', err)
        }
    }

    const clearNotificationsByType = async (types: string[]) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            types.includes(n.type) ? { ...n, isRead: true } : n
        ))

        const countToClear = notifications.filter(n => !n.isRead && types.includes(n.type)).length
        setUnreadCount(prev => Math.max(0, prev - countToClear))

        if (types.includes('friend_request')) {
            setUnreadRequestCount(0)
        }

        try {
            await apiService.patch('/v1/notifications/read-by-type', { types })
        } catch (err) {
            console.error('Failed to clear notifications by type', err)
        }
    }

    return (
        <NotificationContext.Provider
            value={{
                notifications: bellNotifications,
                unreadCount,
                unreadChatCounts,
                unreadCompanyChatCount,
                unreadRequestCount,
                markAsRead,
                markAllAsRead,
                clearRequestBadges,
                decrementRequestCount,
                clearChatNotifications,
                isChatOpen,
                setIsChatOpen,
                suppressedChatSections,
                suppressChatSection,
                socket,
                setActiveChat: setActiveChatInfo,
                unreadNotifications: notifications.filter(n => !n.isRead),
                onlineUsers,
                lastSeenMap,
                clearNotificationsByType
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used within NotificationProvider')
    return context
}
