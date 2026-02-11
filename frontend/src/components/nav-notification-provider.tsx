import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { io, Socket } from 'socket.io-client'
import { apiService } from '@/api'
import { tokenStore } from '@/store/token'

interface Notification {
    _id: string
    type: 'friend_request' | 'new_chat' | 'company_invite' | 'system_alert'
    title: string
    message: string
    isRead: boolean
    senderId?: {
        _id: string
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
    clearChatBadges: () => void
    clearCompanyChatBadge: () => void
    clearRequestBadges: () => void
    clearChatNotifications: (type: 'company' | 'private', senderId?: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [unreadChatCounts, setUnreadChatCounts] = useState<Record<string, number>>({})
    const [unreadCompanyChatCount, setUnreadCompanyChatCount] = useState(0)
    const [unreadRequestCount, setUnreadRequestCount] = useState(0)

    // 1. Initialize API & Socket
    useEffect(() => {
        const hasToken = !!tokenStore.getRefreshToken()
        if (user && hasToken) {
            console.log('[NotificationProvider] Initializing for user:', user.id)

            // Fetch initial notifications
            apiService.get<{ notifications: Notification[], unreadCount: number }>('/v1/notifications').then(data => {
                console.log('[NotificationProvider] Loaded notifications:', data.notifications.length)
                setNotifications(data.notifications)

                // 🛡️ FRONTEND FILTERING: 
                // Recalculate unread counts based on user's desired separation
                const bellUnread = data.notifications.filter(n => !n.isRead && n.type !== 'new_chat').length
                setUnreadCount(bellUnread)

                // Populate chat unread badges from the same list
                const chatMap: Record<string, number> = {}
                data.notifications.filter(n => !n.isRead && n.type === 'new_chat').forEach(n => {
                    const senderId = n.senderId?._id || 'unknown'
                    chatMap[senderId] = (chatMap[senderId] || 0) + 1
                })
                setUnreadChatCounts(chatMap)

                // Friend request specific count
                const requestCount = data.notifications.filter(n => !n.isRead && n.type === 'friend_request').length
                setUnreadRequestCount(requestCount)
            }).catch((err: any) => console.error('Failed to fetch notifications', err))

            // Connect Socket
            const socketURL = import.meta.env.PROD
                ? 'https://smart-sign-deck.onrender.com'
                : (import.meta.env.VITE_API_URL || 'http://localhost:5000')

            console.log('[NotificationProvider] Connecting socket to:', socketURL)
            const newSocket = io(socketURL)
            setSocket(newSocket)

            newSocket.on('connect', () => {
                console.log('[NotificationProvider] Socket connected:', newSocket.id)
            })

            newSocket.on('disconnect', () => {
                console.log('[NotificationProvider] Socket disconnected')
            })

            newSocket.emit('join_user', user.id)
            console.log('[NotificationProvider] Emitted join_user:', user.id)

            if (user.companyId) {
                newSocket.emit('join_company', user.companyId)
                console.log('[NotificationProvider] Emitted join_company:', user.companyId)
            }

            return () => {
                console.log('[NotificationProvider] Cleaning up socket connection')
                newSocket.disconnect()
            }
        }
    }, [user])

    // 2. Listen for Events
    useEffect(() => {
        if (!socket) return

        console.log('[NotificationProvider] Setting up event listeners')

        // Standard Notifications (Bell)
        socket.on('new_notification', (newNotif: Notification) => {
            console.log('[NotificationProvider] Received new_notification:', newNotif)

            if (newNotif.type === 'new_chat') {
                // If it's a chat notification, update chat logic rather than global bell
                const senderId = newNotif.senderId?._id || 'unknown'
                setUnreadChatCounts(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }))
                // We still keep it in notifications for now if fetched later, 
                // but the unreadCount badge for Bell will filter it out.
            } else {
                setNotifications(prev => [newNotif, ...prev])
                setUnreadCount(prev => prev + 1)

                if (newNotif.type === 'friend_request') {
                    setUnreadRequestCount(prev => prev + 1)
                }
            }
        })

        // Chat Badges (Sidebar) - This might be redundant if backend sends BOTH events, 
        // but we keep it specialized for raw chat events that don't hit the notification DB
        socket.on('new_chat', (data: any) => {
            console.log('[NotificationProvider] Received new_chat raw event:', data)
            if (data.type === 'company' && data.senderId !== user?.id) {
                setUnreadCompanyChatCount(prev => prev + 1)
            } else if (data.type === 'private' && data.senderId !== user?.id) {
                setUnreadChatCounts(prev => ({
                    ...prev,
                    [data.senderId]: (prev[data.senderId] || 0) + 1
                }))
            }
        })

        return () => {
            console.log('[NotificationProvider] Cleaning up event listeners')
            socket.off('new_notification')
            socket.off('new_chat')
        }
    }, [socket, user])

    // 3. Derived State for UI
    // Filter out chat messages from the bell notifications
    const bellNotifications = notifications.filter(n => n.type !== 'new_chat')

    // Actions
    const markAsRead = async (id: string) => {
        try {
            await apiService.patch(`/v1/notifications/${id}/read`, {})
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
            )

            // Adjust count only if it was a bell notification
            const notif = notifications.find(n => n._id === id)
            if (notif && notif.type !== 'new_chat') {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (err) {
            console.error(err)
        }
    }

    const markAllAsRead = async () => {
        try {
            await apiService.patch('/v1/notifications/read-all', {})
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error(err)
        }
    }

    const clearChatBadges = () => {
        setUnreadChatCounts({})
    }

    const clearCompanyChatBadge = () => {
        setUnreadCompanyChatCount(0)
    }

    const clearRequestBadges = () => {
        setUnreadRequestCount(0)
    }

    const clearChatNotifications = async (type: 'company' | 'private', senderId?: string) => {
        try {
            // 1. Mark as read in Backend
            const notificationType = 'new_chat'; // The type in DB
            await apiService.patch('/v1/notifications/clear-chat', {
                type: notificationType,
                senderId: senderId
            });

            // 2. Update local state
            if (type === 'company') {
                setUnreadCompanyChatCount(0);
            } else if (type === 'private' && senderId) {
                setUnreadChatCounts(prev => {
                    const newCounts = { ...prev };
                    delete newCounts[senderId];
                    return newCounts;
                });
            }

            // Also remove from the master notifications list (or mark as read)
            setNotifications(prev => prev.map(n => {
                if (n.type === 'new_chat') {
                    // Match company: no senderId in notification data usually means company board in this logic
                    // Match private: senderId match
                    const nSenderId = n.senderId?._id || n.senderId;
                    if (type === 'company' && !n.senderId) return { ...n, isRead: true };
                    if (type === 'private' && nSenderId === senderId) return { ...n, isRead: true };
                }
                return n;
            }));

        } catch (err) {
            console.error('[NotificationProvider] Failed to clear chat notifications:', err);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications: bellNotifications, // Bell only!
                unreadCount, // Bell only!
                unreadChatCounts,
                unreadCompanyChatCount,
                unreadRequestCount,
                markAsRead,
                markAllAsRead,
                clearChatBadges,
                clearCompanyChatBadge,
                clearRequestBadges,
                clearChatNotifications
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
