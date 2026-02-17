import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../services/api';
import { Activity, User, Calendar, Filter, Clock, Edit, Phone, Mail, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const ActivityLog = () => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', user_id: '', from: '', to: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.type) params.type = filters.type;
            if (filters.user_id) params.user_id = filters.user_id;
            if (filters.from) params.from = filters.from;
            if (filters.to) params.to = filters.to;

            const [activitiesRes, statsRes] = await Promise.all([
                api.get('/activities', { params }),
                api.get('/activities/stats')
            ]);

            setActivities(activitiesRes.data.data || []);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch activities', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Fetch users for filter dropdown
        api.get('/employees').then(res => {
            setUsers(res.data.data || []);
        }).catch(err => console.error('Failed to fetch users', err));
    }, []);

    const handleApplyFilters = () => {
        fetchData();
    };

    const getActivityIcon = (type) => {
        const icons = {
            'login': <LogIn className="h-4 w-4" />,
            'logout': <LogOut className="h-4 w-4" />,
            'log': <Activity className="h-4 w-4" />,
            'call': <Phone className="h-4 w-4" />,
            'email': <Mail className="h-4 w-4" />,
            'meeting': <User className="h-4 w-4" />,
            'note': <Edit className="h-4 w-4" />
        };
        return icons[type] || <Activity className="h-4 w-4" />;
    };

    const getActivityColor = (type) => {
        const colors = {
            'login': 'bg-green-100 text-green-600',
            'logout': 'bg-gray-100 text-gray-600',
            'log': 'bg-blue-100 text-blue-600',
            'call': 'bg-indigo-100 text-indigo-600',
            'email': 'bg-purple-100 text-purple-600',
            'meeting': 'bg-yellow-100 text-yellow-600',
            'note': 'bg-pink-100 text-pink-600'
        };
        return colors[type] || 'bg-gray-100 text-gray-600';
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const activityTypes = [
        { value: '', label: 'All Types' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' },
        { value: 'log', label: 'System Log' },
        { value: 'call', label: 'Call' },
        { value: 'email', label: 'Email' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'note', label: 'Note' }
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
                    <p className="text-gray-500 mt-1">Track all actions across your CRM</p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Activities</p>
                                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Today</p>
                                <p className="text-xl font-bold text-gray-900">{stats.today}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 col-span-2 md:col-span-1">
                        <p className="text-sm text-gray-500 mb-2">By Type</p>
                        <div className="flex flex-wrap gap-2">
                            {stats.byType?.slice(0, 4).map((t, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 capitalize">
                                    {t.type}: {t.count}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 flex flex-wrap items-center gap-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    {activityTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                <select
                    value={filters.user_id}
                    onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">All Users</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="From"
                />
                <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="To"
                />
                <button onClick={handleApplyFilters} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800">
                    Apply
                </button>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        Loading activities...
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No activities found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {activities.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", getActivityColor(activity.type))}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {activity.description}
                                            </p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {formatTimeAgo(activity.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-500">
                                                {activity.profiles?.full_name || activity.profiles?.email || 'System'}
                                            </span>
                                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize", getActivityColor(activity.type))}>
                                                {activity.type}
                                            </span>
                                            {activity.leads && (
                                                <span className="text-xs text-blue-600">
                                                    Lead: {activity.leads.first_name} {activity.leads.last_name}
                                                </span>
                                            )}
                                            {activity.deals && (
                                                <span className="text-xs text-green-600">
                                                    Deal: {activity.deals.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ActivityLog;
