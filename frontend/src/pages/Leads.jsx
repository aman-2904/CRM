import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import LeadFormModal from '../components/Leads/LeadFormModal';
import DealModal from '../components/Deals/DealModal';
import TaskModal from '../components/Tasks/TaskModal';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, Phone, Mail, IndianRupee, RefreshCw, Calendar, X, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomDropdown from '../components/Common/CustomDropdown';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [modalInitialTab, setModalInitialTab] = useState('profile');
    const [searchTerm, setSearchTerm] = useState('');
    const [leadToConvert, setLeadToConvert] = useState(null);
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const { role, loading: authLoading } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [datePreset, setDatePreset] = useState('all');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [leadToFollowup, setLeadToFollowup] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

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
            // Pre-load employees so modal opens instantly
            api.get('/users/employees')
                .then(res => setEmployees(res.data.data || []))
                .catch(() => { });
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

    const handleEditLead = (lead, tab = 'profile') => {
        setSelectedLead(lead);
        setModalInitialTab(tab);
        setIsModalOpen(true);
    };

    const handleStatusChange = async (e, leadId, newStatus) => {
        e.stopPropagation();
        try {
            const leadToUpdate = leads.find(l => l.id === leadId);
            if (!leadToUpdate) return;
            
            const payload = {
                first_name: leadToUpdate.first_name,
                last_name: leadToUpdate.last_name,
                email: leadToUpdate.email,
                phone: leadToUpdate.phone,
                company: leadToUpdate.company,
                status: newStatus,
                source: leadToUpdate.source,
                notes: leadToUpdate.notes,
                assigned_to: leadToUpdate.assigned_to || null,
            };
            
            // Optimistic update
            setLeads(prevLeads => prevLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            
            await api.put(`/leads/${leadId}`, payload);
            fetchLeads(); // Refresh leads in background to ensure consistency
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
            fetchLeads(); // Revert on failure
        }
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

        // Assignment filter
        const matchesAssignment = selectedEmployeeId === 'all' || lead.assigned_to === selectedEmployeeId;

        return matchesSearch && matchesDate && matchesAssignment;
    }).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-600 border-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.2)]';
            case 'attempt_to_call': return 'bg-orange-50 text-orange-600 border-orange-100 shadow-[0_0_8px_rgba(234,88,12,0.2)]';
            case 'contacted': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
            case 'interested': return 'bg-purple-50 text-purple-600 border-purple-100 shadow-[0_0_8px_rgba(168,85,247,0.2)]';
            case 'qualified': return 'bg-teal-50 text-teal-600 border-teal-100 shadow-[0_0_8px_rgba(20,184,166,0.2)]';
            case 'non_qualified': return 'bg-rose-50 text-rose-600 border-rose-100 shadow-[0_0_8px_rgba(244,63,94,0.2)]';
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
            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm -mx-6 px-6 pt-4 pb-4 mb-4">
                {/* Row 1: Title + Buttons */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leads Management</h1>
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        {syncMsg && (
                            <span className={`text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${syncMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {syncMsg.text}
                            </span>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedLeads.size === 1 && (() => {
                                const selectedLead = leads.find(l => l.id === Array.from(selectedLeads)[0]);
                                return selectedLead && selectedLead.status !== 'converted' ? (
                                    <>
                                        <button
                                            onClick={() => { setLeadToConvert(selectedLead); setIsDealModalOpen(true); }}
                                            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-all active:scale-95"
                                        >
                                            <IndianRupee className="-ml-0.5 sm:-ml-1 mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Create Deal</span>
                                            <span className="sm:hidden">Deal</span>
                                        </button>
                                        <button
                                            onClick={() => { setLeadToFollowup(selectedLead); setIsTaskModalOpen(true); }}
                                            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all active:scale-95"
                                        >
                                            <Calendar className="-ml-0.5 sm:-ml-1 mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Create Follow Up</span>
                                            <span className="sm:hidden">Follow Up</span>
                                        </button>
                                    </>
                                ) : null;
                            })()}
                            {selectedLeads.size > 0 && role === 'admin' && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all active:scale-95"
                                >
                                    <Trash2 className="-ml-0.5 sm:-ml-1 mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    Delete ({selectedLeads.size})
                                </button>
                            )}
                            {role === 'admin' && (
                                <button
                                    onClick={handleSyncSheet}
                                    disabled={syncing}
                                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-green-200 rounded-lg shadow-sm text-xs sm:text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <RefreshCw className={`-ml-0.5 sm:-ml-1 mr-1.5 sm:mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Syncing...' : 'Sync'}
                                </button>
                            )}
                            <button
                                onClick={handleAddLead}
                                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all active:scale-95"
                            >
                                <Plus className="-ml-0.5 sm:-ml-1 mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Add Lead</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Row 2: Search & Date Filters */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                        {/* Search */}
                        <div className="relative flex-1 lg:max-w-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Employee Assignment Filter (Admin Only) */}
                        {role === 'admin' && (
                            <div className="w-full lg:w-48">
                                <CustomDropdown
                                    items={employees.filter(emp => emp.roles?.name !== 'admin')}
                                    selectedId={selectedEmployeeId}
                                    onSelect={setSelectedEmployeeId}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Preset Buttons - Wrap instead of scroll */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50/50 border border-slate-200 rounded-xl">
                            {[['all', 'All'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['7days', '7d'], ['30days', '30d'], ['custom', 'Custom']].map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => applyPreset(key)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${datePreset === key
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Result count */}
                        {datePreset !== 'all' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-xl self-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-xs font-bold text-blue-700">
                                    {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Custom date pickers */}
                    {datePreset === 'custom' && (
                        <div className="flex items-center gap-2 flex-wrap p-2 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="date"
                                    className="text-xs text-slate-700 border-none outline-none bg-transparent"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <span className="text-slate-400 text-xs">to</span>
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="date"
                                    className="text-xs text-slate-700 border-none outline-none bg-transparent"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                            {(dateFrom || dateTo) && (
                                <button
                                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                                    className="text-xs text-rose-500 font-bold hover:text-rose-600 ml-auto px-2"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>


            {/* Leads Table Container */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 sm:rounded-3xl overflow-hidden transition-all duration-500">
                <div className="min-w-full">
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
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                    checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                                            <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                            <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                                            <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Source</th>
                                            <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Assign</th>
                                            <th className="px-3 py-3 text-right text-[10px] sm:text-xs font-bold text-slate-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredLeads.map((lead) => (
                                            <tr
                                                key={lead.id}
                                                onClick={() => handleEditLead(lead)}
                                                className={`group hover:bg-blue-50/30 transition-all duration-300 cursor-pointer ${selectedLeads.has(lead.id) ? 'bg-blue-50/50' : ''}`}
                                            >
                                                <td className="px-6 py-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 transition-all cursor-pointer"
                                                        checked={selectedLeads.has(lead.id)}
                                                        onChange={() => toggleSelectLead(lead.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div
                                                        className="flex items-center cursor-pointer group/name"
                                                        onClick={() => handleEditLead(lead)}
                                                        title="View Lead Details"
                                                    >
                                                        <div className={`flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(lead.first_name)} flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200/20 group-hover/name:scale-105 transition-transform duration-300 ring-2 ring-white`}>
                                                            {(lead.first_name?.[0] || '?').toUpperCase()}
                                                            {(lead.last_name?.[0] || '?').toUpperCase()}
                                                        </div>
                                                        <div className="ml-3 min-w-0">
                                                            <div className="text-sm font-bold text-slate-900 truncate group-hover/name:text-blue-700 transition-colors">{lead.first_name} {lead.last_name}</div>
                                                            <div className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5 space-y-0.5">
                                                                {lead.email && (
                                                                    <span className="flex items-center text-slate-600">
                                                                        <Mail className="h-3 w-3 mr-1.5 text-blue-500/80" />
                                                                        {lead.email}
                                                                    </span>
                                                                )}
                                                                {lead.phone && (
                                                                    <span className="flex items-center text-emerald-600">
                                                                        <Phone className="h-3 w-3 mr-1.5 text-emerald-500/80" />
                                                                        {lead.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={lead.status}
                                                        onChange={(e) => handleStatusChange(e, lead.id, e.target.value)}
                                                        className={`px-2 py-0.5 border inline-flex text-[10px] font-bold rounded-full capitalize transition-all duration-300 outline-none cursor-pointer appearance-none text-center ${getStatusColor(lead.status)}`}
                                                        style={{ textAlignLast: 'center' }}
                                                    >
                                                        <option className="text-slate-900 bg-white font-medium" value="new">New</option>
                                                        <option className="text-slate-900 bg-white font-medium" value="attempt_to_call">Attempt to Call</option>
                                                        <option className="text-slate-900 bg-white font-medium" value="contacted">Contacted</option>
                                                        <option className="text-slate-900 bg-white font-medium" value="interested">Interested</option>
                                                        <option className="text-slate-900 bg-white font-medium" value="qualified">Qualified</option>
                                                        <option className="text-slate-900 bg-white font-medium" value="non_qualified">Non qualified</option>
                                                        <option className="text-slate-900 bg-white font-medium" value="converted">Converted</option>
                                                        <option className="text-slate-900 bg-white font-medium" value="lost">Lost</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 text-[11px] sm:text-xs font-medium text-slate-500">
                                                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                                                    {lead.source || '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 text-[11px] sm:text-xs font-bold text-slate-600 truncate max-w-[100px]">
                                                    {lead.profiles?.full_name?.split(' ')[0] || 'Unassigned'}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end space-x-0.5">
                                                        <button onClick={() => handleEditLead(lead)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleEditLead(lead, 'calendar')} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                                            <Calendar className="h-4 w-4" />
                                                        </button>
                                                        {lead.status !== 'converted' && (
                                                            <button onClick={() => { setLeadToConvert(lead); setIsDealModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                                                <IndianRupee className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {role === 'admin' && (
                                                            <button onClick={() => handleDeleteLead(lead.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile/Tablet Card View */}
                            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                {filteredLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        onClick={() => handleEditLead(lead)}
                                        className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col space-y-4 ${selectedLeads.has(lead.id)
                                            ? 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-100'
                                            : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div onClick={(e) => { e.stopPropagation(); toggleSelectLead(lead.id); }} className="p-1">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-5 w-5 transition-all cursor-pointer"
                                                        checked={selectedLeads.has(lead.id)}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(lead.first_name)} flex items-center justify-center text-white font-black text-base shadow-lg ring-2 ring-white`}>
                                                    {(lead.first_name?.[0] || '?').toUpperCase()}
                                                    {(lead.last_name?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div
                                                    className="cursor-pointer group/card-name"
                                                    onClick={() => handleEditLead(lead)}
                                                    title="View Lead Details"
                                                >
                                                    <h3 className="text-base font-bold text-slate-900 leading-tight group-hover/card-name:text-blue-600 transition-colors">{lead.first_name} {lead.last_name}</h3>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={lead.status}
                                                            onChange={(e) => handleStatusChange(e, lead.id, e.target.value)}
                                                            className={`mt-1 px-2.5 py-0.5 border inline-flex text-[10px] font-bold rounded-full capitalize outline-none cursor-pointer appearance-none ${getStatusColor(lead.status)}`}
                                                        >
                                                            <option className="text-slate-900 bg-white font-medium" value="new">New</option>
                                                            <option className="text-slate-900 bg-white font-medium" value="attempt_to_call">Attempt to Call</option>
                                                            <option className="text-slate-900 bg-white font-medium" value="contacted">Contacted</option>
                                                            <option className="text-slate-900 bg-white font-medium" value="interested">Interested</option>
                                                            <option className="text-slate-900 bg-white font-medium" value="qualified">Qualified</option>
                                                            <option className="text-slate-900 bg-white font-medium" value="non_qualified">Non qualified</option>
                                                            <option className="text-slate-900 bg-white font-medium" value="converted">Converted</option>
                                                            <option className="text-slate-900 bg-white font-medium" value="lost">Lost</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => handleEditLead(lead)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                {role === 'admin' && (
                                                    <button onClick={() => handleDeleteLead(lead.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact</span>
                                                <div className="flex flex-col space-y-1.5">
                                                    {lead.email && (
                                                        <span className="text-xs font-medium text-slate-600 flex items-center">
                                                            <Mail className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                                            {lead.email}
                                                        </span>
                                                    )}
                                                    {lead.phone && (
                                                        <span className="text-xs font-medium text-slate-600 flex items-center">
                                                            <Phone className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                                            {lead.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Details</span>
                                                <span className="text-xs font-bold text-slate-700 truncate">{lead.source || '-'}</span>
                                                <span className="text-[10px] text-slate-500">
                                                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600">{lead.profiles?.full_name || 'Unassigned'}</span>
                                                </div>
                                                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleEditLead(lead, 'calendar')}
                                                        className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center"
                                                    >
                                                        <Calendar className="h-3.5 w-3.5 mr-1" /> Calendar
                                                    </button>
                                                    {lead.status !== 'converted' && (
                                                        <button
                                                            onClick={() => { setLeadToConvert(lead); setIsDealModalOpen(true); }}
                                                            className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center"
                                                        >
                                                            <IndianRupee className="h-3.5 w-3.5 mr-1" /> Convert
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                leadToEdit={selectedLead}
                initialTab={modalInitialTab}
                onSuccess={fetchLeads}
                employees={employees}
            />
            <DealModal
                isOpen={isDealModalOpen}
                onClose={() => { setIsDealModalOpen(false); setLeadToConvert(null); }}
                leadToConvert={leadToConvert}
                onSuccess={() => { fetchLeads(); setIsDealModalOpen(false); }}
            />
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setLeadToFollowup(null); }}
                initialLeadId={leadToFollowup?.id}
                onSuccess={() => {
                    setSyncMsg({ type: 'success', text: 'Follow-up scheduled!' });
                    setTimeout(() => setSyncMsg(null), 3000);
                }}
            />
        </DashboardLayout >
    );
};

export default Leads;
