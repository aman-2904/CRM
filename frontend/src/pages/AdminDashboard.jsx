import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';
import api from '../services/api';
import { Users, IndianRupee, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import SheetSyncPanel from '../components/Dashboard/SheetSyncPanel';
import LeadFormModal from '../components/Leads/LeadFormModal';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState([
        { title: "Total Leads", value: "—", icon: Users, trend: "Loading...", trendUp: true },
        { title: "Active Deals", value: "—", icon: Activity, trend: "Loading...", trendUp: true },
        { title: "Won Revenue", value: "—", icon: IndianRupee, trend: "Loading...", trendUp: true },
        { title: "Conversion Rate", value: "—", icon: TrendingUp, trend: "Loading...", trendUp: true },
    ]);
    const [leadSourceData, setLeadSourceData] = useState([]);
    const [recentDeals, setRecentDeals] = useState([]);
    const [missedTasks, setMissedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [modalInitialTab, setModalInitialTab] = useState('profile');
    const [employees, setEmployees] = useState([]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [leadsRes, dealsRes, dealStatsRes, missedRes] = await Promise.all([
                    api.get('/leads'),
                    api.get('/deals'),
                    api.get('/deals/stats'),
                    api.get('/followups?type=missed')
                ]);

                const leads = leadsRes.data.data || [];
                const deals = dealsRes.data.data || [];
                const dealStats = dealStatsRes.data.data || {};
                const missed = missedRes.data.data || [];

                // Calculate stats
                const totalLeads = leads.length;
                const convertedLeads = leads.filter(l => l.status === 'converted').length;
                const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

                setStats([
                    { title: "Total Leads", value: String(totalLeads), icon: Users, trend: `${convertedLeads} converted`, trendUp: true },
                    { title: "Active Deals", value: String(dealStats.inPipeline || 0), icon: Activity, trend: `${dealStats.total || 0} total`, trendUp: true },
                    { title: "Won Revenue", value: formatCurrency(dealStats.wonValue || 0), icon: IndianRupee, trend: `${dealStats.won || 0} deals won`, trendUp: true },
                    { title: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, trend: `${dealStats.lost || 0} lost`, trendUp: parseFloat(conversionRate) > 20 },
                ]);

                // Lead sources for pie chart
                const sourceCounts = {};
                leads.forEach(lead => {
                    const source = lead.source || 'Unknown';
                    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
                });
                setLeadSourceData(Object.entries(sourceCounts).map(([name, value]) => ({ name, value })));

                // Recent deals
                setRecentDeals(deals.slice(0, 5));
                setMissedTasks(missed.slice(0, 3));

            } catch (error) {
                console.error('Dashboard data fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        const fetchEmployees = async () => {
            try {
                const response = await api.get('/users/employees');
                setEmployees(response.data.data || []);
            } catch (err) { }
        };

        fetchDashboardData();
        fetchEmployees();
    }, []);

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
    };

    const getStageColor = (stage) => {
        switch (stage) {
            case 'closed_won': return 'bg-green-100 text-green-800';
            case 'closed_lost': return 'bg-red-100 text-red-800';
            case 'negotiation': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center">
                        <Activity className="w-3 h-3 mr-1.5 text-blue-500" /> Real-time Performance Overview
                    </p>
                </div>
            </div>

            {/* Missed Tasks Alert */}
            {missedTasks.length > 0 && (
                <div className="mb-8 bg-rose-50/50 backdrop-blur-sm border border-rose-100 rounded-[2rem] p-5 flex items-start gap-4 shadow-xl shadow-rose-100/20 animate-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200/50 ring-2 ring-white">
                        <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-black text-rose-900 text-sm uppercase tracking-tight">{missedTasks.length} Overdue Follow-ups!</h4>
                        <div className="flex gap-2 mt-2">
                            {missedTasks.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { setSelectedLead(t.leads); setModalInitialTab('calendar'); setIsLeadModalOpen(true); }}
                                    className="px-2 py-1 bg-white/50 hover:bg-white text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-100 transition-all active:scale-95"
                                >
                                    {t.leads?.first_name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Lead Sources Pie Chart */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-[2rem] p-7 transition-all duration-500 hover:shadow-blue-100/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Lead Distribution</h3>
                        <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">Sources</div>
                    </div>
                    <div className="h-72">
                        {leadSourceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leadSourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        fill="#3b82f6"
                                        paddingAngle={8}
                                        dataKey="value"
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {leadSourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                <Users className="w-12 h-12 opacity-20 mb-2" />
                                <span className="text-sm font-bold opacity-40">Awaiting lead data...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Deals */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-emerald-100/50">
                    <div className="px-7 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Live Deals</h3>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Revenue Flow</div>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                        {recentDeals.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {recentDeals.map((deal) => (
                                    <li
                                        key={deal.id}
                                        className="px-7 py-5 hover:bg-white/50 transition-colors group cursor-pointer"
                                        onClick={() => { setSelectedLead(deal.leads); setModalInitialTab('calendar'); setIsLeadModalOpen(true); }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                                    {(deal.name?.[0] || 'D').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{deal.name || 'Unnamed Deal'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{deal.leads?.first_name || 'Prospect'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-emerald-600">{formatCurrency(deal.amount)}</p>
                                                <span className={`inline-block px-2.5 py-0.5 mt-1 text-[9px] font-black uppercase tracking-widest rounded-full border transition-all ${getStageColor(deal.stage).replace('100', '50').replace('800', '600')}`}>
                                                    {deal.stage?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-72 text-slate-300">
                                <Activity className="w-12 h-12 opacity-20 mb-2" />
                                <span className="text-sm font-bold opacity-40">No deals in pipeline</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Google Sheets Sync */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <SheetSyncPanel />
            </div>

            <LeadFormModal
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
                leadToEdit={selectedLead}
                initialTab={modalInitialTab}
                onSuccess={() => { }}
                employees={employees}
            />
        </DashboardLayout>
    );
};

export default AdminDashboard;
