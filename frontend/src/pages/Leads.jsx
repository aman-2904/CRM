import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import LeadFormModal from '../components/Leads/LeadFormModal';
import DealModal from '../components/Deals/DealModal';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, Phone, Mail, IndianRupee, RefreshCw, Calendar, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [leadToConvert, setLeadToConvert] = useState(null);
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const { role, loading: authLoading } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [datePreset, setDatePreset] = useState('all'); // all | today | yesterday | 7days | 30days | custom

    const applyPreset = (preset) => {
        setDatePreset(preset);
        const now = new Date();
        const toISO = (d) => d.toISOString().slice(0, 10);
        if (preset === 'today') {
            setDateFrom(toISO(now)); setDateTo(toISO(now));
        } else if (preset === 'yesterday') {
            const y = new Date(now); y.setDate(now.getDate() - 1);
            setDateFrom(toISO(y)); setDateTo(toISO(y));
        } else if (preset === '7days') {
            const d = new Date(now); d.setDate(now.getDate() - 6);
            setDateFrom(toISO(d)); setDateTo(toISO(now));
        } else if (preset === '30days') {
            const d = new Date(now); d.setDate(now.getDate() - 29);
            setDateFrom(toISO(d)); setDateTo(toISO(now));
        } else if (preset === 'all') {
            setDateFrom(''); setDateTo('');
        }
        // 'custom' — don't change dates, let user pick
    };

    // Fetch Leads
    const fetchLeads = async () => {
        if (authLoading) return; // Wait for auth
        try {
            setLoading(true);
            const response = await api.get('/leads');
            setLeads(response.data.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchLeads();
        }
    }, [authLoading]);

    const handleAddLead = () => {
        setSelectedLead(null);
        setIsModalOpen(true);
    };

    const handleSyncSheet = async () => {
        setSyncing(true);
        setSyncMsg(null);
        try {
            await api.post('/sheets/sync-now');
            setSyncMsg({ type: 'success', text: 'Sync started! Refreshing leads...' });
            setTimeout(async () => {
                await fetchLeads();
                setSyncMsg(null);
            }, 3000);
        } catch {
            setSyncMsg({ type: 'error', text: 'Sync failed. Please try again.' });
            setTimeout(() => setSyncMsg(null), 3000);
        } finally {
            setSyncing(false);
        }
    };

    const handleEditLead = (lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleDeleteLead = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        try {
            await api.delete(`/leads/${id}`);
            fetchLeads(); // Refresh list
        } catch (error) {
            alert('Failed to delete lead: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedLeads.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedLeads.size} selected leads?`)) return;

        try {
            await api.post('/leads/bulk-delete', { ids: Array.from(selectedLeads) });
            setSelectedLeads(new Set()); // Clear selection
            fetchLeads(); // Refresh list
        } catch (error) {
            console.error('Bulk delete failed', error);
            alert('Failed to delete leads');
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.size === filteredLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
        }
    };

    const toggleSelectLead = (id) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLeads(newSelected);
    };


    // Filter Logic
    const filteredLeads = (leads || []).filter(lead => {
        const firstName = lead.first_name || '';
        const lastName = lead.last_name || '';
        const email = lead.email || '';
        const company = lead.company || '';
        const search = searchTerm.toLowerCase();

        const matchesSearch = (
            firstName.toLowerCase().includes(search) ||
            lastName.toLowerCase().includes(search) ||
            email.toLowerCase().includes(search) ||
            company.toLowerCase().includes(search)
        );

        // Date range filter
        let matchesDate = true;
        if (dateFrom || dateTo) {
            const leadDate = lead.created_at ? new Date(lead.created_at) : null;
            if (!leadDate) return false;
            if (dateFrom) {
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                if (leadDate < from) matchesDate = false;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (leadDate > to) matchesDate = false;
            }
        }

        return matchesSearch && matchesDate;
    }).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-600 border-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.2)]';
            case 'contacted': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
            case 'interested': return 'bg-purple-50 text-purple-600 border-purple-100 shadow-[0_0_8px_rgba(168,85,247,0.2)]';
            case 'converted': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
            case 'lost': return 'bg-slate-50 text-slate-500 border-slate-200';
            default: return 'bg-gray-50 text-gray-500 border-gray-200';
        }
    };

    const getAvatarGradient = (name) => {
        const colors = [
            'from-blue-500 to-indigo-600',
            'from-purple-500 to-violet-600',
            'from-emerald-500 to-teal-600',
            'from-amber-500 to-orange-600',
            'from-rose-500 to-pink-600',
            'from-cyan-500 to-blue-600'
        ];
        const index = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[index];
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Leads Management</h1>
                <div className="flex gap-2 items-center">
                    {syncMsg && (
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${syncMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {syncMsg.text}
                        </span>
                    )}
                    {selectedLeads.size > 0 && role === 'admin' && (
                        <button
                            onClick={handleBulkDelete}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                        >
                            <Trash2 className="-ml-1 mr-2 h-5 w-5" />
                            Delete Selected ({selectedLeads.size})
                        </button>
                    )}
                    {role === 'admin' && (
                        <button
                            onClick={handleSyncSheet}
                            disabled={syncing}
                            className="inline-flex items-center px-4 py-2 border border-green-600 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Sheet'}
                        </button>
                    )}
                    <button
                        onClick={handleAddLead}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Add New Lead
                    </button>
                </div>
            </div>

            {/* Search & Date Filters */}
            <div className="mb-6 flex flex-col gap-3">
                {/* Row 1: Search + Preset buttons */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-11 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300"
                            placeholder="Search by name, email, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Preset Buttons */}
                    <div className="flex items-center gap-1.5 p-1 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl overflow-hidden">
                        {[['all', 'All'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['7days', '7d'], ['30days', '30d'], ['custom', 'Custom']].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => applyPreset(key)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${datePreset === key
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Result count */}
                    {datePreset !== 'all' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 backdrop-blur-sm border border-blue-100 rounded-xl animate-in fade-in duration-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs font-bold text-blue-700">
                                {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Row 2: Custom date pickers (only when Custom is selected) */}
                {datePreset === 'custom' && (
                    <div className="flex items-center gap-2 flex-wrap pl-0">
                        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-3 py-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <input
                                type="date"
                                className="text-sm text-gray-700 border-none outline-none bg-transparent"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                placeholder="From"
                            />
                        </div>
                        <span className="text-gray-400 text-sm">to</span>
                        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-3 py-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <input
                                type="date"
                                className="text-sm text-gray-700 border-none outline-none bg-transparent"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                placeholder="To"
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-md px-2 py-1.5 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" /> Clear
                            </button>
                        )}
                        {(dateFrom || dateTo) && (
                            <span className="text-xs text-gray-500 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
                                {filteredLeads.length} result{filteredLeads.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Leads Table Container */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 sm:rounded-3xl overflow-hidden transition-all duration-500">
                <div className="min-w-full divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-sm font-medium text-slate-400">Loading your leads...</p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-medium">No leads match your search criteria</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {role === 'admin' && (
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className={`group hover:bg-blue-50/30 transition-all duration-300 ${selectedLeads.has(lead.id) ? 'bg-blue-50/50' : ''}`}>
                                        {role === 'admin' && (
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 transition-all cursor-pointer"
                                                    checked={selectedLeads.has(lead.id)}
                                                    onChange={() => toggleSelectLead(lead.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br ${getAvatarGradient(lead.first_name)} flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-200/20 group-hover:scale-110 transition-transform duration-300 ring-2 ring-white`}>
                                                    {(lead.first_name?.[0] || '?').toUpperCase()}
                                                    {(lead.last_name?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{lead.first_name} {lead.last_name}</div>
                                                    <div className="text-xs font-medium text-slate-500 flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1">
                                                        {lead.email && (
                                                            <span className="flex items-center hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap">
                                                                <Mail className="h-3.5 w-3.5 mr-1.5 text-blue-500/70" />
                                                                {lead.email}
                                                            </span>
                                                        )}
                                                        {lead.phone && (
                                                            <span className="flex items-center hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap">
                                                                <Phone className="h-3.5 w-3.5 mr-1.5 text-emerald-500/70" />
                                                                {lead.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`px-3 py-1 scale-95 border inline-flex text-[10px] font-bold rounded-full capitalize transition-all duration-300 ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-500">
                                            {lead.company || <span className="text-slate-300 italic">-</span>}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-semibold text-slate-800 leading-relaxed">
                                            {lead.source || '-'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-1 transition-all duration-300">
                                                <button onClick={() => handleEditLead(lead)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Lead">
                                                    <Edit2 className="h-4.5 w-4.5" />
                                                </button>
                                                {lead.status !== 'converted' && (
                                                    <button
                                                        onClick={() => { setLeadToConvert(lead); setIsDealModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Convert to Deal"
                                                    >
                                                        <IndianRupee className="h-4.5 w-4.5" />
                                                    </button>
                                                )}
                                                {role === 'admin' && (
                                                    <button onClick={() => handleDeleteLead(lead.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Lead">
                                                        <Trash2 className="h-4.5 w-4.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                leadToEdit={selectedLead}
                onSuccess={fetchLeads}
            />
            <DealModal
                isOpen={isDealModalOpen}
                onClose={() => { setIsDealModalOpen(false); setLeadToConvert(null); }}
                leadToConvert={leadToConvert}
                onSuccess={() => { fetchLeads(); setIsDealModalOpen(false); }}
            />
        </DashboardLayout>
    );
};

export default Leads;
