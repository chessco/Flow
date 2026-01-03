import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Contact, Deal, Task, Message, NavigationItem } from './types';
import { mockContacts, mockMessages, mockDeals, mockTasks } from './mockData';

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
    const [contacts] = useState<Contact[]>(mockContacts);
    const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
    const [deals, setDeals] = useState<Deal[]>(mockDeals);
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [activeItem, setActiveItem] = useState<NavigationItem>('dashboard');
    const [activeContactId, setActiveContactId] = useState<string | null>('c1');

    const sendMessage = (contactId: string, text: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => ({
            ...prev,
            [contactId]: [...(prev[contactId] || []), newMessage]
        }));
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
