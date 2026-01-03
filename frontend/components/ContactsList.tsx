import React, { useState } from 'react';
import { useAppState } from '../StateContext';

const ContactsList: React.FC = () => {
    const { contacts, setActiveContactId, setActiveItem } = useAppState();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContactClick = (id: string) => {
        setActiveContactId(id);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark p-6 md:p-10">
            <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight">Contacts</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Manage and view all your customer relationships.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition shadow-sm">
                        <span className="material-symbols-outlined text-[20px] mr-2">person_add</span>
                        Add Contact
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Tags</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredContacts.map((contact) => (
                                <tr
                                    key={contact.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                    onClick={() => handleContactClick(contact.id)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img className="size-10 rounded-full object-cover shadow-sm bg-slate-200" src={contact.avatar} alt={contact.name} />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{contact.name}</span>
                                                <span className="text-xs text-slate-500">{contact.role} @ {contact.company}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${contact.status === 'online'
                                                ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-800'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                            }`}>
                                            <span className={`size-1.5 rounded-full ${contact.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                            {contact.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-center">
                                            {contact.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">chat</span>
                                            </button>
                                            <button className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredContacts.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-40">
                        <span className="material-symbols-outlined text-[64px] mb-2">person_search</span>
                        <p className="text-lg font-bold">No contacts found</p>
                        <p className="text-sm">Try a different search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactsList;
