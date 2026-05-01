import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';
import { useAppState } from '../StateContext';

export const WhatsAppSettings: React.FC = () => {
    const { user, canModifySettings } = useAppState();
    const isSystemAdmin = user?.email === 'system@pitayacode.io';
    const isGeneralAdmin = user?.email === 'admin@pitayacode.io' || isSystemAdmin;

    const [settings, setSettings] = useState({
        tenantId: '',
        accessToken: '',
        phoneNumberId: '',
        wabaId: '',
        verifyToken: '',
        tenantName: '',
        tenantSlug: '',
        skills: { 
            sales: false, 
            purchase_approval: false, 
            queue_management: false, 
            don_juan_camaron: false,
            acuacoreApiUrl: '' 
        },
        allTenants: [] as any[]
    });
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);
    const [showPhoneId, setShowPhoneId] = useState(false);
    const [showWabaId, setShowWabaId] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async (id?: string) => {
        try {
            // Se puede pasar un id opcional para ver otro tenant si es superadmin
            const query = id ? `?tenantId=${id}` : '';
            // Note: Our api helper might need to support query params or I'll use fetch/axios directly
            // For now let's assume getSettings can handle a specific tenant if the user is authorized
            const data = await api.whatsapp.getSettings(id); 
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTenantSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        if (id) {
            setLoading(true);
            fetchSettings(id);
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
            // Note: Pass tenantId if we are in superadmin mode switching tenants
            await api.whatsapp.updateSettings(cleanedSettings, settings.tenantId);
            setSettings(cleanedSettings);
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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Configuración de WhatsApp <span className="text-[10px] opacity-30">v1.1-DJC</span></h1>
                <p className="text-slate-500 dark:text-slate-400">Gestiona las credenciales de tu API de WhatsApp Cloud y las habilidades activas de tu instancia.</p>
            </div>

            {isSystemAdmin && settings.allTenants?.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-600 rounded-lg border border-indigo-500 shadow-lg text-white">
                    <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-80">Panel System Admin: Cambiar de Tenant</label>
                    <select 
                        onChange={handleTenantSwitch} 
                        value={settings.tenantId}
                        className="w-full p-2 bg-indigo-800 border border-indigo-400 rounded text-sm font-bold outline-none focus:ring-2 focus:ring-white/20"
                    >
                        {settings.allTenants.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Tenant: {settings.tenantName || 'Cargando...'}</h3>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Slug de Conexión:</span>
                            {isSystemAdmin ? (
                                <input 
                                    type="text" 
                                    value={settings.tenantSlug}
                                    onChange={(e) => setSettings({ ...settings, tenantSlug: e.target.value })}
                                    className="text-xs font-mono bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none w-48"
                                />
                            ) : (
                                <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded text-xs">{settings.tenantSlug || '...'}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                    <div className="flex flex-wrap gap-2 justify-end">
                        {settings.skills?.don_juan_camaron && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md border border-orange-200 uppercase flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                                Agente: Don Juan
                            </span>
                        )}
                        {settings.skills?.sales && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md border border-green-200 uppercase">Skill: Ventas</span>
                        )}
                        {settings.skills?.purchase_approval && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200 uppercase">Skill: Aprobaciones</span>
                        )}
                        {settings.skills?.queue_management && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md border border-purple-200 uppercase">Skill: Turnos</span>
                        )}
                    </div>
                    </div>
                </div>
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

                {/* SECCIÓN 1: AGENTES INTELIGENTES (PERSONAS) */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30">
                    <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">smart_toy</span>
                        Agentes Inteligentes (AI Personas)
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={settings.skills?.don_juan_camaron}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    skills: { ...settings.skills, don_juan_camaron: e.target.checked }
                                })}
                                disabled={!canModifySettings}
                                className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                            />
                            <div className="ml-3 flex-1">
                                <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Don Juan Camarón</span>
                                <span className="block text-xs text-slate-500">Asesor experto en acuacultura con personalidad senior y técnica.</span>
                                
                                {settings.skills?.don_juan_camaron && (
                                    <div className="mt-3 p-3 bg-white dark:bg-black/20 rounded border border-orange-200 dark:border-orange-800/50 shadow-inner">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">URL de API AcuaCore</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                placeholder="https://su-ngrok.dev"
                                                value={settings.skills?.acuacoreApiUrl || ''}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    skills: { ...settings.skills, acuacoreApiUrl: e.target.value.trim() }
                                                })}
                                                className="flex-1 text-xs font-mono p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:ring-1 focus:ring-orange-500"
                                            />
                                            <div className="flex items-center px-2 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500">
                                                /api/webhooks...
                                            </div>
                                        </div>
                                        <p className="mt-1 text-[9px] text-slate-400 italic">Endpoint donde Flow enviará los mensajes para que la IA los procese.</p>
                                    </div>
                                )}
                            </div>
                        </label>
                        {/* Aquí se pueden añadir más agentes en el futuro */}
                        <div className="pt-2 border-t border-orange-100 dark:border-orange-900/20">
                           <p className="text-[10px] text-orange-600/50 uppercase font-black tracking-widest">Próximamente: Conectar nuevos agentes de AcuaCore</p>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: HABILIDADES FUNCIONALES */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">bolt</span>
                        Habilidades del Sistema (Skills)
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={settings.skills?.sales}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    skills: { ...settings.skills, sales: e.target.checked }
                                })}
                                disabled={!canModifySettings}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ventas Inteligentes (AI)</span>
                                <span className="block text-xs text-slate-500">Permite que la IA gestione conversaciones y sugiera cambios en el Kanban.</span>
                            </div>
                        </label>

                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={settings.skills?.purchase_approval}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    skills: { ...settings.skills, purchase_approval: e.target.checked }
                                })}
                                disabled={!canModifySettings}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Aprobación de Compras (ERP)</span>
                                <span className="block text-xs text-slate-500">Habilita el flujo de aprobación externo desde el ERP con botones de acción.</span>
                            </div>
                        </label>

                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={settings.skills?.queue_management}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    skills: { ...settings.skills, queue_management: e.target.checked }
                                })}
                                disabled={!canModifySettings}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fila y Turnos (Queue)</span>
                                <span className="block text-xs text-slate-500">Permite gestionar turnos y filas de espera integradas con LuxuryOS.</span>
                            </div>
                        </label>
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
