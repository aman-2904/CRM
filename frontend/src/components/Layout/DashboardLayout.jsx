import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    PieChart,
    Briefcase,
    CheckSquare
} from 'lucide-react';
import { cn } from '../../utils/cn';

const DashboardLayout = ({ children }) => {
    const { user, role, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
    };

    const navItems = role === 'admin' ? [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Leads', href: '/admin/leads', icon: Users },
        { name: 'Deals', href: '/dashboard/deals', icon: Briefcase },
        { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
        { name: 'Team', href: '/admin/employees', icon: Users },
        { name: 'Reports', href: '/admin/reports', icon: PieChart },
        { name: 'Activity', href: '/admin/activity', icon: CheckSquare },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ] : [
        { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Leads', href: '/dashboard/leads', icon: Users },
        { name: 'Deals', href: '/dashboard/deals', icon: Briefcase },
        { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    ];

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transition-transform transform md:translate-x-0",
                "bg-slate-900 text-slate-300 shadow-2xl flex flex-col", // Added flex flex-col
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="flex-shrink-0 flex items-center justify-between h-20 px-6 bg-slate-950/30 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-white leading-tight">
                                CRM Pro
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                                Workspace
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* User Profile Card */}
                    <div className="px-4 py-6">
                        <div className="group flex items-center p-3.5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-sm">
                            <div className="flex-shrink-0 relative">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-inner ring-2 ring-slate-900">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900"></div>
                            </div>
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate group-hover:text-blue-200 transition-colors">
                                    {user?.user_metadata?.full_name || 'User'}
                                </p>
                                <p className="text-xs font-medium text-slate-500 capitalize">{role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "group flex items-center px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {/* Active Indicator Glow */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100" />
                                    )}

                                    {/* Hover Glow */}
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <item.icon
                                        className={cn(
                                            "mr-3 h-5 w-5 flex-shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110",
                                            isActive ? "text-white" : "text-slate-500 group-hover:text-blue-300"
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span className="relative z-10">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Buttons */}
                <div className="flex-shrink-0 p-4 border-t border-white/5 bg-slate-950/30">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 group border border-transparent hover:border-rose-500/20"
                    >
                        <LogOut className="mr-3 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300 bg-slate-50/50 min-h-screen">

                {/* Mobile Header */}
                <div className="sticky top-0 z-10 md:hidden flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                    <button
                        type="button"
                        className="px-4 text-slate-500 focus:outline-none md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 flex justify-center items-center">
                        <span className="font-bold text-slate-800 tracking-tight">CRM Pro</span>
                    </div>
                </div>

                <main className="flex-1">
                    <div className="py-8">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
