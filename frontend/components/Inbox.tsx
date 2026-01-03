import React, { useState, useRef, useEffect } from 'react';
import AiDrawer from './AiDrawer';
import { useAppState } from '../StateContext';

const Inbox: React.FC = () => {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const { contacts, messages, activeContactId, setActiveContactId, sendMessage } = useAppState();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0];
  const activeMessages = messages[activeContact?.id || ''] || [];

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Inbox List Panel */}
      <aside className="w-[380px] h-full flex flex-col bg-white dark:bg-[#151c2c] border-r border-slate-200 dark:border-slate-800 shrink-0 z-10 hidden md:flex">
        <div className="px-5 pt-6 pb-2">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inbox <span className="text-slate-400 font-medium text-lg ml-1">{contacts.length}</span></h1>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          <div className="relative mb-4 group">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
            <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 dark:text-white" placeholder="Search conversations..." type="text" />
          </div>
          <div className="flex gap-6 border-b border-slate-100 dark:border-slate-800">
            <button className="pb-3 border-b-2 border-primary text-slate-900 dark:text-white font-semibold text-sm">All</button>
            <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium text-sm">Unread</button>
            <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium text-sm flex items-center gap-1">
              AI <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
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
                    <img className="size-12 rounded-full object-cover" src={contact.avatar} alt={contact.name} />
                    {contact.status === 'online' && (
                      <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-[#151c2c] rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate pr-2">{contact.name}</h3>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">10:42 AM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">done_all</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                        {messages[contact.id]?.[messages[contact.id].length - 1]?.text || 'No messages yet'}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {contact.tags.map(tag => (
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
              <img className="size-10 rounded-full object-cover" src={activeContact.avatar} alt={activeContact.name} />
              {activeContact.status === 'online' && (
                <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-[#151c2c] rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{activeContact.name}</h2>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium capitalize">{activeContact.status}</p>
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
              AI Copilot
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
              <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.sender === 'them' ? (
                  <div className="flex gap-3 max-w-[80%] md:max-w-[70%] animate-in slide-in-from-left-4 duration-300">
                    <img className="size-8 rounded-full object-cover shrink-0 self-end mb-1 shadow-sm" src={activeContact.avatar} alt={activeContact.name} />
                    <div className="flex flex-col gap-1">
                      <div className="bg-white dark:bg-[#1f2937] p-4 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700">
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
                          <div className="size-10 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg flex items-center justify-center shrink-0">
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
          <div className="bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 flex flex-col gap-2 relative">

            {/* Suggestion Pop-up */}
            {activeMessages.length > 0 && activeMessages[activeMessages.length - 1].sender === 'them' && (
              <div className="absolute bottom-full left-0 mb-3 ml-2 bg-white dark:bg-[#1f2937] border border-indigo-100 dark:border-indigo-900 rounded-lg shadow-lg p-3 w-80 hidden md:block animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <span className="material-symbols-outlined text-[16px]">colors_spark</span>
                    <span className="text-xs font-bold uppercase tracking-wide">Suggested Reply</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-2">"Would you like to schedule a call to walk through the contract?"</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputText("Would you like to schedule a call to walk through the contract?")}
                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded hover:bg-indigo-100 transition-colors"
                  >
                    Insert
                  </button>
                  <button className="px-2 py-1 text-slate-500 text-xs font-medium hover:text-slate-700">Regenerate</button>
                </div>
              </div>
            )}

            <div className="flex items-end gap-2 p-1">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors shrink-0">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full max-h-32 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none py-2.5 text-sm"
                placeholder="Type a message or use / for AI templates..."
                rows={1}
              ></textarea>
              <div className="flex items-center gap-2 shrink-0 pb-1">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  AI Assist
                </button>
                <button
                  onClick={handleSend}
                  className="size-9 rounded-lg bg-primary hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* AI Drawer (Right Side) */}
      {isAiDrawerOpen && (
        <div className="w-[400px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151c2c] h-full shadow-xl z-20 hidden lg:block">
          <AiDrawer onClose={() => setIsAiDrawerOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default Inbox;
