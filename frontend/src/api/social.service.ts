import { apiService } from './api.service'

export interface Message {
    id: string
    senderId: {
        _id: string
        first_name: string
        last_name: string
        avatar?: string
    }
    text: string
    replyTo?: { _id: string; text: string; senderId: string; created_at: string } | null
    created_at: string
    seenBy?: { userId: string; seenAt: string }[]
    deletedFor?: { userId: string; scope: 'me' | 'everyone' }[]
}

export interface FriendRequest {
    id: string
    fromId: string
    toId: string
    status: 'pending' | 'accepted' | 'rejected'
    created_at: string
}

export const socialService = {
    sendMessage: (data: { text: string; recipientId?: string; companyId?: string; replyTo?: string }) =>
        apiService.post<Message>('/v1/social/message', data),

    getCompanyBoard: () =>
        apiService.get<Message[]>('/v1/social/board'),

    getChatHistory: (recipientId: string) =>
        apiService.get<Message[]>(`/v1/social/chat/${recipientId}`),

    markAsSeen: (messageId: string) =>
        apiService.post<any>(`/v1/social/message/${messageId}/seen`, {}),

    deleteMessage: (messageId: string, scope: 'me' | 'everyone') =>
        apiService.delete<any>(`/v1/social/message/${messageId}`, { data: { scope } }),

    getFriends: () =>
        apiService.get<any[]>('/v1/social/friends'),

    sendFriendRequest: (toId: string) =>
        apiService.post<FriendRequest>('/v1/social/friends/request', { toId }),

    getSentRequests: () =>
        apiService.get<FriendRequest[]>('/v1/social/friends/requests/sent'),

    getReceivedRequests: () =>
        apiService.get<FriendRequest[]>('/v1/social/friends/requests/received'),

    respondToFriendRequest: (requestId: string, status: 'accepted' | 'rejected') =>
        apiService.post<any>(`/v1/social/friends/request/${requestId}`, { status }),
}
