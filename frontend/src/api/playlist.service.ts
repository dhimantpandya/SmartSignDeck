import { apiService } from './api.service'

export interface PlaylistItem {
    url: string
    type: 'image' | 'video'
    duration: number
    name?: string
    _id?: string
}

export interface Playlist {
    id: string
    name: string
    companyId: string
    items: PlaylistItem[]
    createdBy: string
    created_at: string
    updated_at: string
}

export const playlistService = {
    createPlaylist: async (data: Partial<Playlist>) => {
        return apiService.post<Playlist>('/v1/playlists', data)
    },

    getPlaylists: async (params?: any) => {
        return apiService.get<{ results: Playlist[]; totalResults: number }>('/v1/playlists', {
            params,
        })
    },

    getPlaylist: async (id: string) => {
        return apiService.get<Playlist>(`/v1/playlists/${id}`)
    },

    updatePlaylist: async (id: string, data: Partial<Playlist>) => {
        return apiService.patch<Playlist>(`/v1/playlists/${id}`, data)
    },

    deletePlaylist: async (id: string) => {
        return apiService.delete(`/v1/playlists/${id}`)
    },
}
