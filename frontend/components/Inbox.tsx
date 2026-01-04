import React, { useState, useRef, useEffect } from 'react';
import AiDrawer from './AiDrawer';
import { useAppState } from '../StateContext';

const Inbox: React.FC = () => {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'ai'>('all');
  const {
    contacts,
    messages,
    activeContactId,
    setActiveContactId,
    sendMessage,
    suggestions,
    refreshSuggestions,
    isRefinedLoading,
    refineMessage,
    t,
    language
  } = useAppState();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.length > 0
    ? (contacts.find(c => c.id === activeContactId) || contacts[0])
    : null;

  const activeMessages = activeContact ? (messages[activeContact.id] || []) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = () => {
    if (!inputText.trim() || !activeContact) return;
    sendMessage(activeContact.id, inputText);
    setInputText('');
  };

  if (!activeContact) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#f6f6f8] dark:bg-black text-slate-400">
        <span className="material-symbols-outlined text-[64px] mb-4 opacity-20">contacts</span>
        <p className="text-lg font-medium">{t('inbox.loading')}</p>
        <p className="text-sm">{t('inbox.helpTip')}</p>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAiAssist = async () => {
    if (!inputText.trim() || isRefinedLoading) return;
    const refined = await refineMessage(inputText);
    if (refined) {
      setInputText(refined);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Inbox List Panel */}
      <aside className="w-[380px] h-full flex flex-col bg-white dark:bg-[#151c2c] border-r border-slate-200 dark:border-slate-800 shrink-0 z-10 hidden md:flex">
        <div className="px-5 pt-6 pb-2">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('inbox.title')} <span className="text-slate-400 font-medium text-lg ml-1">{contacts.length}</span></h1>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          <div className="relative mb-4 group">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
            <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 dark:text-white" placeholder={t('common.search')} type="text" />
          </div>
          <div className="flex gap-6 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveFilter('all')}
              className={`pb-3 border-b-2 text-sm transition-all ${activeFilter === 'all' ? 'border-primary text-slate-900 dark:text-white font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium'}`}
            >
              {t('inbox.all')}
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`pb-3 border-b-2 text-sm transition-all ${activeFilter === 'unread' ? 'border-primary text-slate-900 dark:text-white font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium'}`}
            >
              {t('inbox.unread')}
            </button>
            <button
              onClick={() => setActiveFilter('ai')}
              className={`pb-3 border-b-2 text-sm transition-all flex items-center gap-1 ${activeFilter === 'ai' ? 'border-primary text-slate-900 dark:text-white font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium'}`}
            >
              {t('inbox.ai')} <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts
            .filter(c => {
              if (activeFilter === 'unread') return c.unread;
              if (activeFilter === 'ai') return c.aiManaged;
              return true;
            })
            .map((contact) => (
              <div key={contact.id} className="px-3 py-1">
                <div
                  onClick={() => setActiveContactId(contact.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all relative group ${activeContactId === contact.id
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary/10'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  {activeContactId === contact.id && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full"></div>
                  )}
                  <div className="flex gap-3 pl-2">
                    <div className="relative shrink-0">
                      <img
                        className="w-12 h-12 rounded-full object-cover bg-slate-100"
                        src={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'W')}&background=random`}
                        alt={contact.name}
                      />
                      {contact.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#151c2c] rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <h3 className={`font-semibold text-sm truncate ${contact.unread ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{contact.name}</h3>
                          {contact.aiManaged && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white shrink-0" title={t('handover.aiManaged')}>
                              <span className="material-symbols-outlined text-[10px] scale-90">bolt</span>
                            </span>
                          )}
                          {contact.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 ml-1"></span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {messages[contact.id]?.[messages[contact.id].length - 1]?.timestamp || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">done_all</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                          {messages[contact.id]?.[messages[contact.id].length - 1]?.text || t('inbox.noMessages')}
                        </p>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {contact.tags?.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col bg-[#f6f6f8] dark:bg-black relative h-full">
        {/* Header */}
        <header className="h-[72px] px-6 bg-white dark:bg-[#151c2c] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                className="w-10 h-10 rounded-full object-cover bg-slate-100"
                src={activeContact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name || 'W')}&background=random`}
                alt={activeContact.name}
              />
              {activeContact.status === 'online' && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#151c2c] rounded-full"></div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 dark:text-white leading-tight">{activeContact.name}</h2>
                {activeContact.aiManaged && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider animate-pulse">
                    <span className="material-symbols-outlined text-[12px]">bolt</span>
                    {t('handover.aiManaged')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{t('inbox.' + activeContact.status)}</p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-700">{activeContact.company}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-blue-700 rounded-lg shadow-sm shadow-primary/30 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              {t('inbox.aicopilot')}
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6"
          style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 opacity-50">
              <span className="material-symbols-outlined text-[64px]">forum</span>
              <p className="text-sm font-medium">{t('inbox.startChat')}</p>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.sender === 'them' ? (
                  <div className="flex gap-3 max-w-[80%] md:max-w-[70%] animate-in slide-in-from-left-4 duration-300">
                    <img
                      className="w-8 h-8 rounded-full object-cover shrink-0 self-end mb-1 shadow-sm bg-slate-100"
                      src={activeContact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name)}&background=random`}
                      alt={activeContact.name}
                    />
                    <div className="flex flex-col gap-1">
                      <div className="bg-white dark:bg-[#1f2937] p-4 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        {msg.type === 'image' && msg.mediaUrl && (
                          <div className="mb-2 -mx-1 -mt-1">
                            <img
                              src={msg.mediaUrl}
                              alt="WhatsApp Media"
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(msg.mediaUrl, '_blank')}
                            />
                          </div>
                        )}
                        <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 pl-1">{msg.timestamp}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 max-w-[80%] md:max-w-[70%] self-end flex-row-reverse animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col gap-1 items-end">
                      <div className="bg-primary text-white p-4 rounded-2xl rounded-br-sm shadow-md shadow-primary/20">
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      {msg.type === 'file' && (
                        <div className="bg-white dark:bg-[#1f2937] p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 w-64 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{msg.fileName}</p>
                            <p className="text-[10px] text-slate-500">{msg.fileSize} • PDF</p>
                          </div>
                          <span className="material-symbols-outlined text-slate-400">download</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 pr-1">
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>

        {/* Composer */}
        <footer className="p-6 pt-2 bg-[#f6f6f8] dark:bg-black">
          <div className="flex flex-col gap-2">
            {/* Suggestion Pop-up - Now relative/static above the input to avoid overlap */}
            {suggestions.length > 0 && (
              <div className="bg-white dark:bg-[#1f2937] border border-indigo-100 dark:border-indigo-900 rounded-xl shadow-md p-4 mb-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <span className="material-symbols-outlined text-[18px]">colors_spark</span>
                    <span className="text-xs font-bold uppercase tracking-wide">{t('inbox.suggestedReplies')}</span>
                  </div>
                  <button onClick={() => refreshSuggestions(activeContact.id)} className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span className="text-[10px] font-medium uppercase">{t('inbox.regenerate')}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(sugg.text)}
                      className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all text-left max-w-xs truncate"
                      title={sugg.text}
                    >
                      <span className="font-bold block text-[9px] mb-0.5 opacity-60 uppercase">{sugg.tone}</span>
                      {sugg.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 flex flex-col gap-2 relative">
              <div className="flex items-end gap-2 p-1">
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors shrink-0">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full max-h-32 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none py-2.5 text-sm"
                  placeholder={t('inbox.typeMessage')}
                  rows={1}
                ></textarea>
                <div className="flex items-center gap-2 shrink-0 pb-1">
                  <button
                    onClick={handleAiAssist}
                    disabled={isRefinedLoading || !inputText.trim()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${isRefinedLoading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isRefinedLoading ? 'animate-spin' : ''}`}>
                      {isRefinedLoading ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    {isRefinedLoading ? t('inbox.thinking') : t('inbox.aiAssist')}
                  </button>
                  <button
                    onClick={handleSend}
                    className="w-9 h-9 rounded-lg bg-primary hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-primary/20 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* AI Drawer (Right Side) */}
      {isAiDrawerOpen && (
        <div className="w-[400px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151c2c] h-full shadow-xl z-20 hidden md:block">
          <AiDrawer onClose={() => setIsAiDrawerOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default Inbox;
