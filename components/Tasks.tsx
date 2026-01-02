import React, { useState } from 'react';
import TaskModal from './TaskModal';

const Tasks: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex-shrink-0 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 z-10">
        <div className="px-8 py-6 w-full max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">Tasks & Follow-ups</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">Manage your daily operations, SLAs, and conversation follow-ups.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-semibold h-10 px-5 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Create Task</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="px-8 pb-6 w-full max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1e2330] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm font-medium">Tasks Due Today</p>
                <span className="material-symbols-outlined text-orange-500 text-[20px]">calendar_today</span>
              </div>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">5</p>
            </div>
            <div className="bg-white dark:bg-[#1e2330] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm font-medium">SLA Breach Risk</p>
                <span className="material-symbols-outlined text-red-500 text-[20px]">warning</span>
              </div>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">1</p>
            </div>
            {/* More stats... */}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-8 py-4 w-full max-w-[1400px] mx-auto">
        <div className="bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">Task Description</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">Contact</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">Due Date</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">Priority</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">SLA Status</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">Assignee</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Row 1 */}
              <tr className="group bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-primary">
                <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Respond to Pricing Inquiry</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white uppercase">New</span>
                    </div>
                    <span className="text-xs text-slate-500">Customer asked about Enterprise tier</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img className="size-8 rounded-full object-cover" src="https://i.pravatar.cc/150?u=maria" alt="Maria" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">Maria Gonzalez</span>
                      <a href="#" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">open_in_new</span> View Chat
                      </a>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-primary font-semibold text-sm">Today, 5:00 PM</td>
                <td className="p-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">High</span></td>
                <td className="p-4"><span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">New Task</span></td>
                <td className="p-4"><img className="size-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?u=alex" alt="Alex" /></td>
                <td className="p-4"><button className="text-slate-400"><span className="material-symbols-outlined">more_vert</span></button></td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Follow up on Enterprise Proposal</span>
                    <span className="text-xs text-slate-500">Requires updated pricing PDF</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img className="size-8 rounded-full object-cover" src="https://i.pravatar.cc/150?u=john" alt="John" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">John Doe</span>
                  </div>
                </td>
                <td className="p-4 text-orange-600 text-sm font-medium">Today, 2:00 PM</td>
                <td className="p-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">High</span></td>
                <td className="p-4">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                    <div className="size-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-red-700">Breach in 2h</span>
                  </div>
                </td>
                <td className="p-4"><img className="size-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?u=alex" alt="Alex" /></td>
                <td className="p-4"><button className="text-slate-400"><span className="material-symbols-outlined">more_vert</span></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && <TaskModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default Tasks;