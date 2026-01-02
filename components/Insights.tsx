import React from 'react';

const Insights: React.FC = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Flow Insights</h1>
            <p className="text-slate-500 mt-1 text-sm">Real-time operational metrics for your WhatsApp sales pipeline.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm">
              <span className="material-symbols-outlined text-[20px] mr-2">download</span> Export Report
            </button>
            <button className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 shadow-sm">
              <span className="material-symbols-outlined text-[20px] mr-2">add</span> New Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm flex flex-wrap gap-2 items-center">
           <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-200 pr-4">
              <span className="material-symbols-outlined text-slate-400">filter_alt</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filters</span>
           </div>
           <button className="flex h-9 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200">
              <span className="material-symbols-outlined text-[18px] text-slate-500">calendar_today</span> Last 30 Days
           </button>
           <button className="flex h-9 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200">
              <span className="material-symbols-outlined text-[18px] text-slate-500">group</span> All Agents
           </button>
        </div>

        {/* AI Insight */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-white dark:from-primary/10 dark:to-slate-900 p-4 shadow-sm">
           <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 items-start">
                 <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">AI Insight Detected <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Attention</span></h3>
                    <p className="text-sm text-slate-600 mt-1">Anomalous drop in closing rate on Tuesdays detected (-15% vs avg).</p>
                 </div>
              </div>
              <button className="flex items-center gap-2 text-sm font-medium text-primary bg-white/50 px-4 py-2 rounded-lg hover:bg-white border border-transparent hover:border-primary/20">View Details <span className="material-symbols-outlined text-lg">arrow_forward</span></button>
           </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { icon: 'forum', label: 'Active Conversations', value: '1,240', trend: '12%', up: true, color: 'blue' },
             { icon: 'timer', label: 'Avg. Response Time', value: '4m 32s', trend: '+30s', up: false, color: 'purple' },
             { icon: 'attach_money', label: 'Revenue Pipeline', value: '$450k', trend: '5.4%', up: true, color: 'emerald' },
             { icon: 'smart_toy', label: 'AI Automation Rate', value: '35%', trend: 'Target: 40%', up: null, color: 'orange' }
           ].map((kpi, idx) => (
             <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                   <div className={`p-2 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-lg`}><span className="material-symbols-outlined">{kpi.icon}</span></div>
                   {kpi.up !== null && <span className={`flex items-center text-xs font-semibold ${kpi.up ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-full`}>{kpi.trend}</span>}
                </div>
                <div>
                   <p className="text-slate-500 text-sm font-medium">{kpi.label}</p>
                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</h3>
                </div>
             </div>
           ))}
        </div>

        {/* Chart (Visual Placeholder) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
           <div className="h-64 flex items-end justify-between gap-2 px-4 pb-2 border-b border-l border-slate-200">
              {[30, 45, 25, 60, 40, 75, 20, 50, 65, 35, 80, 55, 40, 70].map((h, i) => (
                 <div key={i} className="w-full bg-primary/20 rounded-t-sm relative group hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }}>
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-sm" style={{ height: `${h * 0.6}%` }}></div>
                 </div>
              ))}
           </div>
           <div className="flex justify-between text-xs text-slate-400 mt-2 px-4">
              <span>Nov 1</span><span>Nov 14</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;