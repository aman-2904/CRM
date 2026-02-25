import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, IndianRupee, Calendar, Building } from 'lucide-react';
import api from '../../services/api';

const DealModal = ({ isOpen, onClose, dealToEdit, leadToConvert, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        lead_id: '',
        amount: '',
        stage: 'prospecting',
        expected_close_date: ''
    });
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await api.get('/leads');
                setLeads(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch leads', err);
            }
        };
        if (isOpen) fetchLeads();
    }, [isOpen]);

    useEffect(() => {
        if (dealToEdit) {
            setFormData({
                name: dealToEdit.name || '',
                lead_id: dealToEdit.lead_id || '',
                amount: dealToEdit.amount || '',
                stage: dealToEdit.stage || 'prospecting',
                expected_close_date: dealToEdit.expected_close_date || ''
            });
        } else if (leadToConvert) {
            setFormData({
                name: `${leadToConvert.company || leadToConvert.first_name} Deal`,
                lead_id: leadToConvert.id,
                amount: '',
                stage: 'prospecting',
                expected_close_date: ''
            });
        } else {
            setFormData({
                name: '',
                lead_id: '',
                amount: '',
                stage: 'prospecting',
                expected_close_date: ''
            });
        }
    }, [dealToEdit, leadToConvert, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...formData,
            expected_close_date: formData.expected_close_date || null
        };

        try {
            if (dealToEdit) {
                await api.put(`/deals/${dealToEdit.id}`, payload);
            } else {
                await api.post('/deals', payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save deal');
        } finally {
            setLoading(false);
        }
    };

    const stages = [
        { value: 'prospecting', label: 'Prospecting' },
        { value: 'negotiation', label: 'Negotiation' },
        { value: 'closed_won', label: 'Closed Won' },
        { value: 'closed_lost', label: 'Closed Lost' }
    ];

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
            <DialogBackdrop transition className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel transition className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                            <div className="flex justify-between items-center mb-5">
                                <DialogTitle className="text-xl font-bold text-gray-900">
                                    {dealToEdit ? 'Edit Deal' : (leadToConvert ? 'Convert to Deal' : 'New Deal')}
                                </DialogTitle>
                                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deal Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g., Acme Corp Contract"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Related Lead</label>
                                    <select
                                        name="lead_id"
                                        value={formData.lead_id}
                                        onChange={handleChange}
                                        disabled={!!leadToConvert}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none disabled:bg-gray-50"
                                    >
                                        <option value="">No lead selected</option>
                                        {leads.map(lead => (
                                            <option key={lead.id} value={lead.id}>
                                                {lead.first_name} {lead.last_name} ({lead.company})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Deal Value (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Stage</label>
                                        <select
                                            name="stage"
                                            value={formData.stage}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                        >
                                            {stages.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Close Date</label>
                                    <input
                                        type="date"
                                        name="expected_close_date"
                                        value={formData.expected_close_date}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    />
                                </div>

                                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-200 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {loading ? 'Saving...' : (dealToEdit ? 'Update Deal' : 'Create Deal')}
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

export default DealModal;
