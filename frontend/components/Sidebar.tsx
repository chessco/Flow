import React from 'react';
import { NavigationItem } from '../types';
import { useAppState } from '../StateContext';

interface SidebarProps {
  activeItem: NavigationItem;
  onNavigate: (item: NavigationItem) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate, isOpen, onToggle }) => {
  const { t, language, logout, contacts, user, isTenantUser, setActiveSettingsTab } = useAppState();
  const unreadCount = contacts.filter(c => c.unread).length;

  const navItems: { id: NavigationItem; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: 'dashboard' },
    { id: 'inbox', label: t('navigation.inbox'), icon: 'inbox', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'kanban', label: t('navigation.kanban'), icon: 'view_kanban' },
    { id: 'contacts', label: t('navigation.contacts'), icon: 'group' },
    { id: 'tasks', label: t('navigation.tasks'), icon: 'check_box' },
    { id: 'insights', label: t('navigation.insights'), icon: 'bar_chart' },
    { id: 'automations', label: t('navigation.automations'), icon: 'schema' },
  ];

  const sidebarBaseClass = `fixed md:relative top-0 left-0 h-full w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] flex flex-col justify-between z-[60] transition-transform duration-300 ease-in-out`;
  const transformClass = isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0';

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] md:hidden transition-opacity"
          onClick={onToggle}
        />
      )}

      <aside className={`${sidebarBaseClass} ${transformClass}`}>
        <div className="flex flex-col gap-4 p-4">
          {/* Logo */}
          <div className="flex gap-3 items-center px-2 mb-2">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-400 aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <span className="material-symbols-outlined text-[24px]">water_drop</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-slate-900 dark:text-white text-base font-bold leading-normal">PitayaCode</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">Flow CRM</p>
            </div>
            {/* Close button for mobile */}
            <button onClick={onToggle} className="md:hidden ml-auto text-slate-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group w-full text-left
                  ${activeItem === item.id
                    ? 'bg-primary/10 text-primary dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <span className={`material-symbols-outlined ${activeItem === item.id ? 'fill' : ''}`}>
                  {item.icon}
                </span>
                <p className="text-sm font-medium leading-normal flex-1">{item.label}</p>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 p-4 border-t border-slate-200 dark:border-slate-800">
          <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 transition-colors shadow-sm shadow-primary/30">
            <span className="material-symbols-outlined text-[20px] mr-2">add</span>
            {language === 'es' ? 'Nuevo Chat' : 'New Chat'}
          </button>

          <div className="flex flex-col gap-1">
            {!isTenantUser && (
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined">settings</span>
                <p className="text-sm font-medium leading-normal">{t('common.settings')}</p>
              </button>
            )}
            <div className="flex items-center justify-between group">
              <button
                onClick={() => {
                  onNavigate('settings');
                  setActiveSettingsTab('profile');
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left flex-1"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                  <img
                    alt="Profile"
                    className="w-full h-full object-cover"
                    src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-none truncate max-w-[120px]">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize whitespace-nowrap">
                    {user?.role?.replace('_', ' ').toLowerCase() || 'Tenant Admin'}
                  </p>
                </div>
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;