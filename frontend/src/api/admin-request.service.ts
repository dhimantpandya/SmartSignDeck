import { apiService } from './api.service'

export type AdminRequestType = 'DELETE' | 'ROLE_UPDATE'
export type AdminRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AdminRequest {
    id: string
    requesterId: any
    targetUserId: any
    companyId: string
    type: AdminRequestType
    details: {
        proposedRole?: string
        reason?: string
    }
    status: AdminRequestStatus
    adminComment?: string
    createdAt: string
}

class AdminRequestService {
    private api: typeof apiService
    controller: string = 'v1/admin-requests'

    constructor() {
        this.api = apiService
    }

    async createRequest(data: {
        targetUserId: string
        type: AdminRequestType
        details?: { proposedRole?: string; reason?: string }
    }) {
        return this.api.post<any>(`${this.controller}`, data)
    }

    async getAllRequests() {
        return this.api.get<any>(`${this.controller}`)
    }

    async processRequest(requestId: string, status: 'APPROVED' | 'REJECTED', adminComment?: string) {
        return this.api.post<any>(`${this.controller}/${requestId}/process`, { status, adminComment })
    }
}

export const adminRequestService = new AdminRequestService()
