import React from 'react';
import { useAppState } from '../StateContext';

const ContactProfile: React.FC = () => {
  const { activeContactId, setActiveContactId, contacts, messages } = useAppState();

  const contact = contacts.find(c => c.id === activeContactId);
  const contactMessages = activeContactId ? (messages[activeContactId] || []) : [];

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-[64px] mb-2 opacity-20">person</span>
        <p className="text-lg font-bold opacity-40">Select a contact to view profile</p>
        <button
          onClick={() => setActiveContactId(null)}
          className="mt-4 text-primary font-bold hover:underline"
        >
          View All Contacts
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-8 flex flex-col gap-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setActiveContactId(null)}
          className="text-slate-500 hover:text-primary text-sm font-medium transition-colors"
        >
          Contacts
        </button>
        <span className="material-symbols-outlined text-slate-400 text-[16px]">chevron_right</span>
        <span className="text-slate-900 dark:text-white text-sm font-medium">{contact.name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex gap-5">
            <div className="relative">
              <img className="size-24 rounded-full object-cover border-4 border-white dark:border-[#1e2330] shadow-md" src={contact.avatar} alt={contact.name} />
              <div className={`absolute bottom-1 right-1 size-6 rounded-full border-2 border-white dark:border-[#1e2330] flex items-center justify-center ${contact.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}>
                <span className="material-symbols-outlined text-white text-[14px]">{contact.status === 'online' ? 'chat' : 'person'}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{contact.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Verified Contact
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-1">{contact.role} at {contact.company}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>San Francisco, CA (PST)</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 mx-1"></span>
                <span>Active</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center md:self-center">
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[20px]">chat</span>
              WhatsApp
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[20px]">call</span>
              Call
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[20px]">mail</span>
              Email
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Deal
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Insight */}
          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-indigo-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span className="text-sm font-bold uppercase tracking-wider">Pitaya AI Insight</span>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">High Intent</span>
            </div>
            <p className="text-slate-900 dark:text-gray-200 text-sm leading-relaxed mb-3">
              {contact.name} is showing high interest in the enterprise rollout. Sentiment analysis suggests positive momentum after the last pricing discussion.
            </p>
            <div className="flex items-start gap-2 bg-white/60 dark:bg-black/20 p-2 rounded text-xs text-slate-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-[16px] text-indigo-500 mt-0.5">lightbulb</span>
              <span>Suggested: Follow up regarding the technical migration specs discussed earlier.</span>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-slate-900 dark:text-white font-bold text-base">Details</h3>
              <button className="text-primary text-sm font-medium hover:underline">Edit</button>
            </div>
            <div className="p-5 flex flex-col gap-5">
              <div className="grid gap-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact Info</p>
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-slate-900 dark:text-gray-200">+1 (555) 123-4567</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer">content_copy</span>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-slate-900 dark:text-gray-200">{contact.name.toLowerCase().replace(' ', '.')}@{contact.company.toLowerCase()}.com</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer">content_copy</span>
                </div>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {contact.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-700 px-2 h-6 text-xs font-medium text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[14px] text-amber-500">star</span> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Tabs */}
          <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-10 transition-shadow">
            <div className="flex px-2 md:px-6 overflow-x-auto no-scrollbar">
              {['Overview', 'Notes', 'Tasks', 'Files'].map((tab, idx) => (
                <button key={tab} className={`flex items-center justify-center border-b-[3px] px-4 py-4 min-w-fit transition-colors ${idx === 0 ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                  <span className="text-sm font-bold">{tab}</span>
                  {tab === 'Tasks' && <span className="ml-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative space-y-8 pb-10 pl-6">
            <div className="absolute left-[29px] top-4 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

            {contactMessages.slice(-3).map((msg, idx) => (
              <div key={msg.id} className="relative pl-8 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className={`absolute left-0 top-1 size-6 rounded-full bg-white dark:bg-[#1e2330] border-2 z-10 flex items-center justify-center ${msg.sender === 'me' ? 'border-primary' : 'border-[#25D366]'}`}>
                  <span className={`material-symbols-outlined text-[14px] ${msg.sender === 'me' ? 'text-primary' : 'text-[#25D366]'}`}>
                    {msg.sender === 'me' ? 'send' : 'chat'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {msg.sender === 'me' ? 'Your Message' : 'WhatsApp Interaction'}
                    </span>
                    <span className="text-xs text-slate-500">{msg.timestamp}</span>
                  </div>
                  <div className={`p-4 rounded-lg border shadow-sm mt-1 max-w-lg ${msg.sender === 'me'
                      ? 'bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800'
                      : 'bg-[#e7fceb] dark:bg-[#0c2914] border-[#c4eecb] dark:border-[#144520]'
                    }`}>
                    <p className={`text-sm leading-relaxed ${msg.sender === 'me' ? 'text-slate-900 dark:text-gray-300' : 'text-[#0b3d17] dark:text-[#a0e6b0]'
                      }`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {contactMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                <p className="text-sm font-medium">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactProfile;
