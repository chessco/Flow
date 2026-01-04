import React, { useState, useEffect } from 'react';
import { useAppState } from '../StateContext';
import { api } from '../src/lib/api';

interface AiDrawerProps {
  onClose: () => void;
}

const AiDrawer: React.FC<AiDrawerProps> = ({ onClose }) => {
  const { contacts, activeContactId, messages, t, refreshData, aiCache, setAiCacheData } = useAppState();
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiManaged, setIsAiManaged] = useState(false);

  // State for Analysis
  const [analysis, setAnalysis] = useState<{
    nextBestAction?: string;
    intent?: string;
    extractedData?: {
      email?: string;
      budget?: string;
      location?: string;
      meetingDate?: string;
    }
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const contactName = activeContact?.name || 'Customer';

  useEffect(() => {
    if (activeContact) {
      setIsAiManaged(activeContact.aiManaged || false);
    }
  }, [activeContact]);

  const handleToggleAiManaged = async () => {
    if (!activeContactId) return;
    const newState = !isAiManaged;
    setIsAiManaged(newState);
    try {
      await api.ai.toggleAiManaged(activeContactId, newState);
      refreshData();
    } catch (error) {
      setIsAiManaged(!newState);
    }
  };

  const getLastResponseTime = () => {
    if (!activeContactId || !messages[activeContactId]) return 'recently';
    const contactMessages = messages[activeContactId].filter(m => m.sender === 'them');
    if (contactMessages.length === 0) return 'never';
    const lastMsg = contactMessages[contactMessages.length - 1];

    // Calculate relative time (simplified)
    const diff = Date.now() - new Date(lastMsg.createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  useEffect(() => {
    if (activeContactId) {
      const currentCache = aiCache[activeContactId];
      const messageCount = messages[activeContactId]?.length || 0;

      if (currentCache && currentCache.lastMessageCount === messageCount) {
        // Use cached data
        setSummary(currentCache.summary);
        setAnalysis(currentCache.analysis);
      } else {
        // Fetch new data
        fetchSummary();
        setAnalysis(null);
      }
    }
  }, [activeContactId, messages[activeContactId]?.length]);

  const fetchSummary = async () => {
    if (!activeContactId) return;
    setIsLoading(true);
    try {
      const result = await api.ai.summarize(activeContactId);
      const text = typeof result === 'string' ? result : result.summary || t('aiDrawer.noData');
      setSummary(text);

      // Update cache with summary and current message count
      setAiCacheData(activeContactId, {
        summary: text,
        lastMessageCount: messages[activeContactId]?.length || 0
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary('Failed to load summary.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeContext = async () => {
    if (!activeContactId) return;
    setIsAnalyzing(true);
    try {
      const result = await api.ai.analyzeContext(activeContactId);
      setAnalysis(result);

      // Update cache with analysis and current message count
      setAiCacheData(activeContactId, {
        analysis: result,
        lastMessageCount: messages[activeContactId]?.length || 0
      });
    } catch (error) {
      console.error('Error analyzing context:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
            <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">{t('aiDrawer.title')}</h3>
            <p className="text-[11px] font-medium text-primary">{t('aiDrawer.subtitle')} {contactName}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!activeContact ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center gap-4">
            <span className="material-symbols-outlined text-[64px] opacity-20">robot_2</span>
            <p className="text-sm font-medium px-8">{t('aiDrawer.selectConversation')}</p>
          </div>
        ) : (
          <>
            {/* AI Autonomous Toggle Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-4 shadow-sm mb-6 transition-all hover:border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-all duration-500 ${isAiManaged ? 'bg-primary/20 text-primary scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[24px]">robot_2</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('handover.autoPilot')}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{t('handover.autoPilotDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleAiManaged}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${isAiManaged ? 'bg-primary shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.5)]' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isAiManaged ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>

            {/* Summary Section - NEW Real AI Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('aiDrawer.summaryTitle')}</h4>
                <button onClick={fetchSummary} className="text-primary hover:rotate-180 transition-all duration-500">
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-xl p-4 shadow-sm relative overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center gap-3 text-slate-500 py-2">
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span className="text-xs font-medium">{t('aiDrawer.generating')}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {summary || t('aiDrawer.noData')}
                  </p>
                )}
              </div>
            </div>

            {/* Engagement Risk */}
            <div className="flex gap-3 p-3.5 rounded-xl bg-orange-50 border border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/30 shadow-sm transition-all hover:scale-[1.02]">
              <div className="flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-orange-500 text-[20px]">schedule</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-orange-800 dark:text-orange-200 mb-0.5">{t('aiDrawer.engagementRisk')}</h4>
                <p className="text-xs text-orange-700/80 dark:text-orange-300/70 leading-relaxed">
                  {t('aiDrawer.engagementRiskDesc').replace('{name}', contactName).replace('{time}', getLastResponseTime())}
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
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('aiDrawer.nextBestAction')}</span>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{t('aiDrawer.autoPilot')}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-4">
                  {analysis?.nextBestAction || t('aiDrawer.actionDesc').replace('{name}', contactName)}
                </p>
                <button
                  onClick={analyzeContext}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isAnalyzing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">quick_reference_all</span>
                      {t('aiDrawer.analyzeButton')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Extracted Data */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">{t('aiDrawer.intentTitle')}</h4>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[20px]">fact_check</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('aiDrawer.intentLabel')}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {analysis?.intent || t('aiDrawer.intentValue')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Extraction Fields */}
              {analysis?.extractedData && (
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">data_check</span>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{t('aiDrawer.extractedData.title')}</h5>
                  </div>

                  {analysis.extractedData.email && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('aiDrawer.extractedData.email')}</span>
                      <span className="font-medium text-slate-800 dark:text-white">{analysis.extractedData.email}</span>
                    </div>
                  )}
                  {analysis.extractedData.budget && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('aiDrawer.extractedData.budget')}</span>
                      <span className="font-medium text-slate-800 dark:text-white">{analysis.extractedData.budget}</span>
                    </div>
                  )}
                  {analysis.extractedData.location && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('aiDrawer.extractedData.location')}</span>
                      <span className="font-medium text-slate-800 dark:text-white">{analysis.extractedData.location}</span>
                    </div>
                  )}
                  {analysis.extractedData.meetingDate && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{t('aiDrawer.extractedData.meeting')}</span>
                      <span className="font-medium text-slate-800 dark:text-white">{analysis.extractedData.meetingDate}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AiDrawer;
