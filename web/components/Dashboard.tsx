import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppState } from '../StateContext';

const Dashboard: React.FC = () => {
  const { deals, tasks, contacts, handoverAlerts, t, user, setActiveContactId, setActiveItem, stages, language, aiStatus } = useAppState();

  const pipelineValue = deals.reduce((sum, deal) => sum + Number(deal.value), 0);
  const formattedPipelineValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(pipelineValue);

  // Active chats: Unread conversations or active handover alerts
  const activeChatsCount = contacts.filter(c => c.unread).length;

  const chartData = stages.map(stage => ({
    name: stage.name,
    value: deals.filter(d => d.stage === stage.name).length
  }));

  const [activeTab, setActiveTab] = React.useState<'alerts' | 'tasks'>('alerts');

  const handleAlertClick = (target: string) => {
    if (target === 'settings') {
      setActiveItem('settings');
    } else {
      setActiveContactId(target);
      setActiveItem('inbox');
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Completed').slice(0, 5);

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
        {aiStatus?.isLimited && (
          <div className="flex-1 max-w-[500px] flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-4 py-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30 animate-pulse">
            <span className="material-symbols-outlined text-amber-500">warning</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider">{language === 'es' ? 'Límite de IA Alcanzado' : 'AI Rate Limit Reached'}</span>
              <span className="text-[11px] opacity-90">
                {language === 'es'
                  ? `Se superó el límite de 15 RPM. El servicio se restablecerá en ${aiStatus.remainingRefresh}s.`
                  : `15 RPM limit exceeded. Service will resume in ${aiStatus.remainingRefresh}s.`}
              </span>
            </div>
          </div>
        )}
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
            <div className="justify-between items-end mb-6 hidden sm:flex">
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

        {/* Priority List Column with Tabs */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] shadow-sm">
          <div className="px-4 pt-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'alerts' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {language === 'es' ? 'Alertas' : 'Alerts'}
                {activeTab === 'alerts' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></span>}
                {handoverAlerts.length > 0 && activeTab !== 'alerts' && (
                  <span className="absolute top-0 -right-2 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'tasks' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {language === 'es' ? 'Mis Tareas' : 'My Tasks'}
                {activeTab === 'tasks' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></span>}
                {pendingTasks.length > 0 && activeTab !== 'tasks' && (
                  <span className="absolute top-0 -right-2 h-2 w-2 rounded-full bg-orange-500"></span>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col p-2 gap-2 overflow-y-auto max-h-[500px]">
            {activeTab === 'alerts' ? (
              handoverAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">check_circle</span>
                  <p className="text-sm">{t('handover.noAlerts')}</p>
                </div>
              ) : (
                handoverAlerts.map((alert) => {
                  const isSystemError = alert.reason?.startsWith('ERROR SISTEMA:');

                  return (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(isSystemError ? 'settings' : alert.conversationId)}
                      className={`group flex flex-col gap-3 p-3 rounded-lg transition-colors cursor-pointer border-l-2 border-transparent ${isSystemError
                        ? 'hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:border-amber-500 bg-amber-50/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-red-500'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${isSystemError ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-200'
                              }`}>
                              {isSystemError ? (
                                <span className="material-symbols-outlined">dns</span>
                              ) : (alert.conversation?.contact?.avatar || alert.conversation?.lead?.avatar ? (
                                <img
                                  className="w-full h-full object-cover"
                                  src={alert.conversation?.contact?.avatar || alert.conversation?.lead?.avatar}
                                  alt="Avatar"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-slate-400">person</span>
                              ))}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1a202c] rounded-full p-0.5">
                              <span className={`flex items-center justify-center rounded-full w-4 h-4 text-white ${isSystemError ? 'bg-amber-500' : 'bg-red-500'
                                }`}>
                                <span className="material-symbols-outlined text-[10px]">
                                  {isSystemError ? 'priority_high' : 'warning'}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white text-sm font-semibold truncate max-w-[120px]">
                              {isSystemError ? (language === 'es' ? 'Error del Sistema' : 'System Error') : (alert.conversation?.contact?.name || alert.conversation?.lead?.name || 'Customer')}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                              {isSystemError ? (language === 'es' ? 'Configuración' : 'Configuration') : t('handover.alerts')}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="pl-[52px]">
                        <p className={`text-[11px] p-2 rounded mb-2 italic border line-clamp-2 ${isSystemError
                          ? 'text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                          : 'text-slate-800 dark:text-slate-300 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                          }`}>
                          "{alert.reason}"
                        </p>
                        <div className="flex gap-2">
                          <button className={`flex-1 text-white text-[11px] font-medium py-1.5 px-3 rounded transition flex items-center justify-center gap-1 ${isSystemError ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-blue-700'
                            }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {isSystemError ? 'settings' : 'chat'}
                            </span>
                            {isSystemError ? (language === 'es' ? 'Corregir Configuración' : 'Fix Settings') : t('dashboard.reply')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-20">assignment_turned_in</span>
                  <p className="text-sm">{language === 'es' ? 'No tienes tareas pendientes' : 'No pending tasks'}</p>
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setActiveItem('tasks')}
                    className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2 border-transparent hover:border-primary"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-8 h-8 rounded-full object-cover"
                          src={task.contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.contactName)}&background=random`}
                          alt=""
                        />
                        <div className="overflow-hidden">
                          <p className="text-slate-900 dark:text-white text-sm font-semibold truncate">{task.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px]">{task.contactName}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${task.priority === 'High' ? 'bg-red-100 text-red-700' :
                        task.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                        {task.priority === 'High' ? (language === 'es' ? 'Alta' : 'High') :
                          task.priority === 'Medium' ? (language === 'es' ? 'Media' : 'Medium') :
                            (language === 'es' ? 'Baja' : 'Low')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 pl-[44px]">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {task.dueDate}
                      </span>
                      <span className={`text-[10px] font-bold ${task.status === 'Breach' ? 'text-red-500' : 'text-slate-400'
                        }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              )
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
