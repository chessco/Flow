import React, { useState } from 'react';
import { useAppState } from '../StateContext';
import { Language } from '../src/lib/translations';
import { WhatsAppSettings } from './WhatsAppSettings';
import { WhatsAppDebug } from './WhatsAppDebug';
import { AiSettings } from './AiSettings';

type SettingsTab = 'general' | 'whatsapp' | 'ai' | 'debug';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useAppState();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

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
          {(['general', 'whatsapp', 'ai', 'debug'] as SettingsTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === tab
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
        <div className="max-w-[1000px] mx-auto pb-10">

          {activeTab === 'general' && (
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

          {activeTab === 'whatsapp' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <WhatsAppSettings />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <AiSettings />
            </div>
          )}

          {activeTab === 'debug' && (
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