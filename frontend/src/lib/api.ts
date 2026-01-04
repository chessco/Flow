// @ts-ignore
export const API_BASE_URL = 'http://localhost:3001'; // Forced for local dev synchronization
console.log('--- PitayaFlow API Configuration (FORCED) ---');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('-----------------------------------');

class PitayaAPI {
    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        const tenantId = localStorage.getItem('tenant_id');

        const DEFAULT_TENANT_ID = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        const finalTenantId = tenantId || DEFAULT_TENANT_ID;

        if (!tenantId) {
            console.warn('No tenant_id in localStorage, using default:', DEFAULT_TENANT_ID);
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'x-tenant-id': finalTenantId,
        };
    }

    async get(endpoint: string) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('API Error');
        return response.json();
    }

    async post(endpoint: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API Error');
        }
        return response.json();
    }

    // Métodos específicos del dominio
    whatsapp = {
        sendMessage: (to: string, content: string) =>
            this.post('/whatsapp/send', { to, content }),
        getConversations: () =>
            this.get('/whatsapp/conversations'),
        getHistory: (conversationId: string) =>
            this.get(`/whatsapp/history/${conversationId}`),
        getSettings: () =>
            this.get('/whatsapp/settings'),
        updateSettings: (data: any) =>
            this.post('/whatsapp/settings', data),
        setStatus: (conversationId: string, status: string) =>
            this.post(`/whatsapp/conversation/${conversationId}/status`, { status }),
    };

    crm = {
        getNotes: (personId: string, type: string) =>
            this.get(`/crm/notes/${personId}?type=${type}`),
        addNote: (personId: string, type: string, content: string) =>
            this.post(`/crm/notes/${personId}?type=${type}`, { content }),
    };

    auth = {
        login: (credentials: any) => this.post('/auth/login', credentials),
    };

    kanban = {
        getBoard: () => this.get('/kanban'),
        moveCard: (cardId: string, stageId: string) =>
            this.post('/kanban/move', { cardId, stageId }),
    };

    ai = {
        getSuggestions: (conversationId: string) => this.get(`/ai/suggestions/${conversationId}`),
        summarize: (conversationId: string) => this.get(`/ai/summarize/${conversationId}`),
        analyzeContext: (conversationId: string) => this.get(`/ai/context/${conversationId}`),
        refineText: (text: string) => this.post('/ai/refine', { text }),
        getConfig: () => this.get('/ai/config'),
        updateConfig: (config: any) => this.post('/ai/config', config),
        getAlerts: () => this.get('/ai/alerts'),
        resolveAlert: (alertId: string) => this.post(`/ai/alerts/${alertId}/resolve`, {}),
        toggleAiManaged: (conversationId: string, managed: boolean) =>
            this.post(`/ai/conversation/${conversationId}/managed`, { managed }),
    };
}

export const api = new PitayaAPI();
