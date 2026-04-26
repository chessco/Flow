import React, { useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { Contact, Message, Deal, Task, NavigationItem, Workflow } from './types';
import { api, API_BASE_URL } from './src/lib/api';
import { translations, Language } from './src/lib/translations';
import { StateContext, mockTasks } from './StateContext';

export const StateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [deals, setDeals] = useState<Deal[]>([]);
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [executedWorkflows, setExecutedWorkflows] = useState<Record<string, string[]>>({});
    const messagesRef = useRef<Record<string, Message[]>>({});
    const aiCacheRef = useRef<Record<string, any>>({});
    const executedWorkflowsRef = useRef<Record<string, string[]>>({});

    // Keep refs in sync with state
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        executedWorkflowsRef.current = executedWorkflows;
    }, [executedWorkflows]);

    const [workflows, setWorkflows] = useState<Workflow[]>([
        {
            id: '1',
            name: 'WhatsApp Welcome',
            description: 'Envía un mensaje de bienvenida a nuevos contactos.',
            active: true,
            lastRun: '2 hours ago',
            triggers: 'New Contact',
            actions: 'WhatsApp Message',
            content: '¡Hola! Bienvenido a PitayaCode. ¿En qué podemos ayudarte hoy?',
            executionType: 'once',
            delayMinutes: 1
        },
        {
            id: '2',
            name: 'Proposal Follow-up',
            description: 'Crea una tarea si no hay respuesta en 24h.',
            active: true,
            lastRun: 'Yesterday',
            triggers: 'Message Sent',
            actions: 'Create Task',
            content: 'Recordatorio: Seguir propuesta con el cliente.',
            executionType: 'once',
            delayMinutes: 1440
        }
    ]);
    const [revenueAnalysis, setRevenueAnalysis] = useState<any | null>(null);
    const [isRevenueLoading, setIsRevenueLoading] = useState(false);
    const [activeItem, setActiveItem] = useState<NavigationItem>('dashboard');
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [stages, setStages] = useState<{ id: string, name: string, order: number }[]>([]);
    const workflowLock = useRef<Record<string, string[]>>({}); // Synchronous lock for prevention
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<Record<string, boolean>>({});
    const [isRefinedLoading, setIsRefinedLoading] = useState(false);
    const [handoverAlerts, setHandoverAlerts] = useState<any[]>([]);
    const [aiStatus, setAiStatus] = useState<{ isLimited: boolean, count: number, limit: number, remainingRefresh: number } | null>(null);
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
    const [activeSettingsTab, setActiveSettingsTab] = useState<string>('general');

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Helper to decode JWT without external dependencies
    const decodeToken = (token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error decoding token', e);
            return null;
        }
    };

    // Initial Load - Check for token
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            const userData = decodeToken(token);
            if (userData) {
                setUser({
                    id: userData.sub || userData.userId,
                    email: userData.email,
                    role: userData.role,
                    name: userData.email?.split('@')[0] || 'Admin'
                });
                setIsAuthenticated(true);
            }
        }
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.auth.login({ email, password });
            if (response.access_token) {
                localStorage.setItem('auth_token', response.access_token);
                const userData = decodeToken(response.access_token);
                if (userData) {
                    setUser({
                        id: userData.sub || userData.userId,
                        email: userData.email,
                        role: userData.role,
                        name: userData.email?.split('@')[0] || 'Admin'
                    });
                }
                setIsAuthenticated(true);
                return true;
            }
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    const t = useCallback((path: string) => {
        const keys = path.split('.');
        let current: any = translations[language];
        for (const key of keys) {
            if (!current || current[key] === undefined) return path;
            current = current[key];
        }
        return current;
    }, [language]);

    const DEFAULT_TENANT_ID = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';

    const fetchKanbanData = useCallback(async () => {
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
                            probability: 50,
                            avatar: person?.avatar || '',
                            date: new Date(card.createdAt).toLocaleDateString(),
                            personId: person?.id,
                            personType: card.contactId ? 'CONTACT' : 'LEAD'
                        });
                    });
                });
                setDeals(allDeals);
            }
        } catch (error) {
            console.error('Failed to fetch Kanban data:', error);
        }
    }, []);

    const fetchTasks = useCallback(async (personId?: string, personType?: string) => {
        try {
            const fetched = await api.crm.tasks.getAll(personId, personType);
            // Map backend Task to frontend Task interface
            const mapped = fetched.map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                dueDate: t.dueDate,
                status: t.status,
                priority: t.priority,
                contactId: t.contactId || t.leadId,
                contactName: t.contact?.name || t.lead?.name || 'Unknown',
                contactAvatar: t.contact?.avatar || t.lead?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.contact?.name || t.lead?.name || 'U')}`,
                assigneeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
            }));
            setTasks(mapped);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    }, []);

    const loadInitialData = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            // Check for tenant in localStorage
            const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
            let tenantId = localStorage.getItem('tenant_id');
            if (!tenantId || tenantId === ZERO_UUID || tenantId === 'null') {
                console.warn('Initial load: Invalid tenant_id found, setting default.');
                localStorage.setItem('tenant_id', DEFAULT_TENANT_ID);
                tenantId = DEFAULT_TENANT_ID;
            }

            const fetchedConversations = await api.whatsapp.getConversations();
            fetchTasks(); // Load tasks in parallel

            const mappedContacts: Contact[] = fetchedConversations.map((c: any) => {
                const person = c.contact || c.lead;
                return {
                    id: c.id, // We use conversation ID as the primary key for the Unified Inbox
                    personId: person?.id || '',
                    personType: person ? (c.contactId ? 'CONTACT' : 'LEAD') : 'CONTACT',
                    name: person?.name || person?.phone || 'Unknown',
                    phone: person?.phone || '',
                    email: person?.email || '',
                    role: person?.role || 'Prospect',
                    company: person?.company || 'Personal',
                    avatar: person?.avatar || '',
                    status: c.status === 'OPEN' ? 'online' : 'offline', // Map conversation status to contact status for display
                    tags: person?.tags || [],
                    aiManaged: c.aiManaged,
                    unread: c.status === 'OPEN',
                    lastCustomerMessageAt: c.lastCustomerMessageAt
                };
            });

            setContacts(mappedContacts);
            // Only set active contact if one isn't already selected to prevent override during polling
            setActiveContactId(prev => {
                if (prev) return prev;
                return mappedContacts.length > 0 ? mappedContacts[0].id : null;
            });

            // Load Kanban board
            await fetchKanbanData();
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    }, [isAuthenticated, fetchTasks, fetchKanbanData]);

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

                    const existing = (messagesRef.current[activeContactId] || []);
                    const existingIds = new Set(existing.map(ex => ex.id));
                    const newOnes = mappedMessages.filter(m => !existingIds.has(m.id));

                    if (newOnes.length > 0) {
                        setMessages(prev => {
                            const currentMessages = prev[activeContactId] || [];
                            const currentIds = new Set(currentMessages.map(ex => ex.id));
                            const trulyNewOnes = newOnes.filter(m => !currentIds.has(m.id));

                            if (trulyNewOnes.length === 0) return prev;

                            const combined = [...currentMessages, ...trulyNewOnes].sort((a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            );
                            return { ...prev, [activeContactId]: combined };
                        });

                        // Trigger workflows if new messages arrived from them
                        if (newOnes.some(m => m.sender === 'them')) {
                            const isNewContact = (messagesRef.current[activeContactId] || []).length === 0 &&
                                !mappedMessages.some(m => m.sender === 'me');
                            triggerWorkflows(isNewContact ? 'New Contact' : 'Inbound Message', activeContactId);
                        }
                    }

                    // Fetch suggestions if last message is from them AND message count changed
                    const currentCache = aiCacheRef.current[activeContactId];
                    const isAlreadyFetching = isFetchingSuggestions[activeContactId];

                    if (mappedMessages.length > 0 && mappedMessages[mappedMessages.length - 1].sender === 'them' && !isAlreadyFetching) {
                        if (!currentCache || currentCache.lastSuggestionCount !== mappedMessages.length) {
                            setIsFetchingSuggestions(prev => ({ ...prev, [activeContactId]: true }));
                            try {
                                const suggs = await api.ai.getSuggestions(activeContactId);
                                setSuggestions(suggs);
                                setAiCacheData(activeContactId, {
                                    suggestions: suggs,
                                    lastSuggestionCount: mappedMessages.length
                                });
                            } finally {
                                setIsFetchingSuggestions(prev => ({ ...prev, [activeContactId]: false }));
                            }
                        } else {
                            setSuggestions(currentCache.suggestions || []);
                        }
                    } else if (mappedMessages.length > 0 && mappedMessages[mappedMessages.length - 1].sender === 'me') {
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


    const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
        try {
            await api.crm.tasks.create(task);
            await fetchTasks();
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    }, [fetchTasks]);

    const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        try {
            await api.crm.tasks.update(taskId, updates);
            await fetchTasks();
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }, [fetchTasks]);

    const deleteTask = useCallback(async (taskId: string) => {
        try {
            await api.crm.tasks.delete(taskId);
            await fetchTasks();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }, [fetchTasks]);

    const addWorkflow = (workflow: Omit<Workflow, 'id' | 'lastRun'>) => {
        const newWorkflow: Workflow = {
            ...workflow,
            id: Math.random().toString(36).substr(2, 9),
            lastRun: 'Never'
        };
        setWorkflows(prev => [newWorkflow, ...prev]);
    };

    const updateWorkflow = (workflowId: string, updates: Partial<Workflow>) => {
        setWorkflows(prev => prev.map(w => w.id === workflowId ? { ...w, ...updates } : w));
    };

    const deleteWorkflow = (workflowId: string) => {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    };

    const triggerWorkflows = async (trigger: string, contactId: string) => {
        const contactExecuted = [
            ...(executedWorkflowsRef.current[contactId] || []),
            ...(workflowLock.current[contactId] || [])
        ];

        const activeWorkflows = workflows.filter(w => {
            const isActive = w.active;
            const matchesTrigger = w.triggers.toLowerCase().includes(trigger.toLowerCase());
            const notExecutedOnce = w.executionType === 'always' || !contactExecuted.includes(w.id);
            return isActive && matchesTrigger && notExecutedOnce;
        });

        for (const wf of activeWorkflows) {
            // Immediatly lock the workflow for this contact to prevent race conditions during delay
            if (wf.executionType === 'once') {
                workflowLock.current[contactId] = [...(workflowLock.current[contactId] || []), wf.id];
            }

            // Check AI condition if exists
            if (wf.condition) {
                const contactMsgs = messagesRef.current[contactId] || [];
                const lastMsg = contactMsgs[contactMsgs.length - 1];
                if (lastMsg && !lastMsg.text.toLowerCase().includes(wf.condition.toLowerCase())) {
                    // Unlock if condition not met (so it can try again on next message)
                    if (wf.executionType === 'once') {
                        workflowLock.current[contactId] = workflowLock.current[contactId].filter(id => id !== wf.id);
                    }
                    continue;
                }
            }

            const executeAction = async () => {
                if (wf.actions.toLowerCase().includes('whatsapp message') && wf.content) {
                    await sendMessage(contactId, wf.content);
                }
                if (wf.actions.toLowerCase().includes('create task') && wf.content) {
                    addTask({
                        title: wf.content,
                        contactName: contacts.find(c => c.id === contactId)?.name || 'Unknown',
                        contactAvatar: contacts.find(c => c.id === contactId)?.avatar,
                        assigneeAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
                        dueDate: 'Today',
                        priority: 'Medium',
                        status: 'New'
                    });
                }

                updateWorkflow(wf.id, { lastRun: 'Just now' });

                if (wf.executionType === 'once') {
                    setExecutedWorkflows(prev => ({
                        ...prev,
                        [contactId]: [...(prev[contactId] || []), wf.id]
                    }));
                }
            };

            if (wf.delayMinutes && wf.delayMinutes > 0) {
                setTimeout(executeAction, wf.delayMinutes * 1000); // Demo seconds, use 60000 for real
            } else {
                await executeAction();
            }
        }
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
            console.error('Error resolving handover alert:', error);
        }
    };

    const approvePayment = async (alertId: string) => {
        try {
            await api.kanban.approvePayment(alertId);
            // Refresh counts and data
            await loadInitialData();
            await fetchHandoverAlerts();
        } catch (error) {
            console.error('Error approving payment:', error);
        }
    };

    const fetchRevenueAnalysis = async (force: boolean = false) => {
        if (!force && revenueAnalysis && !revenueAnalysis.error) return;

        setIsRevenueLoading(true);
        try {
            const analysis = await api.ai.getRevenueAnalysis();
            setRevenueAnalysis(analysis);
        } catch (error) {
            console.error('Error fetching revenue analysis:', error);
            setRevenueAnalysis({
                summary: "Error de conexión con el servicio de IA.",
                momentum: "ERROR",
                error: error.message
            });
        } finally {
            setIsRevenueLoading(false);
        }
    };

    const fetchAiStatus = async () => {
        try {
            const status = await api.ai.getStatus();
            setAiStatus(status);
        } catch (error) {
            console.error('Error fetching AI status:', error);
        }
    };

    const setAiCacheData = (contactId: string, data: { summary?: string, analysis?: any, lastMessageCount?: number, suggestions?: any[], lastSuggestionCount?: number }) => {
        const newData = {
            ...(aiCacheRef.current[contactId] || { summary: '', analysis: null, lastMessageCount: 0, suggestions: [], lastSuggestionCount: 0 }),
            ...data
        };

        aiCacheRef.current = {
            ...aiCacheRef.current,
            [contactId]: newData
        };

        setAiCache(prev => ({
            ...prev,
            [contactId]: newData
        }));
    };

    // Poll for alerts every minute
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchHandoverAlerts();
        const id = setInterval(fetchHandoverAlerts, 30000);
        return () => clearInterval(id);
    }, [isAuthenticated]);

    // Poll for AI status every 30 seconds
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchAiStatus();
        const interval = setInterval(fetchAiStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Role Helpers
    const role = user?.role?.toUpperCase() || '';
    const isAdmin = role === 'SYSTEM_ADMIN' || role === 'ADMIN' || user?.email === 'admin@pitayacode.io';
    const isTenantAdmin = role === 'TENANT_ADMIN' || role === 'ADMIN';
    const isTenantUser = role === 'TENANT_USER';

    const canDelete = isAdmin;
    const canModifySettings = isAdmin;

    const deletePerson = async (id: string, type: 'CONTACT' | 'LEAD') => {
        try {
            await api.crm.deletePerson(id, type);
            setContacts(prev => prev.filter(c => c.id !== id));
            setMessages(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
            setDeals(prev => prev.filter(d => d.personId !== id));
            if (activeContactId === id) {
                setActiveContactId(null);
            }
        } catch (error) {
            console.error('Error deleting person:', error);
            alert('Failed to delete person');
        }
    };

    const deleteCard = async (id: string) => {
        try {
            await api.kanban.deleteCard(id);
            setDeals(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting card:', error);
            alert('Failed to delete card');
        }
    };

    const updateCard = async (id: string, updates: { title?: string, value?: number }) => {
        try {
            await api.kanban.updateCard(id, updates);
            setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
        } catch (error) {
            console.error('Error updating card:', error);
            alert('Failed to update card');
        }
    };

    const fetchUsers = async () => {
        try {
            return await api.users.getAll();
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    };

    const createUser = async (data: any) => {
        await api.users.create(data);
    };

    const updateUser = async (id: string, data: any) => {
        await api.users.update(id, data);
    };

    const deleteUser = async (id: string) => {
        await api.users.remove(id);
    };

    const contextValue = useMemo(() => ({
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
        updateTask,
        deleteTask,
        workflows,
        addWorkflow,
        updateWorkflow,
        deleteWorkflow,
        triggerWorkflows,
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
        approvePayment,
        refreshData: loadInitialData,
        aiCache,
        setAiCacheData,
        stages,
        revenueAnalysis,
        fetchRevenueAnalysis,
        aiStatus,
        deletePerson,
        deleteCard,
        updateCard,
        isAdmin,
        isTenantAdmin,
        isTenantUser,
        canDelete,
        canModifySettings,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        activeSettingsTab,
        setActiveSettingsTab
    }), [
        contacts, messages, deals, tasks, activeItem, activeContactId,
        suggestions, isRefinedLoading, language, isAuthenticated, user,
        handoverAlerts, aiCache, stages, revenueAnalysis, aiStatus,
        isAdmin, isTenantAdmin, isTenantUser, canDelete, canModifySettings,
        activeSettingsTab, selectContact, sendMessage, updateDealStage,
        addTask, updateTask, deleteTask, addWorkflow, updateWorkflow,
        deleteWorkflow, triggerWorkflows, refreshSuggestions, refineMessage,
        login, logout, fetchHandoverAlerts, resolveHandoverAlert, approvePayment,
        loadInitialData, fetchRevenueAnalysis, fetchUsers, createUser,
        updateUser, deleteUser, t, setActiveSettingsTab
    ]);

    return (
        <StateContext.Provider value={contextValue}>
            {children}
        </StateContext.Provider>
    );
};
