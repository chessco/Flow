import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Lead', value: 18 },
  { name: 'Qualified', value: 12 },
  { name: 'Proposal', value: 8 },
  { name: 'Negotiation', value: 4 },
  { name: 'Closed', value: 3 },
];

const Dashboard: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative scroll-smooth bg-background-light dark:bg-background-dark p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight">Good Morning, Alex</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Here is your operational flow for today.</p>
        </div>
        <button className="flex cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
          <span className="material-symbols-outlined text-[20px] mr-2">add_task</span>
          Add Deal
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Chats', value: '24', change: '+12%', icon: 'trending_up', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Avg. AI Reply Time', value: '2m 14s', change: '-5%', icon: 'bolt', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Pipeline Value', value: '$12,450', change: '+8%', icon: 'attach_money', color: 'text-primary', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Tasks Due', value: '5', change: 'Due today', icon: 'priority_high', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', changeColor: 'text-orange-600' }
        ].map((stat, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
              <span className={`material-symbols-outlined ${stat.color} text-[20px]`}>{stat.icon}</span>
            </div>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{stat.value}</p>
              <span className={`${stat.changeColor || 'text-green-600'} ${stat.bg} px-1.5 rounded text-xs font-medium mb-1`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
        {/* Chart Column */}
        <div className="xl:col-span-2 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] shadow-sm min-h-[400px]">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-slate-900 dark:text-white text-lg font-bold">Pipeline Overview</h3>
            <button className="text-sm text-primary font-medium hover:underline">View Kanban</button>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Active Deals</p>
                <p className="text-slate-900 dark:text-white text-3xl font-bold">45</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className="size-3 rounded-full bg-primary"></span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Current Month</span>
              </div>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Closed' ? '#22c55e' : '#135bec'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Priority List Column */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">Priority Attention</h3>
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
          <div className="flex flex-col p-2 gap-2">
            {/* Item 1 */}
            <div className="group flex flex-col gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2 border-transparent hover:border-primary">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img className="size-10 rounded-full object-cover bg-slate-200" src="https://i.pravatar.cc/150?u=sarah" alt="Sarah" />
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1a202c] rounded-full p-0.5">
                      <span className="flex items-center justify-center bg-[#25D366] text-white rounded-full size-4 text-[10px]">
                        <span className="material-symbols-outlined text-[10px]">call</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white text-sm font-semibold">Sarah Miller</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Stalled • Proposal Sent</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">24h ago</span>
              </div>
              <div className="pl-[52px]">
                <div className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 text-xs px-2 py-1.5 rounded inline-flex items-center gap-1 mb-2">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  No reply to proposal
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-xs font-medium py-1.5 px-3 rounded hover:bg-slate-50 dark:hover:bg-slate-600 transition">Follow Up</button>
                  <button className="flex-1 bg-primary text-white text-xs font-medium py-1.5 px-3 rounded hover:bg-blue-700 transition">AI Draft</button>
                </div>
              </div>
            </div>
            
            <hr className="border-slate-100 dark:border-slate-800 mx-3" />

            {/* Item 2 */}
            <div className="group flex flex-col gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2 border-transparent hover:border-green-500">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img className="size-10 rounded-full object-cover bg-slate-200" src="https://i.pravatar.cc/150?u=david" alt="David" />
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1a202c] rounded-full p-0.5">
                      <span className="flex items-center justify-center bg-[#25D366] text-white rounded-full size-4 text-[10px]">
                        <span className="material-symbols-outlined text-[10px]">chat</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white text-sm font-semibold">David Chen</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">High Intent • Pricing</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">2m ago</span>
              </div>
              <div className="pl-[52px]">
                <p className="text-xs text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 p-2 rounded mb-2 italic">"Does the enterprise plan include API access for..."</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-primary text-white text-xs font-medium py-1.5 px-3 rounded hover:bg-blue-700 transition flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
            <button className="w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:text-primary font-medium py-2">View All Activity</button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;