import React from 'react';
import { useAppState } from '../StateContext';

const HandoverAlertsPanel: React.FC = () => {
    const { handoverAlerts, setActiveContactId, setActiveItem, resolveHandoverAlert, approvePayment, t } = useAppState();

    if (handoverAlerts.length === 0) return null;

    const handleJump = (target: string) => {
        if (target === 'settings') {
            setActiveItem('settings');
        } else {
            setActiveContactId(target);
            setActiveItem('inbox');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 w-80 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-red-500 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-[20px]">warning</span>
                        <span className="text-sm font-bold uppercase tracking-wider">{t('handover.alerts')}</span>
                    </div>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {handoverAlerts.length}
                    </span>
                </div>
                <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                    {handoverAlerts.map((alert) => {
                        const isSystemError = alert.reason?.startsWith('ERROR SISTEMA:');

                        return (
                            <div key={alert.id} className={`p-3 border rounded-xl group transition-all ${isSystemError
                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 hover:bg-amber-50'
                                : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 hover:bg-red-50'
                                }`}>
                                <div className="flex items-start gap-3 mb-2">
                                    <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isSystemError
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                        }`}>
                                        <span className="material-symbols-outlined text-[18px]">
                                            {isSystemError ? 'dns' : 'person_alert'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                            {isSystemError ? 'Error del Sistema' : (alert.conversation?.contact?.name || alert.conversation?.lead?.name || 'Customer')}
                                        </p>
                                        <p className={`text-[10px] line-clamp-2 mt-0.5 italic ${isSystemError ? 'text-amber-700/70 dark:text-amber-400/70' : 'text-red-700/70 dark:text-red-400/70'
                                            }`}>
                                            "{alert.reason}"
                                        </p>

                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {alert.reason?.startsWith('COMPROBANTE RECIBIDO:') ? (
                                        <>
                                            <button
                                                onClick={() => approvePayment(alert.id)}
                                                className="flex-[2] bg-green-500 hover:bg-green-600 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                {t('handover.approvePayment')}
                                            </button>
                                            <button
                                                onClick={() => handleJump(alert.conversationId)}
                                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                title="Ver Conversación"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">chat</span>
                                                {t('handover.jump')}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleJump(isSystemError ? 'settings' : alert.conversationId)}
                                            className={`flex-1 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${isSystemError ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">
                                                {isSystemError ? 'settings' : 'chat_bubble'}
                                            </span>
                                            {isSystemError ? 'Ir a Configuración' : t('handover.jump')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => resolveHandoverAlert(alert.id)}
                                        className="px-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors flex items-center justify-center"
                                        title={t('handover.resolve')}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};

export default HandoverAlertsPanel;
