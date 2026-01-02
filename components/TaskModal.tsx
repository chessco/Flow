import React from 'react';

interface TaskModalProps {
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-[640px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create New Task</h2>
            <p className="text-sm text-slate-500 mt-1">Add a task to your flow board.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Task Title</label>
            <input autoFocus className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white h-12 px-4 shadow-sm focus:border-primary focus:ring-primary" placeholder="e.g. Follow up on proposal sent via WhatsApp" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Link to Context</label>
            <div className="relative">
              <span className="material-symbols-outlined text-green-600 absolute left-3 top-3">chat</span>
              <input className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white h-12 pl-10 pr-10 shadow-sm" placeholder="Search WhatsApp contact..." />
              <span className="material-symbols-outlined text-slate-400 absolute right-3 top-3">search</span>
            </div>
            <p className="text-xs text-slate-500">Linked to: <span className="font-medium text-slate-700 dark:text-slate-300">None</span></p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
            <textarea className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 p-4 min-h-[120px]" placeholder="Add details..."></textarea>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
              <div className="relative">
                <input className="w-full rounded-lg border-slate-300 h-12 pl-10 pr-4" type="text" defaultValue="Tomorrow, 10:00 AM" />
                <span className="material-symbols-outlined text-slate-500 absolute left-3 top-3">calendar_today</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assignee</label>
              <div className="relative w-full rounded-lg border border-slate-300 h-12 px-3 flex items-center bg-white">
                <img className="h-6 w-6 rounded-full mr-3" src="https://i.pravatar.cc/150?u=alex" alt="Alex" />
                <span className="text-sm text-slate-900 flex-1">Alex Morgan (You)</span>
                <span className="material-symbols-outlined text-slate-400">expand_more</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority Level</label>
            <div className="flex gap-3">
               <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><span className="h-2 w-2 rounded-full bg-slate-400"></span> Low</button>
               <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 py-2.5 text-sm font-medium text-primary"><span className="h-2 w-2 rounded-full bg-primary"></span> Medium</button>
               <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><span className="h-2 w-2 rounded-full bg-red-500"></span> High</button>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 bg-slate-50 dark:bg-[#1a2333] border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white">Cancel</button>
          <button className="px-5 py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-sm font-medium text-white flex items-center gap-2">
            <span>Create Task</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;