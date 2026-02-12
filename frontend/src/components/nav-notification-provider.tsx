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
    clearChatNotifications: (type: 'company' | 'private', senderId?: string) => Promise<void>
    isChatOpen: boolean
    setIsChatOpen: (open: boolean) => void
    suppressedChatSections: Set<string>
    suppressChatSection: (section: string) => void
    socket: Socket | null
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const { toast } = useToast()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [unreadChatCounts, setUnreadChatCounts] = useState<Record<string, number>>({})
    const [unreadCompanyChatCount, setUnreadCompanyChatCount] = useState(0)
    const [unreadRequestCount, setUnreadRequestCount] = useState(0)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [suppressedChatSections, setSuppressedChatSections] = useState<Set<string>>(new Set())

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
                const prodUrl = import.meta.env.VITE_APP_URL || 'https://smart-sign-deck.onrender.com';
                const devUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5000';

                let url = import.meta.env.PROD ? prodUrl : devUrl;

                // Clean URL: Strip /v1 if present
                if (url.endsWith('/v1')) url = url.slice(0, -3);
                if (url.endsWith('/')) url = url.slice(0, -1);

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
            }
        }

        const handleChat = (data: any) => {
            console.log('[SOCKET Provider] new_chat event received:', data)
            const myId = extractId(user)
            const msgSenderId = extractId(data.senderId)

            if (msgSenderId === myId) return

            if (data.type === 'company' || data.companyId) {
                console.log('[SOCKET Provider] Incrementing company chat count')
                setUnreadCompanyChatCount(prev => prev + 1)
                setSuppressedChatSections(prev => {
                    const next = new Set(prev); next.delete('company'); return next;
                })
            } else if (data.type === 'private' || data.recipientId) {
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

                // Only show toast if chat is closed
                if (!isChatOpen) {
                    toast({
                        title: "New Message",
                        description: `${data.senderName || 'Someone'} sent you a message`,
                        duration: 3000,
                    })
                }
            }
        }

        socket.on('new_notification', handleNotification)
        socket.on('new_chat', handleChat)

        return () => {
            socket.off('new_notification', handleNotification)
            socket.off('new_chat', handleChat)
        }
    }, [socket, user, isChatOpen])

    // Filter out chat messages from the bell notifications list
    const bellNotifications = notifications.filter(n => n.type !== 'new_chat')

    // Actions
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
            setUnreadCompanyChatCount(0);
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
    };

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
                clearChatNotifications,
                isChatOpen,
                setIsChatOpen,
                suppressedChatSections,
                suppressChatSection,
                socket
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
