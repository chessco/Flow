import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';
import { useAppState } from '../StateContext';

export const WhatsAppSettings: React.FC = () => {
    const { user, canModifySettings } = useAppState();
    const isGeneralAdmin = user?.email === 'admin@pitayacode.io';

    const [settings, setSettings] = useState({
        accessToken: '',
        phoneNumberId: '',
        wabaId: '',
        verifyToken: ''
    });
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);
    const [showPhoneId, setShowPhoneId] = useState(false);
    const [showWabaId, setShowWabaId] = useState(false);
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
            const cleanedSettings = {
                ...settings,
                accessToken: settings.accessToken.replace(/\s/g, ''),
                phoneNumberId: settings.phoneNumberId.trim(),
                wabaId: settings.wabaId.trim()
            };
            await api.whatsapp.updateSettings(cleanedSettings);
            setSettings(cleanedSettings); // Update local state with cleaned values
            setStatus({ type: 'success', message: 'Configuración guardada correctamente.' });

        } catch (error: any) {
            if (error.status === 401) {
                setStatus({ type: 'error', message: 'Sesión expirada. Por favor, inicia sesión nuevamente.' });
            } else {
                setStatus({ type: 'error', message: 'Error al guardar: ' + error.message });
            }
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
                    <div className="relative">
                        <textarea
                            value={settings.accessToken}
                            onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                            disabled={!canModifySettings}
                            className={`w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!showToken && settings.accessToken && isGeneralAdmin ? 'text-security' : ''} ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="EAA..."
                            style={!showToken && settings.accessToken && isGeneralAdmin ? { filter: 'blur(4px)' } : {}}
                        />
                        <button
                            type="button"
                            onClick={() => isGeneralAdmin && setShowToken(!showToken)}
                            disabled={!isGeneralAdmin}
                            className={`absolute top-2 right-2 p-2 transition-colors ${isGeneralAdmin ? 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                            title={!isGeneralAdmin ? "Solo administradores generales pueden ver este dato" : ""}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showToken ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 italic">Puedes obtenerlo en el Meta Developers Portal. Se guarda de forma cifrada.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number ID
                        </label>
                        <div className="relative">
                            <input
                                type={showPhoneId || !isGeneralAdmin ? "text" : "password"}
                                value={settings.phoneNumberId}
                                onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                                disabled={!canModifySettings}
                                className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => isGeneralAdmin && setShowPhoneId(!showPhoneId)}
                                disabled={!isGeneralAdmin}
                                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${isGeneralAdmin ? 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                                title={!isGeneralAdmin ? "Solo administradores generales pueden ver este dato" : ""}
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {showPhoneId ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            WABA ID (Account ID)
                        </label>
                        <div className="relative">
                            <input
                                type={showWabaId || !isGeneralAdmin ? "text" : "password"}
                                value={settings.wabaId}
                                onChange={(e) => setSettings({ ...settings, wabaId: e.target.value })}
                                disabled={!canModifySettings}
                                className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!canModifySettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => isGeneralAdmin && setShowWabaId(!showWabaId)}
                                disabled={!isGeneralAdmin}
                                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${isGeneralAdmin ? 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                                title={!isGeneralAdmin ? "Solo administradores generales pueden ver este dato" : ""}
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {showWabaId ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
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
                    disabled={!canModifySettings}
                    className={`w-full py-3 font-medium rounded-lg transition-colors shadow-lg shadow-indigo-200 dark:shadow-none ${!canModifySettings ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                    {canModifySettings ? 'Guardar Configuración' : 'Modo Lectura (Solo Admins pueden editar)'}
                </button>
            </form>
        </div>
    );
};
