import React, { useState } from 'react';
import TaskModal from './TaskModal';
import { useAppState } from '../StateContext';
import { Task } from '../types';

const Tasks: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { tasks, t, deleteTask, language } = useAppState();

  const totalTasks = tasks.length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const breachTasks = tasks.filter(t => t.status === 'Breach').length;

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(language === 'es' ? '¿Estás seguro de que deseas eliminar esta tarea?' : 'Are you sure you want to delete this task?')) {
      deleteTask(id);
      setOpenMenuId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 z-10">
        <div className="px-8 py-6 w-full max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">{t('tasks.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">{t('tasks.subtitle')}</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-semibold h-10 px-5 shadow-sm transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>{t('tasks.createTask')}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="px-8 pb-6 w-full max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1e2330] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm font-medium">{t('tasks.totalTasks')}</p>
                <span className="material-symbols-outlined text-primary text-[20px]">assignment</span>
              </div>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">{totalTasks}</p>
            </div>
            <div className="bg-white dark:bg-[#1e2330] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm font-medium">{t('tasks.completedTasks')}</p>
                <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
              </div>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">{completedTasks}</p>
            </div>
            <div className="bg-white dark:bg-[#1e2330] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm font-medium">{t('tasks.highPriority')}</p>
                <span className="material-symbols-outlined text-amber-500 text-[20px]">priority_high</span>
              </div>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">{highPriorityTasks}</p>
            </div>
            <div className="bg-white dark:bg-[#1e2330] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm font-medium">{t('tasks.breachTasks')}</p>
                <span className="material-symbols-outlined text-red-500 text-[20px]">release_alert</span>
              </div>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">{breachTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-8 py-4 w-full max-w-[1400px] mx-auto">
        <div className="bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="p-4 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">{t('tasks.table.description')}</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">{t('tasks.table.contact')}</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">{t('tasks.table.dueDate')}</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">{t('tasks.table.priority')}</th>
                <th className="p-4 text-xs font-semibold uppercase text-slate-500">{t('tasks.table.assignee')}</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group animate-in fade-in slide-in-from-left-2 duration-300">
                  <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{task.title}</span>
                        {task.status === 'New' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white uppercase">New</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full object-cover bg-slate-100 border border-slate-200"
                        src={task.contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.contactName)}&background=random`}
                        alt={task.contactName}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{task.contactName}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`p-4 text-sm font-semibold ${task.dueDate.includes('Today') || task.dueDate.includes('Hoy') ? 'text-primary' : 'text-slate-500'}`}>
                    {task.dueDate}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      task.priority === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                      {task.priority === 'High' ? (language === 'es' ? 'Alta' : 'High') :
                        task.priority === 'Medium' ? (language === 'es' ? 'Media' : 'Medium') :
                          (language === 'es' ? 'Baja' : 'Low')}
                    </span>
                  </td>
                  <td className="p-4">
                    <img
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 bg-slate-100"
                      src={task.assigneeAvatar || `https://ui-avatars.com/api/?name=User&background=random`}
                      alt="Assignee"
                    />
                  </td>
                  <td className="p-4 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                      className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    {openMenuId === task.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)}></div>
                        <div className="absolute right-4 top-10 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => handleEdit(task)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            {language === 'es' ? 'Editar' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            {language === 'es' ? 'Eliminar' : 'Delete'}
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center opacity-40">
                    <p className="text-lg font-bold">{language === 'es' ? 'No se encontraron tareas' : 'No tasks found'}</p>
                    <p className="text-sm">{language === 'es' ? 'Crea una tarea para empezar.' : 'Create a task to get started.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && <TaskModal task={editingTask} onClose={handleCloseModal} />}
    </div>
  );
};

export default Tasks;
