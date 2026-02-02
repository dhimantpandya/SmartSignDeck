import { apiService } from './api.service'

export interface Company {
    id: string
    name: string
    ownerId: string
    description?: string
    logo?: string
    settings?: {
        primaryColor?: string
        allowPublicTemplates?: boolean
    }
}

export const companyService = {
    createCompany: (data: Partial<Company>) =>
        apiService.post<Company>('/v1/companies', data),

    getCompanies: () =>
        apiService.get<Company[]>('/v1/companies'),

    getCompany: (id: string) =>
        apiService.get<Company>(`/v1/companies/${id}`),

    updateCompany: (id: string, data: Partial<Company>) =>
        apiService.patch<Company>(`/v1/companies/${id}`, data),

    deleteCompany: (id: string) =>
        apiService.delete<void>(`/v1/companies/${id}`),
}
