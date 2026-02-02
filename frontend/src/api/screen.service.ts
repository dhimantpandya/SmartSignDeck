import { apiService } from './api.service'

export interface Screen {
    id: string
    name: string
    companyId: string
    createdBy: string
    isPublic: boolean
    status: 'online' | 'offline' | 'syncing'
    lastPing: string
    created_at: string
    updated_at: string
    deletedAt?: string | null
}

const getScreens = async (params?: any) => {
    return apiService.get<{ results: Screen[] }>('/v1/screens', { params: { limit: 5, sortBy: 'created_at:desc', ...params } })
}

const deleteScreen = async (id: string) => {
    return apiService.delete(`/v1/screens/${id}`)
}

const restoreScreen = async (id: string) => {
    return apiService.post(`/v1/screens/${id}/restore`)
}

const permanentDeleteScreen = async (id: string) => {
    return apiService.delete(`/v1/screens/${id}/permanent`)
}

export const screenService = {
    getScreens,
    deleteScreen,
    restoreScreen,
    permanentDeleteScreen,
}
