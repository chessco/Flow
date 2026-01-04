import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Contact, Deal, Task, Message, NavigationItem } from './types';
import { mockContacts, mockMessages, mockDeals, mockTasks } from './mockData';
import { api } from './src/lib/api';

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
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [contacts, setContacts] = useState<Contact[]>(mockContacts);
    const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
    const [deals, setDeals] = useState<Deal[]>([]); // Start empty, fetch real data
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [activeItem, setActiveItem] = useState<NavigationItem>('dashboard');
    const [activeContactId, setActiveContactId] = useState<string | null>(null);

    const DEFAULT_TENANT_ID = 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718';

    useEffect(() => {
        // Force the correct tenant ID for this environment/DB reset
        localStorage.setItem('tenant_id', DEFAULT_TENANT_ID);

        const fetchInitialData = async () => {
            try {
                // Fetch Conversations
                const conversations = await api.whatsapp.getConversations();
                if (conversations && conversations.length > 0) {
                    const mappedContacts: Contact[] = conversations.map((conv: any) => {
                        const person = conv.contact || conv.lead;
                        return {
                            id: person.id,
                            name: person.name || person.phone,
                            phone: person.phone,
                            role: person.role || (conv.lead ? 'Lead' : 'Contact'),
                            company: person.company || 'Individual',
                            avatar: person.avatar || `https://i.pravatar.cc/150?u=${person.id}`,
                            status: 'offline',
                            tags: []
                        };
                    });

                    setContacts(prev => {
                        return mappedContacts;
                    });

                    setActiveContactId(current => {
                        if (!current || current.startsWith('c')) {
                            return mappedContacts[0].id;
                        }
                        return current;
                    });
                }

                // Fetch Kanban Board
                const pipeline = await api.kanban.getBoard();
                if (pipeline && pipeline.stages) {
                    const mappedDeals: Deal[] = [];
                    pipeline.stages.forEach((stage: any) => {
                        if (stage.cards) {
                            stage.cards.forEach((card: any) => {
                                const person = card.contact || card.lead;
                                mappedDeals.push({
                                    id: card.id,
                                    title: card.title,
                                    value: parseFloat(card.value),
                                    contactName: person?.name || person?.phone || 'Unknown',
                                    stage: stage.name as Deal['stage'],
                                    probability: stage.name === 'Ganado' ? 100 : 50, // Simplified logic
                                    avatar: person?.avatar || `https://i.pravatar.cc/150?u=${person?.id || card.id}`,
                                    date: new Date(card.createdAt).toLocaleDateString()
                                });
                            });
                        }
                    });
                    setDeals(mappedDeals);
                }

            } catch (error) {
                // Silently fail polling if backend is down
            }
        };

        fetchInitialData();
        const interval = setInterval(fetchInitialData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    // Also fetch history when activeContactId changes or periodically
    useEffect(() => {
        if (!activeContactId) return;

        const fetchHistory = async () => {
            try {
                const history = await api.whatsapp.getHistory(activeContactId);
                const mappedMessages: Message[] = history.map((m: any) => ({
                    id: m.id,
                    text: m.content,
                    sender: m.senderType === 'AGENT' ? 'me' : 'them',
                    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: m.type.toLowerCase() as any,
                    createdAt: m.createdAt
                }));

                setMessages(prev => {
                    const existing = prev[activeContactId] || [];

                    // Filter out incoming messages that we already have (by providerId if available)
                    const incomingIds = new Set(mappedMessages.map(m => m.id));

                    const combined = [...mappedMessages];

                    // Add optimistic messages that haven't been "overwritten" by real ones
                    existing.forEach(m => {
                        if (m.id.startsWith('temp-')) {
                            const alreadyInDB = mappedMessages.some(rm => rm.text === m.text && rm.sender === 'me');
                            if (!alreadyInDB) {
                                combined.push(m);
                            }
                        }
                    });

                    // Sort by createdAt
                    combined.sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateA - dateB;
                    });

                    return {
                        ...prev,
                        [activeContactId]: combined
                    };
                });
            } catch (error) {
                // Silently fail
            }
        };

        if (!activeContactId.startsWith('c')) {
            fetchHistory();
            const interval = setInterval(fetchHistory, 3000); // Refresh history every 3s
            return () => clearInterval(interval);
        }
    }, [activeContactId]);

    const sendMessage = async (contactId: string, text: string) => {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) return;

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

            // Replace temporary message with real one from DB if needed, 
            // or just update status. For now, we'll keep it simple.
            console.log('Message sent via WhatsApp API:', result);
        } catch (error) {
            console.error('Failed to send WhatsApp message:', error);
            // Optionally: Mark message as failed in UI
        }
    };

    const updateDealStage = (dealId: string, stage: Deal['stage']) => {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage } : d));
    };

    const addTask = (task: Omit<Task, 'id'>) => {
        const newTask: Task = {
            ...task,
            id: Date.now().toString()
        };
        setTasks(prev => [newTask, ...prev]);
    };

    return (
        <StateContext.Provider value={{
            contacts,
            messages,
            deals,
            tasks,
            activeItem,
            setActiveItem,
            activeContactId,
            setActiveContactId,
            sendMessage,
            updateDealStage,
            addTask
        }}>
            {children}
        </StateContext.Provider>
    );
};

export const useAppState = () => {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error('useAppState must be used within a StateProvider');
    }
    return context;
};
