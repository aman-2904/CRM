import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';
import api from '../services/api';
import { Users, IndianRupee, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
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

        fetchDashboardData();
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h1>

            {/* Missed Tasks Alert */}
            {missedTasks.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-red-800">{missedTasks.length} overdue follow-up{missedTasks.length > 1 ? 's' : ''} need attention!</h4>
                        <p className="text-sm text-red-600 mt-1">
                            {missedTasks.map(t => t.leads?.first_name || 'Lead').join(', ')}
                        </p>
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
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Sources</h3>
                    <div className="h-72">
                        {leadSourceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leadSourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {leadSourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No lead source data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Deals */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Recent Deals</h3>
                    </div>
                    {recentDeals.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {recentDeals.map((deal) => (
                                <li key={deal.id} className="px-6 py-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{deal.name || 'Unnamed Deal'}</p>
                                            <p className="text-sm text-gray-500">{deal.leads?.company || deal.leads?.first_name || 'No lead'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-green-600">{formatCurrency(deal.amount)}</p>
                                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStageColor(deal.stage)}`}>
                                                {deal.stage?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-gray-400">No deals yet</div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
