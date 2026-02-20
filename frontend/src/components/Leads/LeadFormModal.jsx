import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import api from '../../services/api';

const LeadFormModal = ({ isOpen, onClose, leadToEdit, onSuccess }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        status: 'new',
        source: '',
        notes: '',
        assigned_to: '',
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await api.get('/users/employees');
                setEmployees(response.data.data || []);
            } catch (err) {
                console.error('Failed to fetch employees', err);
            }
        };

        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    useEffect(() => {
        if (leadToEdit) {
            setFormData({
                first_name: leadToEdit.first_name || '',
                last_name: leadToEdit.last_name || '',
                email: leadToEdit.email || '',
                phone: leadToEdit.phone || '',
                company: leadToEdit.company || '',
                status: leadToEdit.status || 'new',
                source: leadToEdit.source || '',
                notes: leadToEdit.notes || '',
                assigned_to: leadToEdit.assigned_to || null,
            });
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                company: '',
                status: 'new',
                source: '',
                notes: '',
                assigned_to: '',
            });
        }
    }, [leadToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Convert empty string to null for UUID fields
            const payload = {
                ...formData,
                assigned_to: formData.assigned_to || null,
            };
            if (leadToEdit) {
                await api.put(`/leads/${leadToEdit.id}`, payload);
            } else {
                await api.post('/leads', payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                    >
                        <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                                    {leadToEdit ? 'Edit Lead Profile' : 'Create New Lead'}
                                </DialogTitle>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {leadToEdit?.source || 'Manual Entry'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all border border-transparent hover:border-slate-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-6 h-px bg-blue-100 mr-2" /> Basic Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">First Name</label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    required
                                                    value={formData.first_name}
                                                    onChange={handleChange}
                                                    placeholder="John"
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Last Name</label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    required
                                                    value={formData.last_name}
                                                    onChange={handleChange}
                                                    placeholder="Doe"
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="john@example.com"
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-6 h-px bg-emerald-100 mr-2" /> Business Details
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Company</label>
                                            <input
                                                type="text"
                                                name="company"
                                                value={formData.company}
                                                onChange={handleChange}
                                                placeholder="Company Name"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Lead Status</label>
                                                <select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none"
                                                >
                                                    <option value="new">New</option>
                                                    <option value="attempt_to_call">Attempt to Call</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="interested">Interested</option>
                                                    <option value="converted">Converted</option>
                                                    <option value="lost">Lost</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Assigned To</label>
                                                <select
                                                    name="assigned_to"
                                                    value={formData.assigned_to}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {employees.map(emp => (
                                                        <option key={emp.id} value={emp.id}>
                                                            {emp.full_name || emp.email}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {leadToEdit?.source?.startsWith('Google Sheet') && (
                                    <div className="pt-2">
                                        <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center">
                                            <span className="w-6 h-px bg-amber-100 mr-2" /> Sheet Information
                                        </h4>
                                        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 grid grid-cols-1 gap-3">
                                            {leadToEdit.notes?.split('|').filter(part => part.includes(':')).map((part, i) => {
                                                const [label, ...valParts] = part.split(':');
                                                const value = valParts.join(':').trim();
                                                const cleanLabel = label.trim().replace(/_/g, ' ').replace(/\?|:|_/g, '');

                                                // Skip basic info that's already in the form
                                                if (['first_name', 'last_name', 'email', 'phone', 'full_name'].some(k => label.toLowerCase().includes(k))) return null;

                                                return (
                                                    <div key={i} className="flex flex-col">
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">{cleanLabel}</span>
                                                        <span className="text-sm font-semibold text-slate-700 mt-0.5 line-clamp-2">{value || '-'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-6 h-px bg-slate-100 mr-2" /> Manual Notes
                                    </h4>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Add any additional details..."
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                                        onClick={onClose}
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-10 py-2.5 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xl shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center"
                                    >
                                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3 text-white" />}
                                        {loading ? 'Processing...' : (leadToEdit ? 'Update Profile' : 'Create Profile')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default LeadFormModal;
