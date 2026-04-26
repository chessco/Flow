import React from 'react';
import { NavigationItem } from '../types';
import { useAppState } from '../StateContext';

interface MobileBottomNavProps {
    activeItem: NavigationItem;
    onNavigate: (item: NavigationItem) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeItem, onNavigate }) => {
    const { t, contacts } = useAppState();
    const unreadCount = contacts.filter(c => c.unread).length;

    const navItems: { id: NavigationItem; icon: string; label: string; badge?: number }[] = [
        { id: 'dashboard', icon: 'dashboard', label: 'Home' },
        { id: 'inbox', icon: 'inbox', label: 'Chats', badge: unreadCount > 0 ? unreadCount : undefined },
        { id: 'kanban', icon: 'view_kanban', label: 'Leads' },
        { id: 'contacts', icon: 'group', label: 'Contactos' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#1a202c]/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-50 pb-safe">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all relative
            ${activeItem === item.id ? 'text-primary dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}
          `}
                >
                    <div className={`p-1 rounded-xl transition-colors ${activeItem === item.id ? 'bg-primary/10' : ''}`}>
                        <span className={`material-symbols-outlined text-[24px] ${activeItem === item.id ? 'fill' : ''}`}>
                            {item.icon}
                        </span>
                    </div>
                    <span className="text-[10px] font-medium leading-none">{item.label}</span>

                    {item.badge && (
                        <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full border-2 border-white dark:border-[#1a202c]">
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}
        </nav>
    );
};

export default MobileBottomNav;
