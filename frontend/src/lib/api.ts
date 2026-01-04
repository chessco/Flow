// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('--- PitayaFlow API Configuration ---');
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
        if (!response.ok) throw new Error('API Error');
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
    };

    kanban = {
        getBoard: () => this.get('/kanban'),
        moveCard: (cardId: string, stageId: string) =>
            this.post('/kanban/move', { cardId, stageId }),
    };

    ai = {
        getSuggestions: (conversationId: string) =>
            this.get(`/ai/suggestions/${conversationId}`),
    };
}

export const api = new PitayaAPI();
