import { Contact, Deal, Task, Message } from './types';

export const mockContacts: Contact[] = [
    {
        id: 'c1',
        name: 'Sarah Jenkins',
        role: 'VP of Operations',
        company: 'TechFlow',
        avatar: 'https://i.pravatar.cc/150?u=sarahjenkins',
        status: 'online',
        tags: ['VIP', 'Hot Lead']
    },
    {
        id: 'c2',
        name: 'John Doe',
        role: 'IT Manager',
        company: 'Enterprise Corp',
        avatar: 'https://i.pravatar.cc/150?u=john',
        status: 'online',
        tags: ['Enterprise', 'Hot Lead']
    },
    {
        id: 'c3',
        name: 'Maria Garcia',
        role: 'Director of Marketing',
        company: 'Creative Solutions',
        avatar: 'https://i.pravatar.cc/150?u=maria',
        status: 'offline',
        tags: ['Inbound']
    },
    {
        id: 'c4',
        name: 'David Chen',
        role: 'Software Architect',
        company: 'ScaleUp',
        avatar: 'https://i.pravatar.cc/150?u=david',
        status: 'online',
        tags: ['High Intent']
    }
];

export const mockMessages: Record<string, Message[]> = {
    'c1': [
        { id: 'm1', text: 'Hi Sarah, thanks for the call earlier.', sender: 'me', timestamp: '10:30 AM' },
        { id: 'm2', text: 'Thanks for the update. Can we schedule a demo for my CTO next week?', sender: 'them', timestamp: 'Yesterday at 4:30 PM' }
    ],
    'c2': [
        { id: 'm3', text: 'Hi team, thanks for the demo earlier. I\'d like to get a formal quote for 50 seats on the Enterprise plan.', sender: 'them', timestamp: '10:30 AM' },
        { id: 'm4', text: 'Absolutely, John. Great to have you on board. Here is the pricing breakdown for 50 seats as discussed.', sender: 'me', timestamp: '10:42 AM' },
        { id: 'm5', text: 'Enterprise_Quote_Q3.pdf', type: 'file', fileName: 'Enterprise_Quote_Q3.pdf', fileSize: '2.4 MB', sender: 'me', timestamp: '10:42 AM' }
    ],
    'c3': [
        { id: 'm6', text: 'Hi, I saw your ad on Facebook about the CRM...', sender: 'them', timestamp: '2m ago' }
    ],
    'c4': [
        { id: 'm7', text: 'Does the enterprise plan include API access for...', sender: 'them', timestamp: '2m ago' }
    ]
};

export const mockDeals: Deal[] = [
    {
        id: 'd1',
        title: 'Enterprise License - TechFlow',
        value: 12500,
        contactName: 'Sarah Jenkins',
        stage: 'Negociación',
        probability: 80,
        avatar: 'https://i.pravatar.cc/150?u=sarahjenkins',
        date: 'Oct 12, 2023'
    },
    {
        id: 'd2',
        title: '50 Seats Plan - Enterprise Corp',
        value: 22000,
        contactName: 'John Doe',
        stage: 'Cotización',
        probability: 50,
        avatar: 'https://i.pravatar.cc/150?u=john',
        date: 'Oct 15, 2023'
    },
    {
        id: 'd3',
        title: 'Standard Subscription - Maria Garcia',
        value: 1200,
        contactName: 'Maria Garcia',
        stage: 'Nuevo',
        probability: 10,
        avatar: 'https://i.pravatar.cc/150?u=maria',
        date: 'Oct 18, 2023'
    }
];


export const mockTasks: Task[] = [
    {
        id: 't1',
        title: 'Respond to Pricing Inquiry',
        contactName: 'Maria Gonzalez',
        contactAvatar: 'https://i.pravatar.cc/150?u=maria',
        dueDate: 'Today, 5:00 PM',
        priority: 'High',
        status: 'New',
        assigneeAvatar: 'https://i.pravatar.cc/150?u=alex'
    },
    {
        id: 't2',
        title: 'Follow up on Enterprise Proposal',
        contactName: 'John Doe',
        contactAvatar: 'https://i.pravatar.cc/150?u=john',
        dueDate: 'Today, 2:00 PM',
        priority: 'High',
        status: 'Breach',
        assigneeAvatar: 'https://i.pravatar.cc/150?u=alex'
    }
];
