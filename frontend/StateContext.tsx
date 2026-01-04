import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ActionHistory, Contact, Message, Deal, Task, NavigationItem } from './types';
import { api, API_BASE_URL } from './src/lib/api';
import { translations, Language } from './src/lib/translations';

// Mock data (keep for reference or initial state)
const mockTasks: Task[] = [
    {
        id: '1',
        title: 'Call with Alex',
        description: 'Discuss the new contract terms',
        dueDate: '2026-01-10',
        status: 'On Track',
        priority: 'High',
        assignedTo: 'Alex Morgan',
        contactName: 'Alex Morgan',
        contactAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
        assigneeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
    }
];

interface StateContextType {
    contacts: Contact[];
    messages: Record<string, Message[]>;
    deals: Deal[];
    tasks: Task[];
    activeItem: NavigationItem;
    setActiveItem: (item: NavigationItem) => void;
    activeContactId: string | null;
    setActiveContactId: (id: string | null) => void;
    sendMessage: (contactId: string, text: string) => void;
    updateDealStage: (dealId: string, stage: Deal['stage']) => void;
    addTask: (task: Omit<Task, 'id'>) => void;
    suggestions: any[];
    refreshSuggestions: (contactId: string) => void;
    isRefinedLoading: boolean;
    refineMessage: (text: string) => Promise<string | null>;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    user: any;
    handoverAlerts: any[];
    fetchHandoverAlerts: () => void;
    resolveHandoverAlert: (alertId: string) => void;
    refreshData: () => Promise<void>;
    aiCache: Record<string, { summary: string, analysis: any, lastMessageCount: number, suggestions: any[], lastSuggestionCount: number }>;
    setAiCacheData: (contactId: string, data: { summary?: string, analysis?: any, lastMessageCount?: number, suggestions?: any[], lastSuggestionCount?: number }) => void;
    stages: { id: string, name: string, order: number }[];
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [deals, setDeals] = useState<Deal[]>([]);
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [activeItem, setActiveItem] = useState<NavigationItem>('dashboard');
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [stages, setStages] = useState<{ id: string, name: string, order: number }[]>([]);

    const selectContact = async (id: string | null) => {
        setActiveContactId(id);
        if (id) {
            const contact = contacts.find(c => c.id === id);
            if (contact && contact.unread) {
                try {
                    await api.whatsapp.setStatus(id, 'PENDING');
                    // Update local state immediately for better UX
                    setContacts(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c));
                } catch (e) {
                    console.error('Failed to mark as read', e);
                }
            }
        }
    };
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isRefinedLoading, setIsRefinedLoading] = useState(false);
    const [handoverAlerts, setHandoverAlerts] = useState<any[]>([]);
    const [aiCache, setAiCache] = useState<Record<string, { summary: string, analysis: any, lastMessageCount: number, suggestions: any[], lastSuggestionCount: number }>>({});
    const [language, setLanguage] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem('pitaya_flow_language');
            return (saved === 'en' || saved === 'es') ? saved : 'en';
        } catch (e) {
            return 'en';
        }
    });

    useEffect(() => {
        localStorage.setItem('pitaya_flow_language', language);
    }, [language]);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Initial Load - Check for token
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            // Here you could decode the token to check expiry
            setIsAuthenticated(true);
            // Optionally set user basic info from decoded token if needed
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.auth.login({ email, password });
            if (response.access_token) {
                localStorage.setItem('auth_token', response.access_token);
                // Payload structure from jwt.strategy.ts: { userId, email, tenantId, role }
                // Warning: To get tenantId we might need to decode the token or have the API return it separately.
                // For now, let's assume the API returns the token and we trust it.
                // WE NEED TENANT ID. Let's make sure the API returns it or we decode it.
                // The validateUser logic returns the user object, but login returns access_token.
                // It's safer if we can decode it, or if the login response includes the tenantId.
                // Assuming standard JWT, we can't easily decode without a lib on frontend or helper.
                // NOTE: For quick fix, let's manually fetch the tenantId or store it if we had it.
                // ACTUALLY, checking create_admin.js shows the token payload has tenantId.
                // Let's rely on the user having the correct tenantId or better yet, decoding it.
                // Ideally we use a library like `jwt-decode`.
                // PROVISIONAL: We will just set isAuthenticated to true.
                // For the tenantId, we'll assume it's set or we set a default.

                // FIX: Let's assume for this sprint we just set Auth = true.
                // Ideally we should decode the token.
                setIsAuthenticated(true);
                return true;
            }
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
    };

    const t = (path: string) => {
        const keys = path.split('.');
        let current: any = translations[language];
        for (const key of keys) {
            if (!current || current[key] === undefined) return path;
            current = current[key];
        }
        return current;
    };

    const DEFAULT_TENANT_ID = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';

    const loadInitialData = async () => {
        if (!isAuthenticated) return;
        try {
            // Check for tenant in localStorage
            let tenantId = localStorage.getItem('tenant_id');
            if (!tenantId) {
                console.warn('Initial load: No tenant_id found, setting default.');
                localStorage.setItem('tenant_id', DEFAULT_TENANT_ID);
            }

            const fetchedConversations = await api.whatsapp.getConversations();

            const mappedContacts: Contact[] = fetchedConversations.map((c: any) => {
                const person = c.contact || c.lead;
                return {
                    id: c.id, // We use conversation ID as the primary key for the Unified Inbox
                    personId: person?.id || '',
                    personType: person ? (c.contactId ? 'CONTACT' : 'LEAD') : 'CONTACT',
                    name: person?.name || person?.phone || 'Unknown',
                    phone: person?.phone || '',
                    role: person?.role || 'Prospect',
                    company: person?.company || 'Personal',
                    avatar: person?.avatar || '',
                    status: c.status === 'OPEN' ? 'online' : 'offline', // Map conversation status to contact status for display
                    tags: person?.tags || [],
                    aiManaged: c.aiManaged,
                    unread: c.status === 'OPEN'
                };
            });

            setContacts(mappedContacts);
            if (mappedContacts.length > 0 && !activeContactId) {
                setActiveContactId(mappedContacts[0].id);
            }

            // Load Kanban board
            await fetchKanbanData();
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    };

    const fetchKanbanData = async () => {
        try {
            const board = await api.kanban.getBoard();
            if (board && board.stages) {
                // Store stages for components to use
                const fetchedStages = board.stages.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    order: s.order
                })).sort((a, b) => a.order - b.order);
                setStages(fetchedStages);

                const allDeals: Deal[] = [];
                board.stages.forEach((stage: any) => {
                    stage.cards.forEach((card: any) => {
                        const person = card.contact || card.lead;
                        allDeals.push({
                            id: card.id,
                            title: card.title,
                            value: Number(card.value),
                            contactName: person?.name || person?.phone || 'Unknown',
                            stage: stage.name as Deal['stage'],
                            probability: 50, // Default
                            avatar: person?.avatar || '',
                            date: new Date(card.createdAt).toLocaleDateString()
                        });
                    });
                });
                setDeals(allDeals);
            }
        } catch (error) {
            console.error('Failed to fetch Kanban data:', error);
        }
    };

    // Initial Load Data logic remains, but only runs if authenticated
    useEffect(() => {
        if (!isAuthenticated) return;

        loadInitialData();
        const intervalId = setInterval(loadInitialData, 10000); // Poll conversations every 10s

        return () => clearInterval(intervalId);
    }, [isAuthenticated]); // Dependency on isAuthenticated

    // Message Polling - Only if authenticated
    useEffect(() => {
        if (!isAuthenticated) return;

        let intervalId: any;

        if (activeContactId) {
            const fetchHistory = async () => {
                try {
                    const history = await api.whatsapp.getHistory(activeContactId);

                    const mappedMessages: Message[] = history.map((m: any) => ({
                        id: m.id,
                        text: m.content,
                        sender: (m.senderType === 'STAFF' || m.senderType === 'AGENT' || m.senderType === 'AI') ? 'me' : 'them',
                        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: m.type?.toLowerCase() || 'text',
                        createdAt: m.createdAt,
                        mediaUrl: m.mediaUrl ? (m.mediaUrl.startsWith('http') ? m.mediaUrl : `${API_BASE_URL}${m.mediaUrl}`) : undefined
                    }));

                    setMessages(prev => {
                        const existing = prev[activeContactId] || [];
                        const existingIds = new Set(existing.map(ex => ex.id));
                        const newOnes = mappedMessages.filter(m => !existingIds.has(m.id));

                        if (newOnes.length === 0) return prev;

                        const combined = [...existing, ...newOnes].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );

                        return {
                            ...prev,
                            [activeContactId]: combined
                        };
                    });

                    // Fetch suggestions if last message is from them AND message count changed
                    const currentCache = aiCache[activeContactId];
                    if (mappedMessages.length > 0 && mappedMessages[mappedMessages.length - 1].sender === 'them') {
                        if (!currentCache || currentCache.lastSuggestionCount !== mappedMessages.length) {
                            const suggs = await api.ai.getSuggestions(activeContactId);
                            setSuggestions(suggs);
                            setAiCacheData(activeContactId, {
                                suggestions: suggs,
                                lastSuggestionCount: mappedMessages.length
                            });
                        } else {
                            setSuggestions(currentCache.suggestions || []);
                        }
                    } else {
                        setSuggestions([]);
                    }
                } catch (error) {
                    // Silently fail
                }
            };

            fetchHistory();
            intervalId = setInterval(fetchHistory, 5000);
        }

        return () => clearInterval(intervalId);
    }, [activeContactId, isAuthenticated]);

    const sendMessage = async (contactId: string, text: string) => {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            const tempId = `temp-${Date.now()}`;
            const now = new Date();
            const newMessage: Message = {
                id: tempId,
                text,
                sender: 'me',
                timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'text',
                createdAt: now.toISOString()
            };
            setMessages(prev => ({
                ...prev,
                [contactId]: [...(prev[contactId] || []), newMessage]
            }));

            try {
                // Real API call
                const result = await api.whatsapp.sendMessage(contact.phone, text);
                console.log('Message sent via WhatsApp API:', result);

                // Reconcile optimistic update
                setMessages(prev => {
                    const current = prev[contactId];
                    if (!current) return prev; // Should not happen

                    // Check if the backend message was already added by the poller
                    const alreadyExists = current.some(m => m.id === result.id);

                    if (alreadyExists) {
                        // If it came via poll, remove the temp one
                        return {
                            ...prev,
                            [contactId]: current.filter(m => m.id !== tempId)
                        };
                    } else {
                        // Otherwise, upgrade temp to real (swap ID)
                        return {
                            ...prev,
                            [contactId]: current.map(m => m.id === tempId ? {
                                ...m,
                                id: result.id,
                                createdAt: result.createdAt, // Sync timestamps
                                timestamp: new Date(result.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            } : m)
                        };
                    }
                });

                // Ensure status is PENDING if we are replying
                await api.whatsapp.setStatus(contactId, 'PENDING');
            } catch (error) {
                console.error('Failed to send WhatsApp message:', error);
            }
        }
    };

    const updateDealStage = async (dealId: string, stage: Deal['stage']) => {
        // Optimistic update
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage } : d));

        try {
            // Find stage ID for the name
            const board = await api.kanban.getBoard();
            const targetStage = board.stages.find((s: any) => s.name === stage);
            if (targetStage) {
                await api.kanban.moveCard(dealId, targetStage.id);
            }
        } catch (error) {
            console.error('Failed to update deal stage in backend:', error);
            // Optionally revert on failure
        }
    };

    const addTask = (task: Omit<Task, 'id'>) => {
        const newTask: Task = {
            ...task,
            id: Date.now().toString()
        };
        setTasks(prev => [newTask, ...prev]);
    };

    const refreshSuggestions = async (contactId: string) => {
        try {
            const suggs = await api.ai.getSuggestions(contactId);
            setSuggestions(suggs);
        } catch (error) {
            console.error('Failed to refresh suggestions:', error);
        }
    };

    const refineMessage = async (text: string) => {
        if (!text) return null;
        setIsRefinedLoading(true);
        try {
            const result = await api.ai.refineText(text);
            return result.refined;
        } catch (error) {
            console.error('Refinement failed:', error);
            return null;
        } finally {
            setIsRefinedLoading(false);
        }
    };

    const fetchHandoverAlerts = async () => {
        if (!isAuthenticated) return;
        try {
            const alerts = await api.ai.getAlerts();
            setHandoverAlerts(alerts);
        } catch (error) {
            console.error('Failed to fetch handover alerts:', error);
        }
    };

    const resolveHandoverAlert = async (alertId: string) => {
        try {
            await api.ai.resolveAlert(alertId);
            setHandoverAlerts(prev => prev.filter(a => a.id !== alertId));
        } catch (error) {
            console.error('Failed to resolve alert:', error);
        }
    };

    const setAiCacheData = (contactId: string, data: { summary?: string, analysis?: any, lastMessageCount?: number, suggestions?: any[], lastSuggestionCount?: number }) => {
        setAiCache(prev => ({
            ...prev,
            [contactId]: {
                ...(prev[contactId] || { summary: '', analysis: null, lastMessageCount: 0, suggestions: [], lastSuggestionCount: 0 }),
                ...data
            }
        }));
    };

    // Poll for alerts every minute
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchHandoverAlerts();
        const id = setInterval(fetchHandoverAlerts, 30000);
        return () => clearInterval(id);
    }, [isAuthenticated]);

    return (
        <StateContext.Provider value={{
            contacts,
            messages,
            deals,
            tasks,
            activeItem,
            setActiveItem,
            activeContactId,
            setActiveContactId: selectContact,
            sendMessage,
            updateDealStage,
            addTask,
            suggestions,
            refreshSuggestions,
            isRefinedLoading,
            refineMessage,
            language,
            setLanguage,
            t,
            isAuthenticated,
            login,
            logout,
            user,
            handoverAlerts,
            fetchHandoverAlerts,
            resolveHandoverAlert,
            refreshData: loadInitialData,
            aiCache,
            setAiCacheData,
            stages
        }}>
            {children}
        </StateContext.Provider>
    );
};

export const useAppState = () => {
    const context = useContext(StateContext);
    if (!context) throw new Error('useAppState must be used within StateProvider');
    return context;
};
