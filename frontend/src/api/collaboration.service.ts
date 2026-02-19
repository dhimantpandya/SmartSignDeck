import { apiService } from "./api.service";

export const collaborationService = {
    sendRequest: async (recipientId: string, templateId: string, message?: string) => {
        const response = await apiService.post<any>("/collaboration-requests", {
            recipientId,
            templateId,
            message,
        });
        return response;
    },

    getRequests: async (params?: { type?: "incoming" | "outgoing"; status?: string; limit?: number; page?: number; templateId?: string; sortBy?: string }) => {
        const response = await apiService.get<any>("/collaboration-requests", { params });
        return response;
    },

    respondToRequest: async (requestId: string, status: "accepted" | "declined") => {
        const response = await apiService.post<any>(`/collaboration-requests/${requestId}/respond`, { status });
        return response;
    },

    cancelRequest: async (requestId: string) => {
        const response = await apiService.post<any>(`/collaboration-requests/${requestId}/cancel`, {});
        return response;
    },
};
