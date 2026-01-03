const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class PitayaAPI {
    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        const tenantId = localStorage.getItem('tenant_id');

        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'x-tenant-id': tenantId || '',
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
