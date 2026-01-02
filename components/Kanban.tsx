import React from 'react';

const Kanban: React.FC = () => {
  const columns = [
    { title: 'Nuevo', count: 12, value: '$0', color: 'bg-blue-500' },
    { title: 'Contactado', count: 5, value: '$1,200', color: 'bg-orange-400' },
    { title: 'Calificado', count: 8, value: '$5,400', color: 'bg-yellow-400' },
    { title: 'Cotización', count: 3, value: '$12,500', color: 'bg-primary' },
    { title: 'Negociación', count: 2, value: '$22,000', color: 'bg-indigo-500' },
    { title: 'Ganado', count: 8, value: '$45,000', color: 'bg-green-500' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e2330] px-8 py-3 shrink-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-primary text-[24px]">view_kanban</span>
            <h2 className="text-lg font-bold leading-tight">Flow Board</h2>
          </div>
          {/* Search */}
          <div className="hidden md:flex flex-col min-w-[240px] h-10">
            <div className="flex w-full h-full items-stretch rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent focus-within:border-primary/50 transition-colors">
              <div className="text-slate-400 flex items-center justify-center pl-4">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input className="flex w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 px-3 focus:ring-0" placeholder="Search conversations..." />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">WhatsApp Synced</span>
          </div>
          <button className="flex items-center justify-center rounded-lg size-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 px-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#1e2330]/50 backdrop-blur-sm shrink-0 overflow-x-auto">
        <button className="flex h-8 items-center gap-2 rounded-lg bg-primary/10 border border-transparent px-3 text-primary text-sm font-semibold">
          <span className="material-symbols-outlined text-[18px]">group</span>
          All Agents
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </button>
        <button className="flex h-8 items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
          This Month
        </button>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button className="flex h-8 items-center gap-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 px-3 text-purple-700 dark:text-purple-300 text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          AI Insights
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-6 items-start w-max">
          {columns.map((col, idx) => (
            <div key={idx} className="flex flex-col w-[320px] h-full max-h-full shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-slate-900 dark:text-white font-bold text-base">{col.title}</h3>
                  <span className="flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold rounded-full size-6">{col.count}</span>
                </div>
                <span className="text-xs font-medium text-slate-500">{col.value}</span>
              </div>
              
              <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2 pb-4">
                {/* Sample Card */}
                <div className="group flex flex-col gap-3 rounded-xl bg-white dark:bg-[#1e2330] p-4 shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-800 cursor-grab relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${col.color}`}></div>
                  
                  {col.title === 'Nuevo' && (
                     <div className="absolute top-0 right-0 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Suggestion
                     </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <img className="size-8 rounded-full bg-slate-200 object-cover" src={`https://i.pravatar.cc/150?u=${col.title}${idx}`} alt="User" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">Maria Garcia</span>
                        <span className="text-[10px] text-slate-500">+52 1 55 1234 5678</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">2m ago</span>
                  </div>
                  
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-transparent dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">"Hi, I saw your ad on Facebook about the CRM..."</p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-1 flex-wrap">
                       <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">Inbound</span>
                    </div>
                    <button className="text-primary text-xs font-bold hover:underline">View</button>
                  </div>
                </div>

                {/* Another Sample Card */}
                <div className="group flex flex-col gap-3 rounded-xl bg-white dark:bg-[#1e2330] p-4 shadow-sm border border-slate-100 dark:border-slate-800 cursor-grab relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${col.color}`}></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">TS</div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">TechCorp Inc.</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">The demo was great. Can we schedule a follow-up?</p>
                  <div className="flex items-center justify-between mt-1">
                     <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded text-[10px] font-semibold">Hot Lead</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kanban;