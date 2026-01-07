import React, { useState } from 'react';
import { useAppState } from '../StateContext';
import { Task, Contact } from '../types';

interface TaskModalProps {
  onClose: () => void;
  task?: Task; // Optional task for editing
}

const TaskModal: React.FC<TaskModalProps> = ({ onClose, task }) => {
  const { addTask, updateTask, contacts, t, language } = useAppState();
  const [title, setTitle] = useState(task?.title || '');
  const [contactName, setContactName] = useState(task?.contactName || '');
  const [contactAvatar, setContactAvatar] = useState(task?.contactAvatar || '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>(task?.priority || 'Medium');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactName.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title,
      contactName: contactName || (language === 'es' ? 'General' : 'General'),
      contactAvatar: contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName || 'G')}&background=random`,
      dueDate: task?.dueDate || (language === 'es' ? 'Mañana, 10:00 AM' : 'Tomorrow, 10:00 AM'),
      priority,
      status: task?.status || 'New',
      assigneeAvatar: task?.assigneeAvatar || 'https://ui-avatars.com/api/?name=User&background=random'
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  const handleSelectContact = (c: Contact) => {
    setContactName(c.name);
    setContactAvatar(c.avatar);
    setShowSearchResults(false);
  };

  const priorityOptions: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="w-full max-w-[640px] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {task ? (language === 'es' ? 'Editar Tarea' : 'Edit Task') : t('tasks.modal.title')}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{t('tasks.modal.subtitle')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasks.modal.taskTitle')}</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white h-12 px-4 shadow-sm focus:border-primary focus:ring-primary"
              placeholder={t('tasks.modal.titlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2 relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasks.modal.linkContext')}</label>
            <div className="relative">
              <span className="material-symbols-outlined text-green-600 absolute left-3 top-3">chat</span>
              <input
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white h-12 pl-10 pr-10 shadow-sm"
                placeholder={t('tasks.modal.searchPlaceholder')}
              />
              <span className="material-symbols-outlined text-slate-400 absolute right-3 top-3">search</span>
            </div>

            {showSearchResults && contactName && filteredContacts.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {filteredContacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectContact(c)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
                  >
                    <img
                      src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`}
                      className="w-8 h-8 rounded-full border border-slate-100"
                      alt=""
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</span>
                      <span className="text-[10px] text-slate-500">{c.phone}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500">{t('tasks.modal.linkedTo')}: <span className="font-medium text-slate-700 dark:text-slate-300">{contactName || t('tasks.modal.none')}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasks.table.dueDate')}</label>
              <div className="relative">
                <input className="w-full rounded-lg border-slate-300 dark:border-slate-600 h-12 pl-10 pr-4 bg-slate-50/50 dark:bg-slate-800/30 dark:text-slate-400" type="text" value={task?.dueDate || (language === 'es' ? 'Mañana, 10:00 AM' : 'Tomorrow, 10:00 AM')} readOnly />
                <span className="material-symbols-outlined text-slate-500 absolute left-3 top-3">calendar_today</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasks.modal.assigneeLabel')}</label>
              <div className="relative w-full rounded-lg border border-slate-300 dark:border-slate-600 h-12 px-3 flex items-center bg-slate-50/50 dark:bg-slate-800/30">
                <img className="h-6 w-6 rounded-full mr-3 shadow-sm bg-slate-100" src={task?.assigneeAvatar || "https://ui-avatars.com/api/?name=User&background=random"} alt="Assignee" />
                <span className="text-sm text-slate-500 dark:text-slate-400 flex-1">{t('tasks.modal.you')}</span>
                <span className="material-symbols-outlined text-slate-400">expand_more</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasks.modal.priorityLevel')}</label>
            <div className="flex gap-3">
              {priorityOptions.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${priority === p
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <span className={`h-2 w-2 rounded-full ${p === 'High' ? 'bg-red-500' : p === 'Medium' ? 'bg-primary' : 'bg-slate-400'}`}></span>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-5 bg-slate-50 dark:bg-[#1a2333] border-t border-slate-100 dark:border-slate-700 rounded-b-2xl flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors">{t('common.cancel')}</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-sm font-medium text-white flex items-center gap-2 transition-all shadow-md active:scale-95">
            <span>{task ? (language === 'es' ? 'Guardar Cambios' : 'Save Changes') : t('tasks.createTask')}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskModal;
