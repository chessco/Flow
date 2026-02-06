import React, { useState, useEffect } from 'react';
import { useAppState } from '../StateContext';
import { api } from '../src/lib/api';

export const AiSettings: React.FC = () => {
    const { t, canModifySettings } = useAppState();
    const [config, setConfig] = useState({
        apiKey: '',
        provider: 'GEMINI',
        mode: 'TENANT',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 1024,
        rateLimitEnabled: true,
        systemPrompt: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [health, setHealth] = useState<'online' | 'offline' | 'checking'>('checking');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await api.ai.getConfig();
            if (data) {
                setConfig(prev => ({ ...prev, ...data }));
                setHealth('online');
            }
        } catch (error) {
            console.error('Error loading AI config:', error);
            setHealth('offline');
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setStatus('saving');
        try {
            const result = await api.ai.updateConfig(config);
            if (result.success) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                console.error('Save failed:', result.error);
                alert(`Error: ${result.error}`);
                setStatus('error');
            }
        } catch (error) {
            console.error('API Error:', error);
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6">
            <div className="flex items-center justify-between max-w-2xl">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t('settings.tabs.ai')}
                    </h2>
                    <p className="text-sm text-slate-500">
                        Enterprise AI Governance & Infrastructure
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${health === 'online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    health === 'offline' ? 'bg-red-50 text-red-600 border border-red-100' :
                        'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${health === 'online' ? 'bg-emerald-500 animate-pulse' : health === 'offline' ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                    AI {health}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">security</span>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Secrets & Credentials</h3>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 rounded-md border border-amber-100 dark:border-amber-800/30 text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Tenant Admin Only
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Provider</label>
                            <select
                                value={config.provider}
                                onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
                                disabled={!canModifySettings}
                                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="GEMINI">Google Gemini</option>
                                <option value="OPENAI" disabled>OpenAI (Coming Soon)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Mode</label>
                            <select
                                value={config.mode}
                                onChange={(e) => setConfig({ ...config, mode: e.target.value as any })}
                                disabled={!canModifySettings}
                                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="TENANT">BYOK (Tenat Key)</option>
                                <option value="PLATFORM">Shared (Platform Key)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Google AI API Key</label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={config.apiKey}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                disabled={!canModifySettings}
                                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-mono ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="AIzaSy..."
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 shadow-sm font-bold uppercase">
                                    AES-256 Encrypted
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary">tune</span>
                            <h3 className="font-semibold text-slate-900 dark:text-white">LLM Parameters</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Temperature</label>
                                    <span className="text-xs font-mono text-primary font-bold">{config.temperature}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={config.temperature}
                                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                                    disabled={!canModifySettings}
                                    className={`w-full accent-primary ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Model</label>
                                <select
                                    value={config.model}
                                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                    disabled={!canModifySettings}
                                    className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <option value="gemini-2.5-flash-lite-preview-0206">Gemini 2.5 Flash Lite (Preview)</option>
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Rate Limiting (15 RPM)</h4>
                                <p className="text-xs text-slate-500 italic">Limita el uso de IA a 15 solicitudes por minuto para control de costos.</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, rateLimitEnabled: !config.rateLimitEnabled })}
                                disabled={!canModifySettings}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''} ${config.rateLimitEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${config.rateLimitEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Knowledge & Instructions</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 italic">Define el comportamiento, reglas de negocio y datos oficiales (bancos, precios) que la IA debe seguir.</p>
                        <textarea
                            value={config.systemPrompt || ''}
                            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                            disabled={!canModifySettings}
                            className={`w-full h-48 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-sans resize-none focus:ring-2 focus:ring-primary/20 outline-none ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="Escribe aquí las instrucciones del sistema..."
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            Changes are applied immediately after saving.
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !canModifySettings}
                            className={`flex items-center justify-center gap-2 py-3 px-10 rounded-xl font-bold text-sm transition-all shadow-lg ${!canModifySettings ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' :
                                status === 'success' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                    status === 'error' ? 'bg-red-500 text-white shadow-red-200' :
                                        'bg-primary hover:bg-blue-600 text-white shadow-primary/20'
                                }`}
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            ) : status === 'success' ? (
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">save</span>
                            )}
                            {!canModifySettings ? 'Read-Only' : status === 'success' ? 'Applied' : status === 'error' ? 'Error' : 'Save Config'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-900/10 flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-500">assignment_turned_in</span>
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Usage Policy Active</h4>
                        <p className="text-[10px] text-slate-500">Guardrails ensure PII redaction and professional tone adherence across all AI modules.</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/10 flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500">analytics</span>
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Observability Enabled</h4>
                        <p className="text-[10px] text-slate-500">Real-time audit logs are being emitted to the governance layer for tracking.</p>
                    </div>
                </div>
            </div>
        </div >
    );
};
