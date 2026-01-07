import React from 'react';
import { useAppState } from '../StateContext';
import { Deal } from '../types';

const Kanban: React.FC = () => {
  const { deals, updateDealStage, stages, user, deleteCard, updateCard } = useAppState();
  const [editingDeal, setEditingDeal] = React.useState<Deal | null>(null);
  const [editForm, setEditForm] = React.useState({ title: '', value: '' });

  const handleEditClick = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeal(deal);
    setEditForm({ title: deal.title, value: deal.value.toString() });
  };

  const handleUpdate = async () => {
    if (!editingDeal) return;
    await updateCard(editingDeal.id, {
      title: editForm.title,
      value: parseFloat(editForm.value) || 0
    });
    setEditingDeal(null);
  };

  const stageColors: Record<string, string> = {
    'Nuevo Lead (Meta)': 'bg-blue-500',
    'En Seguimiento / Info Enviada': 'bg-orange-400',
    'Calificado / Interesado': 'bg-yellow-400',
    'Esperando Transferencia': 'bg-primary',
    'Pago por Verificar': 'bg-indigo-500',
    'Venta Cerrada / Completado': 'bg-green-500',
  };

  const columns = stages.map(stage => ({
    title: stage.name,
    color: stageColors[stage.name] || 'bg-slate-400'
  }));

  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const getColumnValue = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    const total = stageDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(total);
  };

  const moveDeal = (dealId: string, currentStage: string) => {
    const currentIndex = columns.findIndex(c => c.title === currentStage);
    if (currentIndex < columns.length - 1) {
      updateDealStage(dealId, columns[currentIndex + 1].title);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e2330] px-8 py-3 shrink-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-primary text-[24px]">view_kanban</span>
            <h2 className="text-lg font-bold leading-tight">Flow Board</h2>
          </div>
          <div className="hidden md:flex flex-col min-w-[240px] h-10">
            <div className="flex w-full h-full items-stretch rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent focus-within:border-primary/50 transition-colors">
              <div className="text-slate-400 flex items-center justify-center pl-4">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input className="flex w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 px-3 focus:ring-0" placeholder="Search deals..." />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">WhatsApp Synced</span>
          </div>
          <button className="flex items-center justify-center rounded-lg w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 px-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#1e2330]/50 backdrop-blur-sm shrink-0 overflow-x-auto">
        <button className="flex h-8 items-center gap-2 rounded-lg bg-primary/10 border border-transparent px-3 text-primary text-sm font-semibold">
          <span className="material-symbols-outlined text-[18px]">group</span>
          All Agents
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </button>
        <button className="flex h-8 items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
          This Month
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-6 items-start w-max">
          {columns.map((col, idx) => {
            const stageDeals = getDealsByStage(col.title);
            return (
              <div key={idx} className="flex flex-col w-[320px] h-full max-h-full shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-slate-900 dark:text-white font-bold text-base">{col.title}</h3>
                    <span className="flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold rounded-full w-6 h-6">{stageDeals.length}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{getColumnValue(col.title)}</span>
                </div>

                <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2 pb-4">
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => moveDeal(deal.id, deal.stage)}
                      className="group flex flex-col gap-3 rounded-xl bg-white dark:bg-[#1e2330] p-4 shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-800 cursor-pointer relative overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${col.color}`}></div>

                      {col.title === 'Nuevo Lead (Meta)' && (
                        <div className="absolute top-0 right-0 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Nuevo
                        </div>
                      )}

                      {(user?.role?.includes('ADMIN')) && (
                        <div className="absolute bottom-2 right-2 flex gap-1 z-20">
                          <button
                            onClick={(e) => handleEditClick(deal, e)}
                            className="p-1 text-slate-300 hover:text-blue-500 transition-colors bg-white/80 dark:bg-slate-800/80 rounded"
                            title="Editar tarjeta"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('¿Deseas eliminar esta tarjeta? No borrará el contacto, solo la oportunidad en el tablero.')) {
                                deleteCard(deal.id);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors bg-white/80 dark:bg-slate-800/80 rounded"
                            title="Borrar tarjeta"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <img
                            className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                            src={deal.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(deal.contactName)}&background=random`}
                            alt={deal.contactName}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{deal.contactName}</span>
                            <span className="text-[10px] text-slate-500">{deal.title}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">{deal.date}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-1 flex-wrap">
                          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.value)}</span>
                        </div>
                        <span className="text-slate-400 hover:text-primary material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl opacity-40">
                      <span className="material-symbols-outlined text-3xl mb-1">inbox</span>
                      <p className="text-xs font-medium">Empty Stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e2330] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Editar Tarjeta</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Título / Oportunidad</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor Venta (USD)</label>
                <input
                  type="number"
                  value={editForm.value}
                  onChange={e => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingDeal(null)}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors shadow-lg shadow-primary/20"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;
