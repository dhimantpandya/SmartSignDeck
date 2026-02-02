import { apiService } from './api.service'
import { GenericResponse } from '@/models/generic'

export interface SignageStats {
    totalTemplates: number
    totalScreens: number
    onlineScreens: number
    offlineScreens: number
}

const getStats = async () => {
    return apiService.get<SignageStats>('/v1/signage/stats')
}

export const signageService = {
    getStats,
}
