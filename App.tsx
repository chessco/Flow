import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inbox from './components/Inbox';
import Kanban from './components/Kanban';
import ContactProfile from './components/ContactProfile';
import Tasks from './components/Tasks';
import Settings from './components/Settings';
import Insights from './components/Insights';
import { NavigationItem } from './types';

const App: React.FC = () => {
  const [activeItem, setActiveItem] = useState<NavigationItem>('dashboard');

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard': return <Dashboard />;
      case 'inbox': return <Inbox />;
      case 'kanban': return <Kanban />;
      case 'contacts': return <ContactProfile />; // Using Profile as the main contacts view for demo
      case 'tasks': return <Tasks />;
      case 'settings': return <Settings />;
      case 'insights': return <Insights />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeItem={activeItem} onNavigate={setActiveItem} />
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;