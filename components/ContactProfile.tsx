import React from 'react';

const ContactProfile: React.FC = () => {
  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-8 flex flex-col gap-6 overflow-y-auto">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 items-center">
        <a className="text-slate-500 hover:text-slate-900 text-sm font-medium" href="#">Contacts</a>
        <span className="material-symbols-outlined text-slate-400 text-[16px]">chevron_right</span>
        <span className="text-slate-900 dark:text-white text-sm font-medium">Sarah Jenkins</span>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex gap-5">
            <div className="relative">
              <img className="size-24 rounded-full object-cover border-4 border-white dark:border-[#1e2330] shadow-md" src="https://i.pravatar.cc/150?u=sarahjenkins" alt="Sarah Jenkins" />
              <div className="absolute bottom-1 right-1 size-6 bg-green-500 rounded-full border-2 border-white dark:border-[#1e2330] flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[14px]">chat</span>
              </div>
            </div>
            <div className="flex flex-col justify-center pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">Sarah Jenkins</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Verified Contact
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-1">VP of Operations at TechFlow</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>San Francisco, CA (PST)</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 mx-1"></span>
                <span>First contact: Oct 12, 2023</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center md:self-center">
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[20px]">chat</span>
              WhatsApp
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[20px]">call</span>
              Call
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 transition-colors">
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
              Sarah is asking about <span className="font-semibold">enterprise pricing</span> tiers. She mentioned a budget approval meeting scheduled for next Tuesday. Sentiment is strongly positive.
            </p>
            <div className="flex items-start gap-2 bg-white/60 dark:bg-black/20 p-2 rounded text-xs text-slate-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-[16px] text-indigo-500 mt-0.5">lightbulb</span>
              <span>Suggested: Send the "Q4 Enterprise Deck" PDF before Friday.</span>
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
                  <span className="text-sm text-slate-900 dark:text-gray-200">sarah.j@techflow.com</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 opacity-0 group-hover:opacity-100 cursor-pointer">content_copy</span>
                </div>
              </div>
              <div className="grid gap-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-700 px-2 h-6 text-xs font-medium text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-[14px] text-amber-500">star</span> VIP
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-700 px-2 h-6 text-xs font-medium text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-[14px] text-red-500">local_fire_department</span> Hot Lead
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Tabs */}
          <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-[72px] z-40">
            <div className="flex px-2 md:px-6 overflow-x-auto no-scrollbar">
              {['Overview', 'Notes', 'Tasks', 'Files'].map((tab, idx) => (
                <button key={tab} className={`flex items-center justify-center border-b-[3px] px-4 py-4 min-w-fit transition-colors ${idx === 0 ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                  <span className="text-sm font-bold">{tab}</span>
                  {tab === 'Tasks' && <span className="ml-2 bg-slate-100 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative space-y-8 pb-10 pl-6">
            <div className="absolute left-[29px] top-4 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
            
            {/* Item 1 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-1 size-6 rounded-full bg-white dark:bg-[#1e2330] border-2 border-purple-500 z-10 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500 text-[14px]">call</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Call with Sarah</span>
                  <span className="text-xs text-slate-500">logged by You • 2 hours ago</span>
                </div>
                <div className="bg-white dark:bg-[#1e2330] p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mt-1">
                  <p className="text-sm text-slate-900 dark:text-gray-300 leading-relaxed">
                    Discussed the implementation timeline. She is concerned about the data migration process. I assured her our team handles it fully. Need to send the technical specs doc.
                  </p>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-1 size-6 rounded-full bg-white dark:bg-[#1e2330] border-2 border-[#25D366] z-10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#25D366] text-[14px]">chat</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp Interaction</span>
                  <span className="text-xs text-slate-500">Yesterday at 4:30 PM</span>
                </div>
                <div className="bg-[#e7fceb] dark:bg-[#0c2914] p-3 rounded-lg border border-[#c4eecb] dark:border-[#144520] shadow-sm mt-1 w-fit">
                  <p className="text-sm text-[#0b3d17] dark:text-[#a0e6b0]">"Thanks for the update. Can we schedule a demo for my CTO next week?"</p>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-1 size-6 rounded-full bg-white dark:bg-[#1e2330] border-2 border-orange-500 z-10 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500 text-[14px]">check_box</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Task Created</span>
                  <span className="text-xs text-slate-500">by System AI • Yesterday at 4:32 PM</span>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-[#1e2330] p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mt-1">
                  <div className="size-5 rounded border border-gray-300 flex items-center justify-center"></div>
                  <span className="text-sm text-slate-900 dark:text-white">Schedule CTO Demo</span>
                  <span className="ml-auto text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">High Priority</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactProfile;