const envApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = envApiUrl || 'http://localhost:3003';

console.log('--- PitayaFlow API Configuration ---');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Mode:', import.meta.env.MODE);
console.log('-----------------------------------');


class PitayaAPI {
    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        const DEFAULT_TENANT_ID = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';
        const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
        
        let tenantId = localStorage.getItem('tenant_id');
        
        // Robust check for zero UUID or invalid placeholders
        if (!tenantId || tenantId === ZERO_UUID || tenantId === 'null' || tenantId === 'undefined') {
            if (tenantId) {
                console.warn('Detected invalid tenant_id in localStorage, fixing it:', tenantId);
                localStorage.setItem('tenant_id', DEFAULT_TENANT_ID);
            }
            tenantId = DEFAULT_TENANT_ID;
        }

        const finalTenantId = tenantId;

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
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    async post(endpoint: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'API Error' }));
            const error = new Error(errorData.message || 'API Error');
            (error as any).status = response.status;
            throw error;
        }
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    async put(endpoint: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'API Error' }));
            throw new Error(errorData.message || 'API Error');
        }
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    async patch(endpoint: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'API Error' }));
            throw new Error(errorData.message || 'API Error');
        }
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    async delete(endpoint: string) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            body: JSON.stringify({}) // Some APIS need body even for delete
        });
        if (!response.ok) throw new Error('API Error');
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    // Métodos específicos del dominio
    whatsapp = {
        sendMessage: (to: string, content: string) =>
            this.post('/whatsapp/send', { to, content }),
        getConversations: () =>
            this.get('/whatsapp/conversations'),
        getHistory: (conversationId: string) =>
            this.get(`/whatsapp/history/${conversationId}`),
        getSettings: (tenantId?: string) =>
            this.get(`/whatsapp/settings${tenantId ? `?tenantId=${tenantId}` : ''}`),
        updateSettings: (data: any, tenantId?: string) =>
            this.post(`/whatsapp/settings${tenantId ? `?tenantId=${tenantId}` : ''}`, data),
        setStatus: (conversationId: string, status: string) =>
            this.post(`/whatsapp/conversation/${conversationId}/status`, { status }),
    };

    crm = {
        getNotes: (personId: string, type: string) =>
            this.get(`/crm/notes/${personId}?type=${type}`),
        addNote: (personId: string, type: string, content: string) =>
            this.post(`/crm/notes/${personId}?type=${type}`, { content }),
        updatePerson: (personId: string, type: string, data: any) =>
            this.post(`/crm/person/${personId}?type=${type}`, data),
        deletePerson: (personId: string, type: 'CONTACT' | 'LEAD') =>
            this.delete(`/crm/person/${personId}?type=${type}`),
        tasks: {
            getAll: (personId?: string, personType?: string) =>
                this.get(`/crm/tasks${personId ? `?personId=${personId}&personType=${personType}` : ''}`),
            create: (data: any) => this.post('/crm/tasks', data),
            update: (id: string, data: any) => this.patch(`/crm/tasks/${id}`, data),
            delete: (id: string) => this.delete(`/crm/tasks/${id}`)
        }
    };

    auth = {
        login: (credentials: any) => this.post('/auth/login', credentials),
    };

    kanban = {
        getBoard: () => this.get('/kanban'),
        moveCard: (cardId: string, stageId: string) =>
            this.post('/kanban/move', { cardId, stageId }),
        createDeal: (data: any) =>
            this.post('/kanban/card', data),
        updateCard: (cardId: string, data: any) =>
            this.patch(`/kanban/card/${cardId}`, data),

        approvePayment: (alertId: string) =>
            this.post('/kanban/approve-payment', { alertId }),
        deleteCard: (cardId: string) =>
            this.delete(`/kanban/card/${cardId}`),
    };

    ai = {
        getStatus: () => this.get('/ai/status'),
        getSuggestions: (conversationId: string) => this.get(`/ai/suggestions/${conversationId}`),
        summarize: (conversationId: string) => this.get(`/ai/summarize/${conversationId}`),
        analyzeContext: (conversationId: string) => this.get(`/ai/context/${conversationId}`),
        refineText: (text: string) => this.post('/ai/refine', { text }),
        getConfig: () => this.get('/ai/config'),
        updateConfig: (config: any) => this.post('/ai/config', config),
        debug: (data: { systemPrompt: string; userPrompt: string; model?: string }) => this.post('/ai/debug', data),
        getAlerts: () => this.get('/ai/alerts'),
        getRevenueAnalysis: () => this.get('/ai/revenue-analysis'),
        resolveAlert: (alertId: string) => this.post(`/ai/alerts/${alertId}/resolve`, {}),
        toggleAiManaged: (conversationId: string, managed: boolean) =>
            this.post(`/ai/conversation/${conversationId}/managed`, { managed }),
        generateTags: (conversationId: string) =>
            this.post(`/ai/generate-tags/${conversationId}`, {}),
    };

    users = {
        getAll: () => this.get('/users'),
        getOne: (id: string) => this.get(`/users/${id}`),
        create: (data: any) => this.post('/users', data),
        update: (id: string, data: any) => this.put(`/users/${id}`, data),
        remove: (id: string) => this.delete(`/users/${id}`),
    };
}

export const api = new PitayaAPI();
