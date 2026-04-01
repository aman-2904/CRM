import React, { useState, useEffect } from 'react';
import { Trash2, Send, Loader2, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

const LeadNotes = ({ leadId }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchNotes = async () => {
        if (!leadId) return;
        try {
            setLoading(true);
            const response = await api.getLeadNotes(leadId);
            setNotes(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
            setError('Could not load notes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [leadId]);

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim() || submitting) return;

        try {
            setSubmitting(true);
            const response = await api.createNote({
                lead_id: leadId,
                content: newNote.trim()
            });
            
            // Prepend the new note to the list
            setNotes(prev => [response.data.data, ...prev]);
            setNewNote('');
        } catch (err) {
            console.error('Failed to add note:', err);
            alert('Failed to add note. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;

        try {
            await api.deleteNote(noteId);
            setNotes(prev => prev.filter(note => note.id !== noteId));
        } catch (err) {
            console.error('Failed to delete note:', err);
            alert('Failed to delete note.');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">Loading Notes...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/30 rounded-3xl border border-slate-100 overflow-hidden">
            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[300px] max-h-[500px]">
                {notes.length > 0 ? (
                    notes.map((note) => (
                        <div 
                            key={note.id} 
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {note.content}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-500 uppercase">
                                            {note.profiles?.full_name?.[0] || '?'}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {note.profiles?.full_name || 'System'} • {formatDate(note.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Delete Note"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                        <MessageSquare className="w-12 h-12 mb-3 opacity-10" />
                        <p className="text-sm font-bold opacity-40">No notes yet</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddNote(e);
                                }
                            }}
                            placeholder="Add a note..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            disabled={submitting}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || submitting}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200/50 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span className="hidden sm:inline">Add Note</span>
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadNotes;
