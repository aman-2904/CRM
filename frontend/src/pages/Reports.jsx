import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../services/api';
import { exportToCSV, exportToPDF, formatCurrency } from '../utils/exportUtils';
import { FileText, Download, Calendar, Users, IndianRupee, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reports = () => {
    const [activeTab, setActiveTab] = useState('leads');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const res = await api.get(`/reports/${activeTab}`, { params });
            setData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch report', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeTab]);

    const handleApplyFilters = () => {
        fetchReport();
    };

    const tabs = [
        { id: 'leads', label: 'Lead Report', icon: Users },
        { id: 'sales', label: 'Sales Report', icon: IndianRupee },
        { id: 'employees', label: 'Team Performance', icon: BarChart3 }
    ];

    const handleExportCSV = () => {
        if (activeTab === 'leads' && data?.leads) {
            exportToCSV(data.leads, 'lead_report', [
                { label: 'Name', accessor: r => `${r.profiles?.full_name || 'Unassigned'}` },
                { label: 'Status', key: 'status' },
                { label: 'Source', key: 'source' },
                { label: 'Created', accessor: r => new Date(r.created_at).toLocaleDateString() }
            ]);
        } else if (activeTab === 'sales' && data?.deals) {
            exportToCSV(data.deals, 'sales_report', [
                { label: 'Deal', key: 'name' },
                { label: 'Stage', key: 'stage' },
                { label: 'Amount', accessor: r => r.amount || 0 },
                { label: 'Owner', accessor: r => r.profiles?.full_name || 'Unknown' },
                { label: 'Created', accessor: r => new Date(r.created_at).toLocaleDateString() }
            ]);
        } else if (activeTab === 'employees' && data?.employees) {
            exportToCSV(data.employees, 'team_report', [
                { label: 'Name', key: 'name' },
                { label: 'Role', key: 'role' },
                { label: 'Leads', key: 'leads_handled' },
                { label: 'Deals Won', key: 'deals_won' },
                { label: 'Revenue', key: 'revenue' },
                { label: 'Conv. Rate', accessor: r => `${r.conversion_rate}%` }
            ]);
        }
    };

    const handleExportPDF = () => {
        const titles = { leads: 'Lead Report', sales: 'Sales Report', employees: 'Team Performance Report' };
        exportToPDF('report-content', titles[activeTab]);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-500 mt-1">Generate and export business reports</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">
                        <Download className="h-4 w-4" /> CSV
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                        <FileText className="h-4 w-4" /> PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1.5 rounded-2xl mb-6 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all",
                            activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Date Filters */}
            <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 flex flex-wrap items-center gap-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">From:</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">To:</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <button onClick={handleApplyFilters} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800">
                    Apply Filters
                </button>
            </div>

            {/* Report Content */}
            <div id="report-content">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Lead Report */}
                        {activeTab === 'leads' && data && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100">
                                        <p className="stat-value text-2xl font-bold text-blue-600">{data.total}</p>
                                        <p className="stat-label text-sm text-gray-500">Total Leads</p>
                                    </div>
                                    {data.byStatus?.slice(0, 3).map((s, i) => (
                                        <div key={i} className="stat-card bg-white rounded-2xl p-5 border border-gray-100">
                                            <p className="stat-value text-2xl font-bold text-gray-900">{s.count}</p>
                                            <p className="stat-label text-sm text-gray-500 capitalize">{s.name}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4">Leads by Source</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={data.bySource} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                                        {data.bySource?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4">Leads by Status</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.byStatus}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sales Report */}
                        {activeTab === 'sales' && data && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100">
                                        <p className="stat-value text-2xl font-bold text-blue-600">{data.total}</p>
                                        <p className="stat-label text-sm text-gray-500">Total Deals</p>
                                    </div>
                                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100">
                                        <p className="stat-value text-2xl font-bold text-green-600">{formatCurrency(data.wonValue)}</p>
                                        <p className="stat-label text-sm text-gray-500">Won Revenue</p>
                                    </div>
                                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100">
                                        <p className="stat-value text-2xl font-bold text-yellow-600">{formatCurrency(data.pipelineValue)}</p>
                                        <p className="stat-label text-sm text-gray-500">Pipeline Value</p>
                                    </div>
                                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100">
                                        <p className="stat-value text-2xl font-bold text-red-600">{formatCurrency(data.lostValue)}</p>
                                        <p className="stat-label text-sm text-gray-500">Lost Value</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4">Deals by Stage</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.byStage} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Employee Report */}
                        {activeTab === 'employees' && data && (
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Employee</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Leads</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Converted</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Deals Won</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Revenue</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Conv. Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.employees?.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{emp.name}</td>
                                                <td className="px-6 py-4 text-center">{emp.leads_handled}</td>
                                                <td className="px-6 py-4 text-center">{emp.leads_converted}</td>
                                                <td className="px-6 py-4 text-center font-bold text-green-600">{emp.deals_won}</td>
                                                <td className="px-6 py-4 text-center font-bold text-emerald-600">{formatCurrency(emp.revenue)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn("px-2 py-1 rounded-lg text-sm font-bold", emp.conversion_rate >= 20 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600")}>
                                                        {emp.conversion_rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Reports;
