import { createContext, useContext } from 'react';
import { ActionHistory, Contact, Message, Deal, Task, NavigationItem, Workflow } from './types';
import { api, API_BASE_URL } from './src/lib/api';
import { translations, Language } from './src/lib/translations';

// Mock data (keep for reference or initial state)
export const mockTasks: Task[] = [
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
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    workflows: Workflow[];
    addWorkflow: (workflow: Omit<Workflow, 'id' | 'lastRun'>) => void;
    updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => void;
    deleteWorkflow: (workflowId: string) => void;
    triggerWorkflows: (trigger: string, contactId: string) => Promise<void>;
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
    fetchTasks: (personId?: string, personType?: string) => Promise<void>;
    resolveHandoverAlert: (alertId: string) => void;
    approvePayment: (alertId: string) => void;
    refreshData: () => Promise<void>;
    aiCache: Record<string, { summary: string, analysis: any, lastMessageCount: number, suggestions: any[], lastSuggestionCount: number }>;
    setAiCacheData: (contactId: string, data: { summary?: string, analysis?: any, lastMessageCount?: number, suggestions?: any[], lastSuggestionCount?: number }) => void;
    stages: { id: string, name: string, order: number }[];
    revenueAnalysis: any | null;
    fetchRevenueAnalysis: (force?: boolean) => Promise<void>;
    aiStatus: { isLimited: boolean, count: number, limit: number, remainingRefresh: number } | null;
    deletePerson: (id: string, type: 'CONTACT' | 'LEAD') => Promise<void>;

    deleteCard: (id: string) => Promise<void>;
    updateCard: (id: string, updates: { title?: string, value?: number }) => Promise<void>;
    isAdmin: boolean;
    isTenantAdmin: boolean;
    isTenantUser: boolean;
    canDelete: boolean;
    canModifySettings: boolean;
    fetchUsers: () => Promise<any[]>;
    createUser: (data: any) => Promise<void>;
    updateUser: (id: string, data: any) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    activeSettingsTab: string;
    setActiveSettingsTab: (tab: string) => void;
}

export const StateContext = createContext<StateContextType | undefined>(undefined);

export const useAppState = () => {
    const context = useContext(StateContext);
    if (!context) throw new Error('useAppState must be used within StateProvider');
    return context;
};
