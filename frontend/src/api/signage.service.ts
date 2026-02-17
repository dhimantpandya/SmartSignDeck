import { apiService } from './api.service'

export interface SignageStats {
    totalTemplates: number
    totalScreens: number
    onlineScreens: number
    offlineScreens: number
}

const getStats = async () => {
    return apiService.get<SignageStats>('/v1/signage/stats')
}

const getActiveContent = async () => {
    return apiService.get<any[]>('/v1/signage/active-content')
}

export const signageService = {
    getStats,
    getActiveContent
}
