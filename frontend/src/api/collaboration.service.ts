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

    removeCollaborator: async (templateId: string, collaboratorId: string) => {
        // Fetch current template, remove the collaborator, and send the update.
        // Or wait, is there a simpler endpoint? I will just use templateService.updateTemplate! Wait no, this is easier.
        // Actually, let me just add it here and we'll implement it by getting the template first.
        const templateResponse = await apiService.get<any>(`/templates/${templateId}`);
        const template = templateResponse.data;
        const currentCollaborators = template.collaborators || [];

        // Filter out the collaborator
        const updatedCollaborators = currentCollaborators
            .filter((c: any) => {
                const id = c.id || c._id || c;
                return id.toString() !== collaboratorId.toString();
            })
            // Map back to just IDs for the update payload
            .map((c: any) => c.id || c._id || c);

        const response = await apiService.patch<any>(`/templates/${templateId}`, {
            collaborators: updatedCollaborators
        });
        return response;
    },
};
