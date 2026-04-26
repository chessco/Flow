import React, { useState, useEffect } from 'react';
import { useAppState } from '../StateContext';
import { Note } from '../types';
import { api } from '../src/lib/api';
import TaskModal from './TaskModal';

const ContactProfile: React.FC = () => {
  const { activeContactId, setActiveContactId, contacts, messages, t, language, setActiveItem, stages, tasks, refreshData } = useAppState();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Notes' | 'Tasks' | 'Files'>('Overview');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealFormData, setDealFormData] = useState({ title: '', value: '0' });
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const contact = contacts.find(c => c.id === activeContactId);
  const contactMessages = activeContactId ? (messages[activeContactId] || []) : [];

  useEffect(() => {
    if (contact) {
      setEditFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || ''
      });
    }
  }, [contact]);

  useEffect(() => {
    if (activeTab === 'Notes' && contact) {
      fetchNotes();
    }
  }, [activeTab, contact?.personId]);

  const fetchNotes = async () => {
    if (!contact) return;
    setIsNotesLoading(true);
    try {
      const data = await api.crm.getNotes(contact.personId, contact.personType);
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!contact || !newNoteContent.trim() || isSavingNote) return;
    setIsSavingNote(true);
    try {
      await api.crm.addNote(contact.personId, contact.personType, newNoteContent);
      setNewNoteContent('');
      await fetchNotes(); // Refresh list
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || isUpdating) return;
    setIsUpdating(true);
    try {
      await api.crm.updatePerson(contact.personId, contact.personType, editFormData);
      setIsEditModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCall = () => {
    if (contact && contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || isCreatingDeal || !stages.length) return;
    setIsCreatingDeal(true);
    try {
      const payload: any = {
        title: dealFormData.title,
        value: parseFloat(dealFormData.value),
        stageId: stages[0].id, // Default to first stage
      };

      if (contact.personType === 'CONTACT') {
        payload.contactId = contact.personId;
      } else {
        payload.leadId = contact.personId;
      }

      await api.kanban.createDeal(payload);
      setIsDealModalOpen(false);
      setDealFormData({ title: '', value: '0' });
      await refreshData();
      setActiveItem('kanban'); // Navigate to Kanban to see the new deal
    } catch (error) {
      console.error('Error creating deal:', error);
    } finally {
      setIsCreatingDeal(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!contact || isGeneratingTags) return;
    setIsGeneratingTags(true);
    try {
      await api.ai.generateTags(contact.id);
      await refreshData();
    } catch (error) {
      console.error('Error generating tags:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-[64px] mb-2 opacity-20">person</span>
        <p className="text-lg font-bold opacity-40">{t('contacts.selectContact')}</p>
        <button
          onClick={() => setActiveContactId(null)}
          className="mt-4 text-primary font-bold hover:underline"
        >
          {t('contacts.viewAll')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-8 flex flex-col gap-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setActiveContactId(null)}
          className="text-slate-500 hover:text-primary text-sm font-medium transition-colors"
        >
          {t('contacts.title')}
        </button>
        <span className="material-symbols-outlined text-slate-400 text-[16px]">chevron_right</span>
        <span className="text-slate-900 dark:text-white text-sm font-medium">{contact.name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex gap-5">
            <div className="relative">
              <img
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#1e2330] shadow-md"
                src={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`}
                alt={contact.name}
              />
              <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white dark:border-[#1e2330] flex items-center justify-center ${contact.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}>
                <span className="material-symbols-outlined text-white text-[14px]">{contact.status === 'online' ? 'chat' : 'person'}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{contact.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  {t('profile.verified')}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-1">{contact.role} {language === 'es' ? 'en' : 'at'} {contact.company}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>{t('profile.active')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center md:self-center">
            <button
              onClick={() => setActiveItem('inbox')}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
              WhatsApp
            </button>
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              {language === 'es' ? 'Llamar' : 'Call'}
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
            <button
              onClick={() => setIsDealModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              {t('profile.newDeal')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Insight */}
          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-indigo-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span className="text-sm font-bold uppercase tracking-wider">{t('profile.aiInsight')}</span>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">{language === 'es' ? 'Interesado' : 'Interested'}</span>
            </div>
            <p className="text-slate-900 dark:text-gray-200 text-sm leading-relaxed mb-3">
              {language === 'es' ? 'El análisis sugiere un impulso positivo tras las últimas interacciones.' : 'Analysis suggests positive momentum after the last interactions.'}
            </p>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-slate-900 dark:text-white font-bold text-base">{t('profile.details')}</h3>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-primary text-sm font-medium hover:underline"
              >
                {language === 'es' ? 'Editar' : 'Edit'}
              </button>
            </div>
            <div className="p-5 flex flex-col gap-5">
              <div className="grid gap-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('profile.contactInfo')}</p>
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-slate-900 dark:text-gray-200">{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center justify-between group">
                    <span className="text-sm text-slate-900 dark:text-gray-200">{contact.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-slate-900 dark:text-gray-200">{contact.company}</span>
                </div>
              </div>
              <div className="grid gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('profile.tags')}</p>
                  <button
                    onClick={handleGenerateTags}
                    disabled={isGeneratingTags}
                    className="text-primary text-[10px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGeneratingTags ? (
                      <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    )}
                    {language === 'es' ? 'Generar con IA' : 'Generate with AI'}
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 h-6 text-xs font-medium text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-[14px] text-amber-500">star</span> {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">{language === 'es' ? 'Sin etiquetas' : 'No tags'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 flex flex-col gap-6 font-primary">
          {/* Tabs */}
          <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-10 transition-shadow">
            <div className="flex px-2 md:px-6 overflow-x-auto no-scrollbar">
              {(['Overview', 'Notes', 'Tasks', 'Files'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center justify-center border-b-[3px] px-4 py-4 min-w-fit transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <span className="text-sm font-bold">{t(`profile.tabs.${tab.toLowerCase()}` as any)}</span>
                  {tab === 'Tasks' && (
                    <span className="ml-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {tasks.filter(t => t.contactName === contact.name).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'Overview' && (
            <div className="relative space-y-8 pb-10 pl-6 animate-in fade-in duration-300">
              <div className="absolute left-[29px] top-4 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

              {contactMessages.slice(-5).map((msg, idx) => (
                <div key={msg.id} className="relative pl-8 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 150}ms` }}>
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-[#1e2330] border-2 z-10 flex items-center justify-center ${msg.sender === 'me' ? 'border-primary' : 'border-[#25D366]'}`}>
                    <span className={`material-symbols-outlined text-[14px] ${msg.sender === 'me' ? 'text-primary' : 'text-[#25D366]'}`}>
                      {msg.sender === 'me' ? 'send' : 'chat'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {msg.sender === 'me' ? t('profile.yourMessage') : t('profile.waInteraction')}
                      </span>
                      <span className="text-xs text-slate-500">{msg.timestamp}</span>
                    </div>
                    <div className={`p-4 rounded-lg border shadow-sm mt-1 max-w-lg ${msg.sender === 'me'
                      ? 'bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800'
                      : 'bg-[#e7fceb] dark:bg-[#0c2914] border-[#c4eecb] dark:border-[#144520]'
                      }`}>
                      <p className={`text-sm leading-relaxed ${msg.sender === 'me' ? 'text-slate-900 dark:text-gray-300' : 'text-[#0b3d17] dark:text-[#a0e6b0]'
                        }`}>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {contactMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <span className="material-symbols-outlined text-4xl mb-2">history</span>
                  <p className="text-sm font-medium">{t('profile.noActivity')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              {/* Add Note Input */}
              <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder={t('profile.notes.placeholder')}
                  className="w-full h-24 bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-gray-200 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim() || isSavingNote}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all"
                  >
                    {isSavingNote ? t('profile.notes.saving') : t('profile.notes.save')}
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="flex flex-col gap-4">
                {isNotesLoading ? (
                  <div className="flex justify-center py-10">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-40">
                    <span className="material-symbols-outlined text-4xl mb-2">notes</span>
                    <p className="text-sm font-medium">{t('profile.notes.noNotes')}</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                            {note.user.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{note.user.name}</span>
                            <span className="text-[10px] text-slate-500">{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('profile.tabs.tasks')}</h4>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  {language === 'es' ? 'Nueva Tarea' : 'New Task'}
                </button>
              </div>
              {tasks.filter(t => t.contactName === contact.name || (t as any).contactId === contact.personId || (t as any).leadId === contact.personId).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <span className="material-symbols-outlined text-6xl mb-4">assignment_turned_in</span>
                  <p className="text-lg font-bold">{language === 'es' ? 'No hay tareas para este contacto' : 'No tasks for this contact'}</p>
                </div>
              ) : (
                tasks.filter(t => t.contactName === contact.name || (t as any).contactId === contact.personId).map((task) => (
                  <div key={task.id} className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {task.priority === 'High' ? 'priority_high' : 'assignment'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{task.dueDate}</span>
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'Files' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {contactMessages.filter(m => m.mediaUrl).length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
                  <span className="material-symbols-outlined text-6xl mb-4">folder_open</span>
                  <p className="text-lg font-bold">{language === 'es' ? 'No hay archivos compartidos' : 'No shared files'}</p>
                </div>
              ) : (
                contactMessages.filter(m => m.mediaUrl).map((msg) => (
                  <a
                    key={msg.id}
                    href={msg.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm hover:border-primary/50 transition-all group"
                  >
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                      {msg.type === 'image' ? (
                        <img src={msg.mediaUrl} alt="Contact Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-slate-400">
                          {msg.type === 'video' ? 'movie' : msg.type === 'audio' ? 'audiotrack' : 'description'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {msg.fileName || (msg.type === 'image' ? 'Imagen' : msg.type === 'video' ? 'Video' : 'Documento')}
                      </span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e2330] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('profile.edit.title')}</h2>
            <form onSubmit={handleUpdateContact} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t('profile.edit.name')}</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t('profile.edit.email')}</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t('profile.edit.phone')}</label>
                <input
                  type="text"
                  required
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all"
                >
                  {isUpdating ? t('profile.edit.saving') : t('profile.edit.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      {isDealModalOpen && (
        // ... (existing deal modal logic)
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e2330] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('profile.newDeal')}</h2>
            <form onSubmit={handleCreateDeal} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                  {language === 'es' ? 'Título del Negocio' : 'Deal Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'es' ? 'Ej: Implementación Web' : 'e.g. Web Implementation'}
                  value={dealFormData.title}
                  onChange={(e) => setDealFormData({ ...dealFormData, title: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                  {language === 'es' ? 'Valor (USD)' : 'Value (USD)'}
                </label>
                <input
                  type="number"
                  required
                  value={dealFormData.value}
                  onChange={(e) => setDealFormData({ ...dealFormData, value: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDeal}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all"
                >
                  {isCreatingDeal ? t('profile.edit.saving') : language === 'es' ? 'Crear Negocio' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          onClose={() => setIsTaskModalOpen(false)}
          initialContact={contact}
        />
      )}
    </div>
  );
};

export default ContactProfile;
