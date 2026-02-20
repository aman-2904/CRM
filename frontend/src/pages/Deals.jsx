import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import DealModal from '../components/Deals/DealModal';
import api from '../services/api';
import { IndianRupee, TrendingUp, TrendingDown, Plus, Building, Calendar, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

const Deals = () => {
    const [deals, setDeals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);

    const stages = [
        { id: 'prospecting', label: 'Prospecting', color: 'bg-blue-500' },
        { id: 'negotiation', label: 'Negotiation', color: 'bg-yellow-500' },
        { id: 'closed_won', label: 'Won', color: 'bg-green-500' },
        { id: 'closed_lost', label: 'Lost', color: 'bg-red-500' }
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dealsRes, statsRes] = await Promise.all([
                api.get('/deals'),
                api.get('/deals/stats')
            ]);
            setDeals(dealsRes.data.data || []);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch deals', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStageChange = async (dealId, newStage) => {
        try {
            await api.put(`/deals/${dealId}`, { stage: newStage });
            fetchData();
        } catch (error) {
            alert('Failed to update deal');
        }
    };

    const handleDeleteDeal = async (e, dealId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this deal? This cannot be undone.')) return;
        try {
            await api.delete(`/deals/${dealId}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete deal: ' + (error.response?.data?.error || error.message));
        }
    };

    const getDealsForStage = (stageId) => deals.filter(d => d.stage === stageId);

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
                    <p className="text-gray-500 mt-1">Track and manage your deals</p>
                </div>
                <button
                    onClick={() => { setSelectedDeal(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    New Deal
                </button>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <IndianRupee className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pipeline Value</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.pipelineValue)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Won Revenue</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.wonValue)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <span className="text-lg font-bold text-emerald-600">{stats.won}</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Won Deals</p>
                                <p className="text-xl font-bold text-gray-900">{stats.won} deals</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Lost Deals</p>
                                <p className="text-xl font-bold text-gray-900">{stats.lost} deals</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pipeline Columns */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stages.map((stage) => (
                        <div key={stage.id} className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full", stage.color)}></div>
                                    <h3 className="font-bold text-gray-700">{stage.label}</h3>
                                </div>
                                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-lg">
                                    {getDealsForStage(stage.id).length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {getDealsForStage(stage.id).map((deal) => (
                                    <div
                                        key={deal.id}
                                        onClick={() => { setSelectedDeal(deal); setIsModalOpen(true); }}
                                        className="bg-white rounded-xl p-4 border border-gray-100 hover:border-green-200 hover:shadow-lg cursor-pointer transition-all"
                                    >
                                        <h4 className="font-bold text-gray-900 mb-2">{deal.name || 'Unnamed Deal'}</h4>
                                        <div className="space-y-1.5">
                                            {deal.leads && (
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Building className="h-3.5 w-3.5 mr-1.5" />
                                                    {deal.leads.company || `${deal.leads.first_name} ${deal.leads.last_name}`}
                                                </div>
                                            )}
                                            <div className="flex items-center text-sm font-bold text-green-600">
                                                <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                                                {formatCurrency(deal.amount)}
                                            </div>
                                            {deal.expected_close_date && (
                                                <div className="flex items-center text-sm text-gray-400">
                                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                    {new Date(deal.expected_close_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        {/* Quick Stage Actions + Delete */}
                                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1">
                                            <div className="flex gap-1 flex-1">
                                                {stages.filter(s => s.id !== deal.stage).slice(0, 2).map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={(e) => { e.stopPropagation(); handleStageChange(deal.id, s.id); }}
                                                        className={cn(
                                                            "text-xs px-2 py-1 rounded-lg transition-all",
                                                            s.id === 'closed_won' ? "bg-green-50 text-green-600 hover:bg-green-100" :
                                                                s.id === 'closed_lost' ? "bg-red-50 text-red-600 hover:bg-red-100" :
                                                                    "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        )}
                                                    >
                                                        → {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteDeal(e, deal.id)}
                                                className="ml-auto p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete deal"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {getDealsForStage(stage.id).length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No deals in this stage
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                dealToEdit={selectedDeal}
                onSuccess={fetchData}
            />
        </DashboardLayout>
    );
};

export default Deals;
