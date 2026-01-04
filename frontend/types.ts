export type NavigationItem = 'dashboard' | 'contacts' | 'deals' | 'tasks' | 'insights' | 'inbox' | 'whatsapp-debug' | 'whatsapp-settings' | 'settings' | 'kanban';

export interface Deal {
  id: string;
  title: string;
  value: number;
  contactName: string;
  stage: 'Nuevo Lead' | 'En Seguimiento' | 'Calificado' | 'Esperando Transferencia' | 'Venta Cerrada / Completado';
  probability: number;
  avatar: string;
  date: string;
}


export interface ActionHistory {
  id: string;
  action: string;
  timestamp: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  contactName: string;
  contactAvatar: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'On Track' | 'Breach' | 'Completed';
  assigneeAvatar: string;
  assignedTo?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export interface Contact {
  id: string; // This is the conversation ID in most parts of the UI
  personId: string; // The lead.id or contact.id
  personType: 'CONTACT' | 'LEAD';
  name: string;
  phone: string;
  role: string;
  company: string;
  avatar: string;
  status: 'online' | 'offline';
  tags?: string[];
  aiManaged?: boolean;
  unread?: boolean;
}

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  type?: 'text' | 'file' | 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  fileSize?: string;
  isAI?: boolean;
  createdAt: string;
  mediaUrl?: string;
}