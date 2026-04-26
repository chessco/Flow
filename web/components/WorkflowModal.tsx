import React, { useState, useEffect } from 'react';
import { useAppState } from '../StateContext';
import { Workflow } from '../types';

interface WorkflowModalProps {
    workflow?: Workflow;
    onClose: () => void;
}

const WorkflowModal: React.FC<WorkflowModalProps> = ({ workflow, onClose }) => {
    const { addWorkflow, updateWorkflow, t, language } = useAppState();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        triggers: '',
        actions: '',
        content: '',
        executionType: 'always' as 'once' | 'always',
        delayMinutes: 0,
        condition: '',
        active: true
    });

    useEffect(() => {
        if (workflow) {
            setFormData({
                name: workflow.name,
                description: workflow.description,
                triggers: workflow.triggers,
                actions: workflow.actions,
                content: workflow.content || '',
                executionType: workflow.executionType || 'always',
                delayMinutes: workflow.delayMinutes || 0,
                condition: workflow.condition || '',
                active: workflow.active
            });
        }
    }, [workflow]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (workflow) {
            updateWorkflow(workflow.id, formData);
        } else {
            addWorkflow(formData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1e2330] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">
                            {workflow ? (language === 'es' ? 'Editar Flujo' : 'Edit Workflow') : t('automations.createAutomation')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {language === 'es' ? 'Configura tu automatización inteligente.' : 'Configure your intelligent automation.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                {language === 'es' ? 'Nombre del Flujo' : 'Workflow Name'}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={language === 'es' ? 'Ej: Bienvenida Clientes' : 'e.g. Customer Welcome'}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                {language === 'es' ? 'Descripción' : 'Description'}
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={language === 'es' ? '¿Qué hace esta automatización?' : 'What does this automation do?'}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium h-20 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                    {t('automations.triggers')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.triggers}
                                    onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
                                    placeholder="Ej: New Message"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                    {t('automations.actions')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.actions}
                                    onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                                    placeholder="Ej: Send AI Response"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                {language === 'es' ? 'Contenido de la Automatización' : 'Automation Content'}
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder={language === 'es' ? 'Ej: Hola! Bienvenido a PitayaCode...' : 'e.g. Hi! Welcome to PitayaCode...'}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium h-24 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                    {language === 'es' ? 'Tipo de Ejecución' : 'Execution Type'}
                                </label>
                                <div className="flex bg-slate-50 dark:bg-slate-900/50 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, executionType: 'once' })}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.executionType === 'once' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}
                                    >
                                        {language === 'es' ? 'Una vez' : 'Once'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, executionType: 'always' })}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.executionType === 'always' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}
                                    >
                                        {language === 'es' ? 'Siempre' : 'Always'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                    {language === 'es' ? 'Delay (Minutos)' : 'Delay (Minutes)'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.delayMinutes}
                                    onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                                {language === 'es' ? 'Condición IA (Opcional)' : 'AI Condition (Optional)'}
                            </label>
                            <input
                                type="text"
                                value={formData.condition}
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                placeholder={language === 'es' ? 'Ej: sentimiento es negativo' : 'e.g. sentiment is negative'}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>

                        <div className="flex items-center justify-between py-2 px-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {language === 'es' ? 'Estado Activo' : 'Active Status'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, active: !formData.active })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${formData.active ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.active ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-primary/25 transition-all active:scale-95"
                        >
                            {workflow ? (language === 'es' ? 'Guardar Cambios' : 'Save Changes') : (language === 'es' ? 'Crear Flujo' : 'Create Workflow')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkflowModal;
