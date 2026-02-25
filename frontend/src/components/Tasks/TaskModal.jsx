import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Calendar as CalendarIcon, Clock, User, Trash2 } from 'lucide-react';
import api from '../../services/api';

const TaskModal = ({ isOpen, onClose, taskToEdit, onSuccess, initialLeadId, initialDate }) => {
    const [formData, setFormData] = useState({
        lead_id: '',
        scheduled_at: '',
        notes: '',
        assigned_to: '',
        status: 'pending'
    });
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsRes, empRes] = await Promise.all([
                    api.get('/leads'),
                    api.get('/users/employees')
                ]);
                setLeads(leadsRes.data.data || []);
                setEmployees(empRes.data.data || []);
            } catch (err) {
                console.error('Failed to fetch modal data', err);
            }
        };

        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (taskToEdit) {
            // Format ISO date to datetime-local string
            const date = new Date(taskToEdit.scheduled_at);
            const formattedDate = date.toISOString().slice(0, 16);

            setFormData({
                lead_id: taskToEdit.lead_id || '',
                scheduled_at: formattedDate,
                notes: taskToEdit.notes || '',
                assigned_to: taskToEdit.assigned_to || '',
                status: taskToEdit.status || 'pending'
            });
        } else {
            setFormData({
                lead_id: initialLeadId || '',
                scheduled_at: initialDate ? new Date(initialDate).toISOString().slice(0, 16) : '',
                notes: '',
                assigned_to: '',
                status: 'pending'
            });
        }
    }, [taskToEdit, isOpen, initialLeadId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (taskToEdit) {
                await api.put(`/followups/${taskToEdit.id}`, formData);
            } else {
                await api.post('/followups', formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this follow-up?')) return;

        setLoading(true);
        setError('');
        try {
            await api.delete(`/followups/${taskToEdit.id}`);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete task');
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
            <DialogBackdrop transition className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel transition className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 pb-4">
                            <div className="flex justify-between items-center mb-5">
                                <DialogTitle className="text-xl font-bold text-gray-900">
                                    {taskToEdit ? 'Edit Follow-up' : 'Schedule Follow-up'}
                                </DialogTitle>
                                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Select Lead</label>
                                    <select
                                        name="lead_id"
                                        required
                                        value={formData.lead_id}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    >
                                        <option value="">Choose a lead...</option>
                                        {leads.map(lead => (
                                            <option key={lead.id} value={lead.id}>
                                                {lead.first_name} {lead.last_name} ({lead.company})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="scheduled_at"
                                        required
                                        value={formData.scheduled_at}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assign To</label>
                                    <select
                                        name="assigned_to"
                                        value={formData.assigned_to}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    >
                                        <option value="">Assign to me</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.full_name || emp.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Instructions</label>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="What needs to be done?"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                                    />
                                </div>

                                <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-100">
                                    {taskToEdit ? (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    ) : (
                                        <div />
                                    )}
                                    <div className="flex gap-3">
                                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {loading ? 'Processing...' : (taskToEdit ? 'Update' : 'Schedule')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default TaskModal;
