export type NavigationItem = 'dashboard' | 'inbox' | 'kanban' | 'contacts' | 'tasks' | 'insights' | 'settings';

export interface Deal {
  id: string;
  title: string;
  value: number;
  contactName: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  probability: number;
  avatar: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  contactName: string;
  contactAvatar: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'On Track' | 'Breach' | 'Completed';
  assigneeAvatar: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  status: 'online' | 'offline';
  tags: string[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  type?: 'text' | 'file';
  fileName?: string;
  fileSize?: string;
  isAI?: boolean;
}