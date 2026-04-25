import React from 'react';
import { useAppState } from '../StateContext';

const MobileFAB: React.FC = () => {
    const { language } = useAppState();

    return (
        <button
            className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center z-40 active:scale-95 transition-transform"
            onClick={() => {/* Trigger New Chat Logic */ }}
            aria-label={language === 'es' ? 'Nuevo Chat' : 'New Chat'}
        >
            <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
    );
};

export default MobileFAB;
