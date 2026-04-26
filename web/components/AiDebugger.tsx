import React, { useState } from 'react';
import { api } from '../src/lib/api';

interface AiDebuggerProps {
    config: any;
    t: (key: string) => string;
}

export const AiDebugger: React.FC<AiDebuggerProps> = ({ config, t }) => {
    const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');
    const [userPrompt, setUserPrompt] = useState('Hola, quiero información sobre el Kit Jurídico.');
    const [response, setResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunDebug = async () => {
        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await api.ai.debug({
                systemPrompt,
                userPrompt,
                model: config.model
            });
            setResponse(result);
        } catch (err: any) {
            setError(err.message || 'Error executing debug request');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-2xl mt-8">
            <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-amber-500">bug_report</span>
                <h3 className="font-semibold text-slate-900 dark:text-white">AI Debugger (Simulación)</h3>
            </div>

            <p className="text-xs text-slate-500 mb-6 italic">
                Test the AI response with your current configuration without affecting real WhatsApp conversations.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        System Prompt (Override for Test)
                    </label>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-xs font-mono resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="System instructions..."
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        User Message
                    </label>
                    <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className="w-full h-24 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Type a message as if you were a customer..."
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleRunDebug}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${isLoading
                                ? 'bg-slate-100 text-slate-400 cursor-wait'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                Run Test
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-mono border border-red-100">
                        Error: {error}
                    </div>
                )}

                {response && (
                    <div className="mt-6 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            AI Response ({response.model})
                        </label>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-sm font-mono whitespace-pre-wrap">
                            {response.text}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
