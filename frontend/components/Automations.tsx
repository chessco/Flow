import React, { useState } from 'react';
import { useAppState } from '../StateContext';
import WorkflowModal from './WorkflowModal';
import { Workflow } from '../types';

const Automations: React.FC = () => {
    const { t, language, workflows, deleteWorkflow } = useAppState();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | undefined>(undefined);

    const handleEdit = (wf: Workflow) => {
        setEditingWorkflow(wf);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        const message = language === 'es'
            ? `¿Estás seguro de que deseas eliminar el flujo "${name}"?`
            : `Are you sure you want to delete the workflow "${name}"?`;

        if (confirm(message)) {
            deleteWorkflow(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingWorkflow(undefined);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-800 z-10 transition-colors">
                <div className="px-8 py-8 w-full max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight">{t('automations.title')}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">{t('automations.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-3 rounded-xl bg-primary hover:bg-blue-700 text-white text-sm font-bold h-12 px-6 shadow-lg shadow-primary/25 transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined text-[24px] group-hover:rotate-90 transition-transform">add</span>
                        <span>{t('automations.createAutomation')}</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-8 py-10 w-full max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.map((auto, idx) => (
                        <div
                            key={auto.id}
                            className="bg-white dark:bg-[#1e2330] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${auto.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-[28px]">
                                        {auto.name.toLowerCase().includes('welcome') || auto.name.toLowerCase().includes('bienvenida') ? 'auto_awesome' :
                                            auto.name.toLowerCase().includes('follow') || auto.name.toLowerCase().includes('seguimiento') ? 'schedule' :
                                                'psychology'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${auto.active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {auto.active ? t('automations.active') : t('automations.inactive')}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{auto.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed line-clamp-2">
                                {auto.description}
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-[18px] text-slate-400">bolt</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('automations.triggers')}</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{auto.triggers}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-[18px] text-slate-400">play_arrow</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('automations.actions')}</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{auto.actions}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-auto">
                                <span className="text-[10px] font-bold text-slate-400 italic">
                                    {t('automations.lastRun').replace('{time}', auto.lastRun)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(auto)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                        title={language === 'es' ? 'Editar' : 'Edit'}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(auto.id, auto.name)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title={language === 'es' ? 'Eliminar' : 'Delete'}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Coming Soon Card */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center group min-h-[300px]">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-3xl text-slate-300">construction</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 mb-1">{t('automations.comingSoon')}</p>
                    </div>
                </div>
            </div>

            {isModalOpen && <WorkflowModal workflow={editingWorkflow} onClose={handleCloseModal} />}
        </div>
    );
};

export default Automations;
