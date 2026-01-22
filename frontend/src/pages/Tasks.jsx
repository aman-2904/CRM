import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import TaskModal from '../components/Tasks/TaskModal';
import api from '../services/api';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, Plus, ChevronRight, User } from 'lucide-react';
import { cn } from '../utils/cn';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today'); // today, upcoming, missed, completed
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const type = activeTab === 'completed' ? null : activeTab;
            const status = activeTab === 'completed' ? 'completed' : 'pending';

            const response = await api.get('/followups', {
                params: { type, status }
            });
            setTasks(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [activeTab]);

    const handleMarkComplete = async (taskId) => {
        try {
            await api.put(`/followups/${taskId}`, { status: 'completed' });
            fetchTasks();
        } catch (error) {
            alert('Failed to update task');
        }
    };

    const getStatusIcon = (task) => {
        const isMissed = new Date(task.scheduled_at) < new Date() && task.status === 'pending';
        if (task.status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (isMissed) return <AlertCircle className="h-5 w-5 text-red-500" />;
        return <Clock className="h-5 w-5 text-blue-500" />;
    };

    const tabs = [
        { id: 'today', label: "Today's Tasks" },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'missed', label: 'Missed' },
        { id: 'completed', label: 'Completed' },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
                    <p className="text-gray-500 mt-1">Manage your follow-ups and daily activities</p>
                </div>
                <button
                    onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    Schedule Follow-up
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1.5 rounded-2xl mb-8 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-2.5 text-sm font-bold rounded-xl transition-all",
                            activeTab === tab.id
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p>Loading tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                        <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-1">
                            Everything is clear! Or maybe it's time to schedule some new follow-ups.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-gray-100 transition-all cursor-pointer"
                                onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                                            task.status === 'completed' ? "bg-green-50" : "bg-blue-50"
                                        )}>
                                            {getStatusIcon(task)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                Follow up with {task.leads?.first_name} {task.leads?.last_name}
                                            </h4>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                                    {new Date(task.scheduled_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                                    {new Date(task.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {task.profiles?.full_name && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <User className="h-3.5 w-3.5 mr-1" />
                                                        {task.profiles.full_name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {task.status === 'pending' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMarkComplete(task.id); }}
                                                className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                            >
                                                Mark Done
                                            </button>
                                        )}
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                                {task.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 text-sm text-gray-600 italic">
                                        "{task.notes}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                taskToEdit={selectedTask}
                onSuccess={fetchTasks}
            />
        </DashboardLayout>
    );
};

export default Tasks;
