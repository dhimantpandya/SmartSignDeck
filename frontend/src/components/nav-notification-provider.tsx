import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './use-auth'
import { io, Socket } from 'socket.io-client'
import { axiosInstance } from '@/api/axios'

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
    unreadRequestCount: number
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    clearChatBadges: () => void
    clearRequestBadges: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [unreadChatCounts, setUnreadChatCounts] = useState<Record<string, number>>({})
    const [unreadRequestCount, setUnreadRequestCount] = useState(0)

    // 1. Initialize API & Socket
    useEffect(() => {
        if (user) {
            // Fetch initial notifications
            axiosInstance.get('/notifications').then(res => {
                setNotifications(res.data.notifications)
                setUnreadCount(res.data.unreadCount)
            }).catch(err => console.error('Failed to fetch notifications', err))

            // Connect Socket
            const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:10000')
            setSocket(newSocket)

            newSocket.emit('join_user', user.id)

            return () => {
                newSocket.disconnect()
            }
        }
    }, [user])

    // 2. Listen for Events
    useEffect(() => {
        if (!socket) return

        // Standard Notifications (Bell)
        socket.on('new_notification', (newNotif: Notification) => {
            setNotifications(prev => [newNotif, ...prev])
            setUnreadCount(prev => prev + 1)

            // Also update request count if it's a friend request
            if (newNotif.type === 'friend_request') {
                setUnreadRequestCount(prev => prev + 1)
            }
        })

        // Chat Badges (Sidebar)
        socket.on('new_chat', (data: any) => {
            // Only increment if it's a private message received (not sent by me)
            if (data.type === 'private' && data.senderId !== user?.id) {
                setUnreadChatCounts(prev => ({
                    ...prev,
                    [data.senderId]: (prev[data.senderId] || 0) + 1
                }))
            }
        })

        return () => {
            socket.off('new_notification')
            socket.off('new_chat')
        }
    }, [socket, user])

    // 3. Actions
    const markAsRead = async (id: string) => {
        try {
            await axiosInstance.patch(`/notifications/${id}/read`)
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
            await axiosInstance.patch('/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error(err)
        }
    }

    const clearChatBadges = () => {
        setUnreadChatCounts({})
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
                unreadRequestCount,
                markAsRead,
                markAllAsRead,
                clearChatBadges,
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
