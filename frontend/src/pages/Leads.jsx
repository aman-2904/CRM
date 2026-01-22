import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import LeadFormModal from '../components/Leads/LeadFormModal';
import DealModal from '../components/Deals/DealModal';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, Phone, Mail, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [leadToConvert, setLeadToConvert] = useState(null);
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const { role, loading: authLoading } = useAuth();

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

    // Filter Logic
    const filteredLeads = (leads || []).filter(lead => {
        const firstName = lead.first_name || '';
        const lastName = lead.last_name || '';
        const email = lead.email || '';
        const company = lead.company || '';
        const search = searchTerm.toLowerCase();

        return (
            firstName.toLowerCase().includes(search) ||
            lastName.toLowerCase().includes(search) ||
            email.toLowerCase().includes(search) ||
            company.toLowerCase().includes(search)
        );
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'contacted': return 'bg-yellow-100 text-yellow-800';
            case 'interested': return 'bg-purple-100 text-purple-800';
            case 'converted': return 'bg-green-100 text-green-800';
            case 'lost': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Leads Management</h1>
                <button
                    onClick={handleAddLead}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Add New Lead
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                    placeholder="Search leads by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Leads Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="min-w-full divide-y divide-gray-200">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading leads...</div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No leads found.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {(lead.first_name?.[0] || '?').toUpperCase()}
                                                    {(lead.last_name?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{lead.first_name} {lead.last_name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                                                        {lead.email && <span className="flex items-center mr-2"><Mail className="h-3 w-3 mr-1" />{lead.email}</span>}
                                                        {lead.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" />{lead.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {lead.company || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {lead.source || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEditLead(lead)} className="text-blue-600 hover:text-blue-900 mr-3">
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                            {lead.status !== 'converted' && (
                                                <button
                                                    onClick={() => { setLeadToConvert(lead); setIsDealModalOpen(true); }}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                    title="Convert to Deal"
                                                >
                                                    <DollarSign className="h-5 w-5" />
                                                </button>
                                            )}
                                            {role === 'admin' && (
                                                <button onClick={() => handleDeleteLead(lead.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
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
