import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { io, Socket } from 'socket.io-client'
import { apiService } from '@/api'

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
        if (user) {
            console.log('[NotificationProvider] Initializing for user:', user.id)

            // Fetch initial notifications
            apiService.get<{ notifications: Notification[], unreadCount: number }>('/v1/notifications').then(data => {
                console.log('[NotificationProvider] Loaded notifications:', data.notifications.length, 'unread:', data.unreadCount)
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }).catch((err: any) => console.error('Failed to fetch notifications', err))

            // Connect Socket
            const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:10000')
            console.log('[NotificationProvider] Connecting socket to:', import.meta.env.VITE_API_URL || 'http://localhost:10000')
            setSocket(newSocket)

            newSocket.on('connect', () => {
                console.log('[NotificationProvider] Socket connected:', newSocket.id)
            })

            newSocket.on('disconnect', () => {
                console.log('[NotificationProvider] Socket disconnected')
            })

            newSocket.emit('join_user', user.id)
            console.log('[NotificationProvider] Emitted join_user:', user.id)

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
            setNotifications(prev => [newNotif, ...prev])
            setUnreadCount(prev => prev + 1)

            // Also update request count if it's a friend request
            if (newNotif.type === 'friend_request') {
                setUnreadRequestCount(prev => prev + 1)
            }
        })

        // Chat Badges (Sidebar)
        socket.on('new_chat', (data: any) => {
            console.log('[NotificationProvider] Received new_chat:', data)
            if (data.type === 'company' && data.senderId !== user?.id) {
                // Company-wide message (not sent by me)
                console.log('[NotificationProvider] Incrementing company chat count')
                setUnreadCompanyChatCount(prev => prev + 1)
            } else if (data.type === 'private' && data.senderId !== user?.id) {
                // Private message (not sent by me)
                console.log('[NotificationProvider] Incrementing private chat count for sender:', data.senderId)
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

    // 3. Actions
    const markAsRead = async (id: string) => {
        try {
            await apiService.patch(`/v1/notifications/${id}/read`, {})
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
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

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                unreadChatCounts,
                unreadCompanyChatCount,
                unreadRequestCount,
                markAsRead,
                markAllAsRead,
                clearChatBadges,
                clearCompanyChatBadge,
                clearRequestBadges
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
