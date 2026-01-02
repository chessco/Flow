import React from 'react';

interface AiDrawerProps {
  onClose: () => void;
}

const AiDrawer: React.FC<AiDrawerProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">Flow Assistant</h3>
            <p className="text-[11px] font-medium text-primary">AI Active • Analyzing</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Engagement Risk */}
        <div className="flex gap-3 p-3.5 rounded-xl bg-orange-50 border border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/30 shadow-sm">
          <div className="flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-orange-500 text-[20px]">schedule</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-orange-800 dark:text-orange-200 mb-0.5">Engagement Risk</h4>
            <p className="text-xs text-orange-700/80 dark:text-orange-300/70 leading-relaxed">
              Last response was 3 days ago before today. Consider confirming timeline if no reply by EOD.
            </p>
          </div>
        </div>

        {/* Next Best Action */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-white to-primary/[0.02] dark:from-slate-900 dark:to-slate-900 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">recommend</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Next Best Action</span>
              </div>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">94% Conf.</span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-4">
              Send "Enterprise Pricing & Features" PDF to address budget inquiry.
            </p>
            <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">send</span>
              Send Enterprise Deck
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Context</h4>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-4">
            <ul className="text-[13px] space-y-2 text-slate-600 dark:text-slate-400 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-slate-300">•</span>
                <span>Prospect inquiring about <strong>Enterprise tier</strong> specifics.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-300">•</span>
                <span>Explicitly mentioned budget cap of <strong>$5k/month</strong>.</span>
              </li>
            </ul>
          </div>
          {/* Intents */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-800/30 text-xs font-medium">
              <span>#ClosingPhase</span>
              <span className="material-symbols-outlined text-[14px] text-emerald-600">check</span>
            </div>
            <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800/30 text-xs font-medium">
              <span>#PricingInquiry</span>
              <span className="material-symbols-outlined text-[14px] text-blue-600">check</span>
            </div>
          </div>
        </div>

        {/* Extracted Data */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Data Found</h4>
          <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-[20px]">monetization_on</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Budget</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">$5,000 / month</p>
              </div>
            </div>
            <button className="text-primary hover:bg-primary/5 p-1.5 rounded-md transition-colors">
              <span className="material-symbols-outlined text-[18px]">save_alt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDrawer;