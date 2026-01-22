import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';
import { Users, Briefcase, CheckSquare, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const EmployeeDashboard = () => {
    const [stats, setStats] = useState([
        { title: "My Leads", value: "—", icon: Users, description: "Loading..." },
        { title: "Pending Tasks", value: "—", icon: CheckSquare, description: "Loading..." },
        { title: "Closed Deals", value: "8", icon: Briefcase, trend: "+2 this month", trendUp: true },
    ]);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [missedTasks, setMissedTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [leadsRes, todayRes, missedRes] = await Promise.all([
                    api.get('/leads'),
                    api.get('/followups?type=today'),
                    api.get('/followups?type=missed')
                ]);

                const leadsCount = leadsRes.data.data?.length || 0;
                const todayCount = todayRes.data.data?.length || 0;
                const missedCount = missedRes.data.data?.length || 0;

                setStats([
                    { title: "My Leads", value: String(leadsCount), icon: Users, description: "Total assigned" },
                    { title: "Today's Tasks", value: String(todayCount), icon: CheckSquare, description: missedCount > 0 ? `${missedCount} overdue` : "All clear!", trendUp: missedCount === 0 },
                    { title: "Closed Deals", value: "8", icon: Briefcase, trend: "+2 this month", trendUp: true },
                ]);

                setTodaysTasks(todayRes.data.data?.slice(0, 5) || []);
                setMissedTasks(missedRes.data.data?.slice(0, 3) || []);
            } catch (error) {
                console.error('Dashboard data fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleMarkComplete = async (taskId) => {
        try {
            await api.put(`/followups/${taskId}`, { status: 'completed' });
            // Refresh data
            const [todayRes, missedRes] = await Promise.all([
                api.get('/followups?type=today'),
                api.get('/followups?type=missed')
            ]);
            setTodaysTasks(todayRes.data.data?.slice(0, 5) || []);
            setMissedTasks(missedRes.data.data?.slice(0, 3) || []);
        } catch (error) {
            alert('Failed to update task');
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Workspace</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Missed Tasks Alert */}
            {missedTasks.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-red-800">You have {missedTasks.length} overdue follow-up{missedTasks.length > 1 ? 's' : ''}!</h4>
                        <p className="text-sm text-red-600 mt-1">
                            {missedTasks.map(t => `${t.leads?.first_name || 'Lead'}`).join(', ')}
                        </p>
                        <Link to="/dashboard/tasks" className="text-sm font-bold text-red-700 hover:underline mt-2 inline-block">
                            View all tasks →
                        </Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Tasks List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Today's Follow-ups
                        </h3>
                        <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : todaysTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-green-400" />
                            <p>No tasks scheduled for today!</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {todaysTasks.map((task) => (
                                <li key={task.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 mr-4">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Follow up with {task.leads?.first_name} {task.leads?.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(task.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleMarkComplete(task.id)}
                                        className="px-3 py-1.5 text-xs font-bold bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                    >
                                        Done
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="px-6 py-3 border-t border-gray-100">
                        <Link to="/dashboard/tasks" className="text-sm font-bold text-blue-600 hover:underline">
                            View all tasks →
                        </Link>
                    </div>
                </div>

                {/* Quick Stats Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <Link
                            to="/dashboard/leads"
                            className="block p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-blue-600" />
                                <span className="font-medium text-blue-900">View All Leads</span>
                            </div>
                        </Link>
                        <Link
                            to="/dashboard/tasks"
                            className="block p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <CheckSquare className="h-5 w-5 text-indigo-600" />
                                <span className="font-medium text-indigo-900">Schedule Follow-up</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDashboard;
