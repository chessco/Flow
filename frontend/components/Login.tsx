import React, { useState } from 'react';
import { useAppState } from '../StateContext';

export const Login: React.FC = () => {
    const { login } = useAppState();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const success = await login(email, password);
        if (!success) {
            setError('Invalid credentials');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#1a202c]">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-gradient-to-tr from-blue-600 to-cyan-400 aspect-square rounded-full w-16 h-16 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4">
                        <span className="material-symbols-outlined text-[32px]">water_drop</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
                    <p className="text-slate-500 text-sm mt-1">Sign in to your PitayaCode Flow account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="name@company.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-slate-400">
                            Use <b>admin@pitaya.com</b> / <b>admin123</b>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
