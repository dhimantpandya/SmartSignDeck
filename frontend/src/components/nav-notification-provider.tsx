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
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// Helper for robust ID extraction
const extractId = (senderId: any): string | null => {
    if (!senderId) return null
    if (typeof senderId === 'string') return senderId
    return (senderId._id || senderId.id)?.toString() || null
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
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

            // Connect Socket
            const socketURL = import.meta.env.PROD
                ? 'https://smart-sign-deck.onrender.com'
                : (import.meta.env.VITE_API_URL || 'http://localhost:5000')

            const newSocket = io(socketURL)
            setSocket(newSocket)

            newSocket.emit('join_user', user.id)
            if (user.companyId) {
                newSocket.emit('join_company', user.companyId)
            }

            return () => {
                newSocket.disconnect()
            }
        }
    }, [user])

    // 2. Listen for Events
    useEffect(() => {
        if (!socket || !user) return

        socket.on('new_notification', (newNotif: Notification) => {
            if (newNotif.type === 'new_chat') {
                const sId = extractId(newNotif.senderId)
                if (sId) {
                    setUnreadChatCounts(prev => ({
                        ...prev,
                        [sId]: (prev[sId] || 0) + 1
                    }))
                    setSuppressedChatSections(prev => {
                        if (prev.has('private')) {
                            const next = new Set(prev)
                            next.delete('private')
                            return next
                        }
                        return prev
                    })
                } else {
                    setUnreadCompanyChatCount(prev => prev + 1)
                    setSuppressedChatSections(prev => {
                        if (prev.has('company')) {
                            const next = new Set(prev)
                            next.delete('company')
                            return next
                        }
                        return prev
                    })
                }
            } else {
                setNotifications(prev => [newNotif, ...prev])
                setUnreadCount(prev => prev + 1)
                if (newNotif.type === 'friend_request') {
                    setUnreadRequestCount(prev => prev + 1)
                }
            }
        })

        socket.on('new_chat', (data: any) => {
            if (data.senderId === user.id) return

            if (data.type === 'company') {
                setUnreadCompanyChatCount(prev => prev + 1)
                setSuppressedChatSections(prev => {
                    const next = new Set(prev); next.delete('company'); return next;
                })
            } else if (data.type === 'private' && !isChatOpen) {
                // Only update badge from new_chat if sidebar is closed
                // When sidebar is open, new_notification will handle it
                setUnreadChatCounts(prev => ({
                    ...prev,
                    [data.senderId]: (prev[data.senderId] || 0) + 1
                }))
                setSuppressedChatSections(prev => {
                    const next = new Set(prev); next.delete('private'); return next;
                })
            }
        })

        return () => {
            socket.off('new_notification')
            socket.off('new_chat')
        }
    }, [socket, user])

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
                suppressChatSection
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
