import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inbox from './components/Inbox';
import Kanban from './components/Kanban';
import ContactsList from './components/ContactsList';
import ContactProfile from './components/ContactProfile';
import Tasks from './components/Tasks';
import Settings from './components/Settings';
import Insights from './components/Insights';
import Automations from './components/Automations';
import { useAppState } from './StateContext';
import { StateProvider } from './StateProvider';
import { WhatsAppDebug } from './components/WhatsAppDebug';
import { WhatsAppSettings } from './components/WhatsAppSettings';
import { Login } from './components/Login';
import HandoverAlertsPanel from './components/HandoverAlertsPanel';
import MobileBottomNav from './components/MobileBottomNav';
import MobileFAB from './components/MobileFAB';
import { useMediaQuery } from './hooks/useMediaQuery';

const AppContent: React.FC = () => {
  const { activeItem, setActiveItem, activeContactId, isAuthenticated } = useAppState();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard': return <Dashboard />;
      case 'inbox': return <Inbox />;
      case 'kanban': return <Kanban />;
      case 'contacts': return activeContactId ? <ContactProfile /> : <ContactsList />;
      case 'tasks': return <Tasks />;
      case 'settings': return <Settings />;
      case 'insights': return <Insights />;
      case 'automations': return <Automations />;
      default:
        return <Dashboard />;
    }
  };


  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar
        activeItem={activeItem}
        onNavigate={(item) => {
          setActiveItem(item);
          if (isMobile) setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className={`flex-1 flex flex-col h-full w-full overflow-hidden relative ${isMobile ? 'pb-16' : ''}`}>
        {isMobile && (
          <header className="flex h-14 w-full items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] z-10">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
              <span className="text-sm font-bold dark:text-white">Pitaya Flow</span>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </header>
        )}

        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {isMobile && (
        <MobileBottomNav
          activeItem={activeItem}
          onNavigate={(item) => setActiveItem(item)}
        />
      )}

      {isMobile && <MobileFAB />}

      <HandoverAlertsPanel />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StateProvider>
      <AppContent />
    </StateProvider>
  );
};

export default App;
