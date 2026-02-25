import React, { useState, useEffect, Fragment } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../services/api';
import { Users, TrendingUp, IndianRupee, Award, ToggleLeft, ToggleRight, Shield, User, Trash2, X, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { Dialog, Transition } from '@headlessui/react';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, rolesRes] = await Promise.all([
                api.get('/employees'),
                api.get('/employees/roles')
            ]);
            setEmployees(empRes.data.data || []);
            setRoles(rolesRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleActive = async (employee) => {
        setUpdating(employee.id);
        try {
            await api.put(`/employees/${employee.id}`, {
                is_active: !employee.is_active
            });
            fetchData();
        } catch (error) {
            alert('Failed to update employee');
        } finally {
            setUpdating(null);
        }
    };

    const handleRoleChange = async (employeeId, roleId) => {
        setUpdating(employeeId);
        try {
            await api.put(`/employees/${employeeId}`, { role_id: roleId });
            fetchData();
        } catch (error) {
            alert('Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const handleDeleteEmployee = (employee) => {
        setEmployeeToDelete(employee);
        setPassword('');
        setError('');
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async (e) => {
        if (e) e.preventDefault();
        if (!password) {
            setError('Account password is required');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            await api.delete(`/employees/${employeeToDelete.id}`, {
                data: { password }
            });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Verification failed. Please check your password.';
            setError(errorMsg);
        } finally {
            setIsVerifying(false);
        }
    };

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
    };

    // Calculate team totals
    const teamStats = {
        totalEmployees: employees.length,
        totalLeads: employees.reduce((sum, e) => sum + (e.stats?.leads_handled || 0), 0),
        totalDeals: employees.reduce((sum, e) => sum + (e.stats?.deals_closed || 0), 0),
        totalRevenue: employees.reduce((sum, e) => sum + (e.stats?.revenue || 0), 0)
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-500 mt-1">Manage employees and track performance</p>
                </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Team Size</p>
                            <p className="text-xl font-bold text-gray-900">{teamStats.totalEmployees}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Leads</p>
                            <p className="text-xl font-bold text-gray-900">{teamStats.totalLeads}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Deals Won</p>
                            <p className="text-xl font-bold text-gray-900">{teamStats.totalDeals}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <IndianRupee className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Team Revenue</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(teamStats.totalRevenue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">All Employees</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        Loading team...
                    </div>
                ) : employees.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No employees found</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Leads</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Deals Won</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Revenue</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Conv. Rate</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {employees.map((emp) => (
                                <tr key={emp.id} className={cn("hover:bg-gray-50 transition-colors", !emp.is_active && emp.is_active !== undefined && "opacity-50")}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                {(emp.full_name?.[0] || emp.email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{emp.full_name || 'Unnamed'}</p>
                                                <p className="text-sm text-gray-500">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={emp.role_id || ''}
                                            onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                                            disabled={updating === emp.id}
                                            className={cn(
                                                "text-sm rounded-lg border px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500",
                                                emp.role_name === 'admin' ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 border-gray-200"
                                            )}
                                        >
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-medium text-gray-900">{emp.stats?.leads_handled || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-green-600">{emp.stats?.deals_closed || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(emp.stats?.revenue || 0)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <TrendingUp className={cn("h-4 w-4", (emp.stats?.conversion_rate || 0) > 20 ? "text-green-500" : "text-gray-400")} />
                                            <span className="text-sm font-medium">{emp.stats?.conversion_rate || 0}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(emp)}
                                            disabled={updating === emp.id}
                                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                            title={emp.is_active !== false ? 'Click to disable' : 'Click to enable'}
                                        >
                                            {emp.is_active !== false ? (
                                                <ToggleRight className="h-6 w-6 text-green-500" />
                                            ) : (
                                                <ToggleLeft className="h-6 w-6 text-gray-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleDeleteEmployee(emp)}
                                            disabled={updating === emp.id}
                                            className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete Employee"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Verification Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[100]" onClose={() => !isVerifying && setIsModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-slate-100">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            disabled={isVerifying}
                                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <Dialog.Title as="h3" className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                        Security Verification
                                    </Dialog.Title>
                                    <p className="mt-2 text-sm font-medium text-slate-500">
                                        Deleting <span className="text-slate-900 font-bold">{employeeToDelete?.full_name || 'this employee'}</span> is permanent.
                                        Please enter your admin password to confirm.
                                    </p>

                                    {error && (
                                        <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <p className="text-xs font-bold leading-tight">{error}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleConfirmDelete} className="mt-6 space-y-4">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter admin password"
                                                autoFocus
                                                disabled={isVerifying}
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                disabled={isVerifying}
                                                className="flex-1 px-4 py-3.5 bg-white border border-slate-200 text-sm font-black text-slate-600 rounded-2xl hover:bg-slate-50 transition-all duration-300"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isVerifying || !password}
                                                className="flex-1 px-4 py-3.5 bg-rose-600 text-white text-sm font-black rounded-2xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-200 border-b-4 border-rose-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    'Confirm Delete'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </DashboardLayout>
    );
};

export default Employees;
