import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center w-full max-w-md relative">
          <span className="absolute left-3 text-slate-400 material-symbols-outlined text-[20px]">search</span>
          <input className="w-full bg-slate-100 dark:bg-gray-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50" placeholder="Search settings..." type="text" />
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Pipeline</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-10">
          <div className="flex flex-col gap-4">
            <nav className="flex items-center text-sm font-medium text-slate-500">
              <a className="hover:text-primary" href="#">Settings</a>
              <span className="material-symbols-outlined text-base mx-2">chevron_right</span>
              <span className="text-slate-900 dark:text-white">Pipeline Management</span>
            </nav>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Pipeline Management</h2>
                <p className="text-slate-500 mt-2 text-base">Configure your sales stages, probabilities, and operational workflows.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1 border border-green-200">
                <span className="size-2 rounded-full bg-green-500"></span> WhatsApp API Active
              </span>
            </div>
          </div>

          <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
            <button className="pb-3 px-1 border-b-2 border-primary text-primary font-medium text-sm">Sales Pipeline</button>
            <button className="pb-3 px-1 border-b-2 border-transparent text-slate-500 hover:text-slate-900 font-medium text-sm">Support Ticket Flow</button>
            <button className="pb-3 px-1 border-b-2 border-transparent text-slate-500 hover:text-slate-900 font-medium text-sm">Onboarding</button>
          </div>

          <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">Pipeline Stages</h3>
              <span className="text-xs text-slate-500">Drag to reorder stages</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: 'New Lead', prob: 10, color: 'bg-blue-500' },
                { name: 'Contact Made', prob: 25, color: 'bg-indigo-500' },
                { name: 'Demo Scheduled', prob: 50, color: 'bg-amber-500', automation: true },
                { name: 'Negotiation', prob: 80, color: 'bg-teal-500' },
                { name: 'Closed Won', prob: 100, color: 'bg-green-500', bg: 'bg-green-50/30' }
              ].map((stage, idx) => (
                <div key={idx} className={`group flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${stage.bg || ''}`}>
                  <div className="cursor-grab text-slate-300 hover:text-slate-500"><span className="material-symbols-outlined">drag_indicator</span></div>
                  <div className={`size-4 rounded-full ${stage.color} shrink-0`}></div>
                  <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Stage Name</label>
                      <input className="w-full text-sm font-medium text-slate-900 dark:text-white bg-transparent border-0 border-b border-transparent focus:border-primary px-0 py-1" type="text" defaultValue={stage.name} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Probability</label>
                      <div className="flex items-center">
                        <input className="w-12 text-sm text-slate-900 dark:text-white bg-transparent border-0 border-b border-transparent focus:border-primary px-0 py-1 text-right" type="number" defaultValue={stage.prob} />
                        <span className="text-sm text-slate-500 ml-1">%</span>
                      </div>
                    </div>
                    <div className="col-span-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {stage.automation && (
                        <button className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20" title="Automation Active">
                          <span className="material-symbols-outlined fill text-[20px]">bolt</span>
                        </button>
                      )}
                      <button className="p-1.5 rounded text-slate-400 hover:bg-slate-100 hover:text-primary" title="Add Automation"><span className="material-symbols-outlined text-[20px]">bolt</span></button>
                      <button className="p-1.5 rounded text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete Stage"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-gray-800/50">
              <button className="w-full border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm font-medium text-slate-500 hover:border-primary hover:text-primary hover:bg-white transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">add_circle</span> Add New Stage
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">bolt</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Pipeline Automations</h3>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">2 Active</span>
                </div>
                <div className="space-y-3">
                   {/* Automation Items */}
                   <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                      <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"><span className="material-symbols-outlined text-lg">calendar_clock</span></div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium text-slate-900 dark:text-white truncate">Schedule Demo Follow-up</p>
                         <p className="text-xs text-slate-500 truncate">When stage changes to "Demo Scheduled"</p>
                      </div>
                      <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full bg-primary"><span className="inline-block size-4 transform rounded-full bg-white shadow translate-x-4"></span></div>
                   </div>
                </div>
             </div>
             
             <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500 text-xl">psychology</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">AI Assistance</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Beta</span>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="text-sm font-medium text-slate-900 dark:text-white">Intent Detection</p>
                         <p className="text-xs text-slate-500">Move deals based on message sentiment</p>
                      </div>
                      <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-primary"><span className="inline-block size-5 transform rounded-full bg-white shadow translate-x-5 mt-0.5 ml-0.5"></span></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;