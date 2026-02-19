import apiService from "./api.service";

export const collaborationService = {
    sendRequest: async (recipientId: string, templateId: string, message?: string) => {
        const response = await apiService.post("/collaboration-requests", {
            recipientId,
            templateId,
            message,
        });
        return response.data;
    },

    getRequests: async (params?: { type?: "incoming" | "outgoing"; status?: string; limit?: number; page?: number }) => {
        const response = await apiService.get("/collaboration-requests", { params });
        return response.data;
    },

    respondToRequest: async (requestId: string, status: "accepted" | "declined") => {
        const response = await apiService.post(`/collaboration-requests/${requestId}/respond`, { status });
        return response.data;
    },

    cancelRequest: async (requestId: string) => {
        const response = await apiService.post(`/collaboration-requests/${requestId}/cancel`);
        return response.data;
    },
};
