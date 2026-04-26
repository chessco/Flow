import React from 'react';
import { useAppState } from '../StateContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Insights: React.FC = () => {
   const { deals, contacts, t, language, revenueAnalysis, fetchRevenueAnalysis } = useAppState();
   const [showDetails, setShowDetails] = React.useState(false);

   React.useEffect(() => {
      fetchRevenueAnalysis();
   }, []);

   const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
   const activeDeals = deals.filter(d => d.stage !== 'Ganado' && d.stage !== 'Perdido').length;

   const chartData = [
      { name: language === 'es' ? 'Lun' : 'Mon', value: 4000 },
      { name: language === 'es' ? 'Mar' : 'Tue', value: 3000 },
      { name: language === 'es' ? 'Mié' : 'Wed', value: 5000 },
      { name: language === 'es' ? 'Jue' : 'Thu', value: 2780 },
      { name: language === 'es' ? 'Vie' : 'Fri', value: 1890 },
      { name: language === 'es' ? 'Sáb' : 'Sat', value: 2390 },
      { name: language === 'es' ? 'Dom' : 'Sun', value: 3490 },
   ];

   const kpis = [
      { icon: 'forum', label: t('insights.kpis.contacts'), value: contacts.length.toString(), trend: '+5%', up: true, color: 'blue' },
      { icon: 'view_kanban', label: t('insights.kpis.deals'), value: activeDeals.toString(), trend: '12%', up: true, color: 'purple' },
      { icon: 'attach_money', label: t('insights.kpis.pipeline'), value: new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalPipeline), trend: '5.4%', up: true, color: 'emerald' },
      { icon: 'smart_toy', label: t('insights.kpis.automation'), value: '35%', trend: `${language === 'es' ? 'Objetivo' : 'Target'}: 40%`, up: null, color: 'orange' }
   ];

   const getColorClass = (color: string) => {
      const map: Record<string, string> = {
         blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
         purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
         emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
         orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
      };
      return map[color] || 'bg-slate-50 text-slate-600';
   };

   return (
      <div className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark p-8 animate-in fade-in duration-500">
         <div className="max-w-[1400px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('insights.title')}</h1>
                  <p className="text-slate-500 mt-1 text-sm">{t('insights.subtitle')}</p>
               </div>
               <div className="flex items-center gap-3">
                  <button
                     onClick={() => fetchRevenueAnalysis(true)}
                     className="flex items-center justify-center h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 transition shadow-sm">
                     <span className="material-symbols-outlined text-[20px] mr-2">refresh</span> {language === 'es' ? 'Refrescar IA' : 'Refresh AI'}
                  </button>
                  <button className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 shadow-lg active:scale-95 transition-all">
                     <span className="material-symbols-outlined text-[20px] mr-2">download</span> {t('insights.export')}
                  </button>
               </div>
            </div>

            {/* AI Insight Section */}
            <div className={`rounded-xl border transition-all duration-300 ${revenueAnalysis?.noCredits ? 'border-amber-200 bg-amber-50/30' : 'border-primary/20 bg-gradient-to-r from-primary/5 to-white dark:from-primary/10 dark:to-slate-900'} p-5 shadow-sm`}>
               <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                     <div className="flex gap-4 items-start">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${revenueAnalysis?.noCredits ? 'bg-amber-100/50' : 'bg-primary/10'}`}>
                           <span className={`material-symbols-outlined ${revenueAnalysis?.noCredits ? 'text-amber-600' : 'text-primary'}`}>
                              {revenueAnalysis?.noCredits ? 'Report' : 'auto_awesome'}
                           </span>
                        </div>
                        <div>
                           <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('insights.aiAnalysis.title')}</h3>
                              {revenueAnalysis && (
                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${revenueAnalysis.momentum === 'ALTO' || revenueAnalysis.momentum === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                                       revenueAnalysis.momentum === 'MEDIO' || revenueAnalysis.momentum === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                          'bg-amber-100 text-amber-700'
                                    }`}>
                                    {revenueAnalysis.momentum}
                                 </span>
                              )}
                           </div>
                           <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                              {!revenueAnalysis ? (
                                 <span className="inline-block h-4 w-64 bg-slate-200 animate-pulse rounded"></span>
                              ) : (
                                 revenueAnalysis.summary
                              )}
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => setShowDetails(!showDetails)}
                        disabled={!revenueAnalysis || revenueAnalysis.noCredits}
                        className="flex items-center gap-2 text-sm font-bold text-primary bg-white dark:bg-white/5 border border-primary/20 px-5 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {showDetails ? (language === 'es' ? 'Cerrar' : 'Close') : t('insights.aiAnalysis.viewFull')}
                        <span className={`material-symbols-outlined text-lg transition-transform ${showDetails ? 'rotate-90' : ''}`}>arrow_forward</span>
                     </button>
                  </div>

                  {showDetails && revenueAnalysis?.details && (
                     <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-3 font-medium">
                              <h4 className="text-xs uppercase text-slate-400 font-bold tracking-widest">{language === 'es' ? 'Análisis Detallado' : 'Detailed Analysis'}</h4>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-4 border-primary/30 pl-4 py-1">
                                 {revenueAnalysis.details}
                              </p>
                           </div>
                           {revenueAnalysis.predictedRevenue && (
                              <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 flex flex-col justify-center">
                                 <p className="text-xs text-primary font-bold uppercase tracking-wider">{language === 'es' ? 'Proyección Próximo Mes' : 'Next Month Projection'}</p>
                                 <p className="text-2xl font-black text-primary mt-1">{revenueAnalysis.predictedRevenue}</p>
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {kpis.map((kpi, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#1e2330] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${getColorClass(kpi.color)}`}><span className="material-symbols-outlined">{kpi.icon}</span></div>
                        {kpi.up !== null && (
                           <span className={`flex items-center gap-0.5 text-[11px] font-bold ${kpi.up ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'} px-2 py-0.5 rounded-full border ${kpi.up ? 'border-emerald-100 dark:border-emerald-800' : 'border-rose-100 dark:border-rose-800'}`}>
                              <span className="material-symbols-outlined text-[14px]">{kpi.up ? 'trending_up' : 'trending_down'}</span>
                              {kpi.trend}
                           </span>
                        )}
                     </div>
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{kpi.label}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{kpi.value}</h3>
                     </div>
                  </div>
               ))}
            </div>

            {/* Premium Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
               <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('insights.charts.revenue')}</h3>
                        <p className="text-sm text-slate-500">{t('insights.charts.revenueSub')}</p>
                     </div>
                     <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                           <span className="size-2 rounded-full bg-primary"></span>
                           <span className="text-xs font-medium text-slate-500">{t('insights.charts.legend')}</span>
                        </div>
                     </div>
                  </div>
                  <div className="h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                           <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#135bec" stopOpacity={0.1} />
                                 <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                           <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#94a3b8', fontSize: 12 }}
                              dy={10}
                           />
                           <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#94a3b8', fontSize: 12 }}
                              tickFormatter={(val) => `$${val / 1000}k`}
                           />
                           <Tooltip
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                           />
                           <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#135bec"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorValue)"
                              animationDuration={1500}
                           />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Insights;
