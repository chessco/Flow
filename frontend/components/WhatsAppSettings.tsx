import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';

export const WhatsAppSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        accessToken: '',
        phoneNumberId: '',
        wabaId: '',
        verifyToken: ''
    });
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.whatsapp.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: '', message: 'Gaurdando cambios...' });
        try {
            await api.whatsapp.updateSettings(settings);
            setStatus({ type: 'success', message: 'Configuración guardada correctamente.' });
        } catch (error: any) {
            setStatus({ type: 'error', message: 'Error al guardar: ' + error.message });
        }
    };

    if (loading) return <div className="p-8">Cargando configuración...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Configuración de WhatsApp</h1>
                <p className="text-slate-500 dark:text-slate-400">Gestiona las credenciales de tu API de WhatsApp Cloud para este entorno.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Access Token
                    </label>
                    <textarea
                        value={settings.accessToken}
                        onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                        className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="EAA..."
                    />
                    <p className="mt-1 text-xs text-slate-500 italic">Puedes obtenerlo en el Meta Developers Portal.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number ID
                        </label>
                        <input
                            type="text"
                            value={settings.phoneNumberId}
                            onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            WABA ID (Account ID)
                        </label>
                        <input
                            type="text"
                            value={settings.wabaId}
                            onChange={(e) => setSettings({ ...settings, wabaId: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1 flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">link</span>
                        Webhook Verification
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">Copia estos valores en tu configuración de Webhook en Meta.</p>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between text-[11px] font-mono bg-white dark:bg-black/20 p-2 rounded border border-indigo-200 dark:border-indigo-800">
                            <span className="opacity-50">URL:</span>
                            <span className="text-indigo-700 dark:text-indigo-300">https://your-ngrok.dev/whatsapp/webhook</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono bg-white dark:bg-black/20 p-2 rounded border border-indigo-200 dark:border-indigo-800">
                            <span className="opacity-50">Verify Token:</span>
                            <span className="text-indigo-700 dark:text-indigo-300">{settings.verifyToken || 'pitaya_flow_verify_token_2026'}</span>
                        </div>
                    </div>
                </div>

                {status.message && (
                    <div className={`p-4 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    Guardar Configuración
                </button>
            </form>
        </div>
    );
};
