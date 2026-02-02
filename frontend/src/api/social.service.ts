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
    created_at: string
}

export interface FriendRequest {
    id: string
    fromId: string
    toId: string
    status: 'pending' | 'accepted' | 'rejected'
    created_at: string
}

export const socialService = {
    sendMessage: (data: { text: string; recipientId?: string; companyId?: string }) =>
        apiService.post<Message>('/v1/social/message', data),

    getCompanyBoard: () =>
        apiService.get<Message[]>('/v1/social/board'),

    getChatHistory: (recipientId: string) =>
        apiService.get<Message[]>(`/v1/social/chat/${recipientId}`),

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
