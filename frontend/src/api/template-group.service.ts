import { apiService } from './api.service'

export interface TemplateGroup {
    id: string
    _id?: string
    name: string
    description?: string
    companyId: string
    createdBy: string
    templates: string[]
    created_at: string
    updated_at: string
}

const getGroups = async (params?: any) => {
    return apiService.get<{ results: TemplateGroup[] }>('/v1/template-groups', { params: { sortBy: 'created_at:desc', ...params } })
}

const getGroup = async (id: string) => {
    return apiService.get<TemplateGroup>(`/v1/template-groups/${id}`)
}

const createGroup = async (data: Partial<TemplateGroup>) => {
    return apiService.post<TemplateGroup>('/v1/template-groups', data)
}

const updateGroup = async (id: string, data: Partial<TemplateGroup>) => {
    return apiService.patch<TemplateGroup>(`/v1/template-groups/${id}`, data)
}

const deleteGroup = async (id: string) => {
    return apiService.delete(`/v1/template-groups/${id}`)
}

const addTemplatesToGroup = async (groupId: string, templateIds: string[]) => {
    return apiService.post<TemplateGroup>(`/v1/template-groups/${groupId}/templates`, { templateIds })
}

export const templateGroupService = {
    getGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addTemplatesToGroup,
}
