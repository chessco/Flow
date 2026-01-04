import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppState } from '../StateContext';

const Dashboard: React.FC = () => {
  const { deals, tasks, contacts, handoverAlerts, t, user, setActiveContactId, setActiveItem, stages } = useAppState();

  const pipelineValue = deals.reduce((sum, deal) => sum + Number(deal.value), 0);
  const formattedPipelineValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(pipelineValue);

  // Active chats: Unread conversations or active handover alerts
  const activeChatsCount = contacts.filter(c => c.unread).length;

  const chartData = stages.map(stage => ({
    name: stage.name,
    value: deals.filter(d => d.stage === stage.name).length
  }));

  const handleAlertClick = (conversationId: string) => {
    setActiveContactId(conversationId);
    setActiveItem('inbox');
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative scroll-smooth bg-background-light dark:bg-background-dark p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight">
            {t('dashboard.greeting').replace('{name}', user?.name || 'Admin')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">{t('dashboard.operationalFlow')}</p>
        </div>
        <button
          onClick={() => setActiveItem('kanban')}
          className="flex cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
          <span className="material-symbols-outlined text-[20px] mr-2">add_task</span>
          {t('dashboard.addDeal')}
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: t('dashboard.activeChats'), value: activeChatsCount.toString(), change: '+0%', icon: 'trending_up', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: t('dashboard.aiReplyTime'), value: '2m 14s', change: '-5%', icon: 'bolt', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: t('dashboard.pipelineOverview'), value: formattedPipelineValue, change: '+8%', icon: 'attach_money', color: 'text-primary', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: t('navigation.tasks'), value: tasks.length.toString(), change: t('dashboard.dueToday'), icon: 'priority_high', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', changeColor: 'text-orange-600' }
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
            <h3 className="text-slate-900 dark:text-white text-lg font-bold">{t('dashboard.pipelineOverview')}</h3>
            <button
              onClick={() => setActiveItem('kanban')}
              className="text-sm text-primary font-medium hover:underline">{t('dashboard.viewKanban')}</button>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t('dashboard.totalActiveDeals')}</p>
                <p className="text-slate-900 dark:text-white text-3xl font-bold">{deals.length}</p>
              </div>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Ganado' || entry.name === 'Won' ? '#22c55e' : '#135bec'} />
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
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">{t('dashboard.priorityAttention')}</h3>
              {handoverAlerts.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </div>
          </div>
          <div className="flex flex-col p-2 gap-2 overflow-y-auto max-h-[500px]">
            {handoverAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">check_circle</span>
                <p className="text-sm">{t('handover.noAlerts')}</p>
              </div>
            ) : (
              handoverAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert.conversationId)}
                  className="group flex flex-col gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2 border-transparent hover:border-red-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                          {alert.conversation?.contact?.avatar || alert.conversation?.lead?.avatar ? (
                            <img
                              className="w-full h-full object-cover"
                              src={alert.conversation?.contact?.avatar || alert.conversation?.lead?.avatar}
                              alt="Avatar"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400">person</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1a202c] rounded-full p-0.5">
                          <span className="flex items-center justify-center bg-red-500 text-white rounded-full w-4 h-4">
                            <span className="material-symbols-outlined text-[10px]">warning</span>
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm font-semibold truncate max-w-[120px]">
                          {alert.conversation?.contact?.name || alert.conversation?.lead?.name || 'Customer'}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">{t('handover.alerts')}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="pl-[52px]">
                    <p className="text-[11px] text-slate-800 dark:text-slate-300 bg-red-50/50 dark:bg-red-900/10 p-2 rounded mb-2 italic border border-red-100 dark:border-red-900/20 line-clamp-2">
                      "{alert.reason}"
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-primary text-white text-[11px] font-medium py-1.5 px-3 rounded hover:bg-blue-700 transition flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        {t('dashboard.reply')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
            <button
              onClick={() => setActiveItem('inbox')}
              className="w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:text-primary font-medium py-2">
              {t('dashboard.viewAllActivity')}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
