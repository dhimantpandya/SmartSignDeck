import { apiService } from './api.service'

export interface Zone {
    id: string
    type: 'image' | 'video' | 'text' | 'mixed'
    x: number
    y: number
    width: number
    height: number
}

export interface Template {
    id: string
    name: string
    resolution: string
    zones: Zone[]
    isPublic: boolean
    companyId: string
    createdBy: string
    isActive: boolean
    created_at: string
    updated_at: string
    deletedAt?: string | null
}

const getTemplates = async (params?: any) => {
    return apiService.get<{ results: Template[] }>('/v1/templates', { params: { sortBy: 'created_at:desc', ...params } })
}

const getTemplate = async (id: string) => {
    return apiService.get<Template>(`/v1/templates/${id}`)
}

const createTemplate = async (data: Partial<Template>) => {
    return apiService.post<Template>('/v1/templates', data)
}

const updateTemplate = async (id: string, data: Partial<Template>) => {
    return apiService.patch<Template>(`/v1/templates/${id}`, data)
}

const deleteTemplate = async (id: string) => {
    return apiService.delete(`/v1/templates/${id}`)
}

const restoreTemplate = async (id: string) => {
    return apiService.post(`/v1/templates/${id}/restore`)
}

const permanentDeleteTemplate = async (id: string) => {
    return apiService.delete(`/v1/templates/${id}/permanent`)
}

export const templateService = {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    restoreTemplate,
    permanentDeleteTemplate,
}
