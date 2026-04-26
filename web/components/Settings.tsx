import React, { useState } from 'react';
import { useAppState } from '../StateContext';
import { Language } from '../src/lib/translations';
import { WhatsAppSettings } from './WhatsAppSettings';
import { WhatsAppDebug } from './WhatsAppDebug';
import { AiSettings } from './AiSettings';
import { UsersSettings } from './UsersSettings';

type SettingsTab = 'general' | 'profile' | 'whatsapp' | 'ai' | 'users' | 'debug';

const Settings: React.FC = () => {
  const { t, language, setLanguage, isAdmin, user, updateUser, activeSettingsTab, setActiveSettingsTab } = useAppState();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: ''
  });

  const tabs: SettingsTab[] = ['general', 'profile', 'whatsapp', 'ai'];
  if (isAdmin || user?.role === 'SYSTEM_ADMIN' || user?.email === 'admin@pitayacode.io') tabs.push('users');
  tabs.push('debug');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email
      };
      if (formData.password) updateData.password = formData.password;

      await updateUser(user.id, updateData);
      setSuccess(true);
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50 dark:bg-[#1a202c]">
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center w-full max-w-md relative">
          <span className="absolute left-3 text-slate-400 material-symbols-outlined text-[20px]">search</span>
          <input
            className="w-full bg-slate-100 dark:bg-gray-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50"
            placeholder={t('common.search')}
            type="text"
          />
        </div>
      </header>

      {/* Tabs Header */}
      <div className="px-8 bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSettingsTab(tab)}
              className={`py-4 text-sm font-semibold transition-all border-b-2 ${activeSettingsTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              {t(`settings.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[800px] mx-auto pb-10">

          {activeSettingsTab === 'general' && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.tabs.general')}</h2>
                <p className="text-sm text-slate-500">{t('settings.languageDesc')}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary">language</span>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t('settings.language')}</h3>
                </div>

                <div className="flex gap-4">
                  {(['en', 'es'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-between ${language === lang
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang === 'en' ? '🇺🇸' : '🇪🇸'}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {lang === 'en' ? 'English' : 'Español'}
                        </span>
                      </div>
                      {language === lang && (
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'profile' && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.tabs.profile')}</h2>
                <p className="text-sm text-slate-500">{t('profile.edit.title')}</p>
              </div>

              <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col gap-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg text-sm font-medium">
                    {t('common.success')}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('profile.edit.name')}</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all dark:text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('profile.edit.email')}</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all dark:text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {t('users.form.password')}
                    <span className="text-[10px] font-normal ml-2 opacity-60">({t('profile.edit.comingSoon').replace('{tab}', 'Password update')})</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all dark:text-white"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? t('common.loading') : t('profile.edit.save')}
                </button>
              </form>
            </div>
          )}

          {activeSettingsTab === 'whatsapp' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <WhatsAppSettings />
            </div>
          )}

          {activeSettingsTab === 'ai' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <AiSettings />
            </div>
          )}

          {activeSettingsTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <UsersSettings />
            </div>
          )}

          {activeSettingsTab === 'debug' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
              <WhatsAppDebug />
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Settings;