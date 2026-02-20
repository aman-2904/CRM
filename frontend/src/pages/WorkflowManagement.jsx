import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Plus, Trash2, Save, ArrowRight, Zap, Users, BarChart3, RefreshCw, GitBranch, Clock, RotateCcw } from 'lucide-react';
import api from '../services/api';

// ─── Toggle Component ────────────────────────────────────────────────────────
const Toggle = ({ enabled, onToggle }) => (
    <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
    >
        <span
            className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            style={{ width: 18, height: 18 }}
        />
    </button>
);

// ─── Avatar Component ─────────────────────────────────────────────────────────
const Avatar = ({ name, gradient }) => (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${gradient || 'bg-slate-400'}`}>
        {name?.[0]?.toUpperCase() || '?'}
    </div>
);

const GRADIENTS = [
    'bg-gradient-to-br from-pink-400 to-rose-500',
    'bg-gradient-to-br from-emerald-400 to-teal-500',
    'bg-gradient-to-br from-blue-400 to-indigo-500',
    'bg-gradient-to-br from-amber-400 to-orange-500',
    'bg-gradient-to-br from-violet-400 to-purple-500',
    'bg-gradient-to-br from-cyan-400 to-sky-500',
];

// ─── Main Component ───────────────────────────────────────────────────────────
const WorkflowManagement = () => {
    const [autoAssign, setAutoAssign] = useState(true);
    const [distributionType, setDistributionType] = useState('percentage');
    const [rules, setRules] = useState([]);
    const [sheetMappings, setSheetMappings] = useState([]);
    const [discoveredSheets, setDiscoveredSheets] = useState([]);
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [previewCount, setPreviewCount] = useState(10);
    const [error, setError] = useState(null);

    // Bulk Assignment State
    const [bulkTimeframe, setBulkTimeframe] = useState('7');
    const [unassignedCount, setUnassignedCount] = useState(0);
    const [assignedCount, setAssignedCount] = useState(0);
    const [checkingCount, setCheckingCount] = useState(false);
    const [bulkRunning, setBulkRunning] = useState(false);
    const [revokeRunning, setRevokeRunning] = useState(false);

    // Load employees, settings, and discovered sheets
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [empRes, configRes, discoveryRes, unRes, asRes] = await Promise.all([
                    api.get('/users/employees'),
                    api.get('/workflow'),
                    api.get('/workflow/discovered-sheets'),
                    api.get(`/workflow/unassigned-count?timeframe=${bulkTimeframe}`),
                    api.get(`/workflow/assigned-count?timeframe=${bulkTimeframe}`)
                ]);

                const emps = empRes.data.data || [];
                setAvailableEmployees(emps);
                setDiscoveredSheets(discoveryRes.data.data || []);
                setUnassignedCount(unRes.data.count || 0);
                setAssignedCount(asRes.data.count || 0);

                if (configRes.data.data) {
                    const cfg = configRes.data.data;
                    setAutoAssign(cfg.auto_assign_enabled);
                    setDistributionType(cfg.distribution_type);
                    setRules(cfg.rules || []);
                    setSheetMappings(cfg.sheet_mappings || []);
                }
            } catch (err) {
                console.error('Failed to load workflow data', err);
                setError('Failed to load settings. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch count when timeframe changes (skipping first load which is handled above)
    useEffect(() => {
        if (loading) return;
        const fetchCounts = async () => {
            setCheckingCount(true);
            try {
                const [unRes, asRes] = await Promise.all([
                    api.get(`/workflow/unassigned-count?timeframe=${bulkTimeframe}`),
                    api.get(`/workflow/assigned-count?timeframe=${bulkTimeframe}`)
                ]);
                setUnassignedCount(unRes.data.count || 0);
                setAssignedCount(asRes.data.count || 0);
            } catch (err) {
                console.error(err);
            } finally {
                setCheckingCount(false);
            }
        };
        fetchCounts();
    }, [bulkTimeframe]);

    const handleRunBulkAssign = async () => {
        if (!unassignedCount) return;
        if (!window.confirm(`Are you sure you want to distribute ${unassignedCount} unassigned leads?`)) return;

        setBulkRunning(true);
        try {
            const res = await api.post('/workflow/bulk-assign', { timeframe: bulkTimeframe });
            alert(`Success! Distributed ${res.data.count} leads.`);
            const [unRes, asRes] = await Promise.all([
                api.get(`/workflow/unassigned-count?timeframe=${bulkTimeframe}`),
                api.get(`/workflow/assigned-count?timeframe=${bulkTimeframe}`)
            ]);
            setUnassignedCount(unRes.data.count || 0);
            setAssignedCount(asRes.data.count || 0);
        } catch (err) {
            console.error(err);
            alert('Bulk assignment failed');
        } finally {
            setBulkRunning(false);
        }
    };

    const handleRunRevoke = async () => {
        if (!assignedCount) return;
        if (!window.confirm(`Are you sure you want to REVOKE (unassign) ${assignedCount} leads from this timeframe? They will be returned to the unassigned pool.`)) return;

        setRevokeRunning(true);
        try {
            const res = await api.post('/workflow/revoke', { timeframe: bulkTimeframe });
            alert(`Success! Revoked ${res.data.count} leads.`);
            const [unRes, asRes] = await Promise.all([
                api.get(`/workflow/unassigned-count?timeframe=${bulkTimeframe}`),
                api.get(`/workflow/assigned-count?timeframe=${bulkTimeframe}`)
            ]);
            setUnassignedCount(unRes.data.count || 0);
            setAssignedCount(asRes.data.count || 0);
        } catch (err) {
            console.error(err);
            alert('Lead revoke failed');
        } finally {
            setRevokeRunning(false);
        }
    };

    const totalPct = rules.reduce((s, r) => s + Number(r.percentage || 0), 0);

    const handleAddRule = () => {
        const used = rules.map(r => r.employee_id);
        const next = availableEmployees.find(e => !used.includes(e.id));
        if (!next) return;
        setRules(prev => [...prev, {
            employee_id: next.id,
            percentage: 0,
            active: true
        }]);
    };

    const handleRemoveRule = (id) => setRules(prev => prev.filter(r => r.employee_id !== id));

    const handleRuleChange = (id, field, value) => {
        setRules(prev => prev.map(r => r.employee_id === id ? { ...r, [field]: value } : r));
    };

    const handleAddMapping = () => {
        setSheetMappings(prev => [...prev, {
            sheet_pattern: '',
            employee_id: availableEmployees[0]?.id || ''
        }]);
    };

    const handleRemoveMapping = (idx) => {
        setSheetMappings(prev => prev.filter((_, i) => i !== idx));
    };

    const handleMappingChange = (idx, field, value) => {
        setSheetMappings(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            await api.post('/workflow', {
                auto_assign_enabled: autoAssign,
                distribution_type: distributionType,
                rules,
                sheet_mappings: sheetMappings
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            console.error('Failed to save rules', err);
            setError('Failed to save rules. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    const getEmployeeName = (id) => {
        const emp = availableEmployees.find(e => e.id === id);
        return emp ? (emp.full_name || emp.email) : 'Unknown';
    };

    // Preview calculation
    const buildPreview = (count) => {
        const activeRules = rules.filter(r => r.active && r.employee_id);
        if (!activeRules.length) return [];

        if (distributionType === 'round_robin') {
            return activeRules.map((r, i) => ({
                name: getEmployeeName(r.employee_id),
                leads: Math.floor(count / activeRules.length) + (i < count % activeRules.length ? 1 : 0),
            }));
        }

        if (distributionType === 'sheet_based') {
            return [{ name: 'Based on Tab Names (Sheet Selection)', leads: count }];
        }

        // Percentage Based: Ensure total matches count exactly
        const totalWeight = activeRules.reduce((s, r) => s + Number(r.percentage || 0), 0) || 100;

        // Use an array to track fractional parts for fair remainder distribution
        const basicDist = activeRules.map(r => {
            const exactLeads = (Number(r.percentage) / totalWeight) * count;
            return {
                name: getEmployeeName(r.employee_id),
                leads: Math.floor(exactLeads),
                remainder: exactLeads - Math.floor(exactLeads)
            };
        });

        const currentSum = basicDist.reduce((s, r) => s + r.leads, 0);
        let remaining = count - currentSum;

        // Distribute remaining leads to those with the highest fractional part
        const sorted = [...basicDist].sort((a, b) => b.remainder - a.remainder);
        for (let i = 0; i < remaining; i++) {
            const item = sorted[i % sorted.length];
            // Find the item in the original order and increment
            const original = basicDist.find(d => d.name === item.name);
            if (original) original.leads += 1;
        }

        return basicDist.map(d => ({ name: d.name, leads: d.leads }));
    };

    const preview1 = buildPreview(previewCount);
    const preview2 = buildPreview(previewCount + 1);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto pb-16 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflow Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Configure how incoming leads are automatically distributed to your team.</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* ── Card 1: Auto Assignment Toggle ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <RefreshCw className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">Enable Auto Assignment</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Automatically route new leads to team members</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${autoAssign ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {autoAssign ? 'Active' : 'Inactive'}
                            </span>
                            <Toggle enabled={autoAssign} onToggle={() => setAutoAssign(v => !v)} />
                        </div>
                    </div>
                </div>

                {/* ── Card 2: Bulk Assignment Tool ── */}
                <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${autoAssign ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">Bulk Assignment</h2>
                            <p className="text-xs text-slate-400">Retroactively assign unassigned leads by timeframe</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Timeframe & Stats */}
                        <div className="flex flex-wrap gap-6 items-end">
                            <div className="flex-[2] min-w-[280px] space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Select Timeframe</label>
                                <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1 items-center">
                                    {[
                                        { label: 'All', value: 'all' },
                                        { label: 'Today', value: '0' },
                                        { label: '7d', value: '7' },
                                        { label: '30d', value: '30' },
                                    ].map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setBulkTimeframe(t.value)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${bulkTimeframe === t.value
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 min-w-[170px] p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unassigned</p>
                                    <p className="text-xl font-black text-slate-900 leading-tight">
                                        {checkingCount ? '...' : unassignedCount}
                                    </p>
                                </div>
                                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <Users className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-[170px] p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned</p>
                                    <p className="text-xl font-black text-slate-900 leading-tight">
                                        {checkingCount ? '...' : assignedCount}
                                    </p>
                                </div>
                                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <Users className="h-4 w-4 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Actions & Info Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <p className="text-xs font-medium text-slate-500">
                                    Uses active <span className="text-slate-900 font-bold">{distributionType.replace('_', ' ')}</span> rules.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleRunRevoke}
                                    disabled={assignedCount === 0 || revokeRunning}
                                    className={`h-11 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border whitespace-nowrap ${assignedCount === 0
                                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                        : 'bg-white border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 shadow-sm'
                                        }`}
                                >
                                    <RotateCcw className={`h-4 w-4 ${revokeRunning ? 'animate-spin' : ''}`} />
                                    <span>Revoke</span>
                                </button>

                                <button
                                    onClick={handleRunBulkAssign}
                                    disabled={unassignedCount === 0 || bulkRunning}
                                    className={`h-11 px-6 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${unassignedCount === 0
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-95'
                                        }`}
                                >
                                    {bulkRunning ? 'Distributing...' : 'Distribute Now'}
                                    {!bulkRunning && <ArrowRight className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Card 3: Distribution Mode Rules ── */}
                <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${autoAssign ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">Distribution Mode</h2>
                            <p className="text-xs text-slate-400">Choose how leads should be split among the team</p>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[
                                { value: 'percentage', label: 'Percentage', desc: 'Weighted %' },
                                { value: 'round_robin', label: 'Round Robin', desc: 'Equal rotation' },
                                { value: 'sheet_based', label: 'Sheet Tab', desc: 'By sheet name' },
                            ].map(opt => (
                                <label
                                    key={opt.value}
                                    onClick={() => setDistributionType(opt.value)}
                                    className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${distributionType === opt.value
                                        ? 'border-blue-500 bg-blue-50/50'
                                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-bold ${distributionType === opt.value ? 'text-blue-700' : 'text-slate-600'}`}>{opt.label}</p>
                                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${distributionType === opt.value ? 'border-blue-600' : 'border-slate-300'}`}>
                                            {distributionType === opt.value && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{opt.desc}</p>
                                </label>
                            ))}
                        </div>

                        {/* TABLE: Percentage or Round Robin RULES */}
                        {distributionType !== 'sheet_based' && (
                            <div>
                                <div className="grid grid-cols-[1fr_120px_80px_40px] gap-4 px-2 pb-2 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</span>
                                    {distributionType === 'percentage' && <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weight %</span>}
                                    {distributionType === 'round_robin' && <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order</span>}
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Active</span>
                                    <span />
                                </div>

                                <div className="mt-3 space-y-1">
                                    {rules.map((rule, idx) => (
                                        <div key={rule.employee_id} className="grid grid-cols-[1fr_120px_80px_40px] gap-4 items-center px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={getEmployeeName(rule.employee_id)} gradient={GRADIENTS[idx % GRADIENTS.length]} />
                                                <span className="text-sm font-semibold text-slate-700 truncate">{getEmployeeName(rule.employee_id)}</span>
                                            </div>

                                            {distributionType === 'percentage' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="number"
                                                        value={rule.percentage}
                                                        onChange={(e) => handleRuleChange(rule.employee_id, 'percentage', e.target.value)}
                                                        className="w-16 text-center text-sm font-bold text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                    />
                                                    <span className="text-sm text-slate-400">%</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-slate-400 text-center">#{idx + 1}</span>
                                            )}

                                            <div className="flex justify-center">
                                                <Toggle enabled={rule.active} onToggle={() => handleRuleChange(rule.employee_id, 'active', !rule.active)} />
                                            </div>

                                            <button onClick={() => handleRemoveRule(rule.employee_id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {distributionType === 'percentage' && (
                                    <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${totalPct === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <div className={`h-1.5 w-1.5 rounded-full ${totalPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        Total: {totalPct}% {totalPct === 100 ? '— Balanced ✓' : '— Must equal 100%'}
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-start">
                                    <button onClick={handleAddRule} disabled={rules.length >= availableEmployees.length} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 disabled:opacity-30 transition-colors">
                                        <Plus className="h-4 w-4" /> Add Team Member
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* UI FOR SHEET BASED MAPPING */}
                        {distributionType === 'sheet_based' && (
                            <div className="space-y-6">
                                {/* Discovered Sheets Helper */}
                                {discoveredSheets.filter(s => !sheetMappings.some(m => m.sheet_pattern === s)).length > 0 && (
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Plus className="h-3.5 w-3.5 text-blue-600" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unassigned Sheets Found</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {discoveredSheets
                                                .filter(s => !sheetMappings.some(m => m.sheet_pattern === s))
                                                .map(sheet => (
                                                    <button
                                                        key={sheet}
                                                        onClick={() => setSheetMappings(prev => [...prev, { sheet_pattern: sheet, employee_id: availableEmployees[0]?.id || '' }])}
                                                        className="group flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 transition-all shadow-sm"
                                                    >
                                                        {sheet}
                                                        <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="grid grid-cols-[1fr_200px_40px] gap-4 px-2 pb-2 border-b border-slate-50">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sheet Tab Name / Pattern</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign To</span>
                                        <span />
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {sheetMappings.map((m, idx) => (
                                            <div key={idx} className="grid grid-cols-[1fr_200px_40px] gap-4 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. GJ AD"
                                                    value={m.sheet_pattern}
                                                    onChange={(e) => handleMappingChange(idx, 'sheet_pattern', e.target.value)}
                                                    className="w-full text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                />
                                                <select
                                                    value={m.employee_id}
                                                    onChange={(e) => handleMappingChange(idx, 'employee_id', e.target.value)}
                                                    className="w-full text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 outline-none"
                                                >
                                                    {availableEmployees.map(e => (
                                                        <option key={e.id} value={e.id}>{e.full_name || e.email}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleRemoveMapping(idx)} className="p-2 text-slate-300 hover:text-rose-500">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}

                                        {sheetMappings.length === 0 && !discoveredSheets.length && (
                                            <div className="text-center py-6 text-slate-400 text-sm italic">No sheet mappings defined yet.</div>
                                        )}

                                        <button onClick={handleAddMapping} className="mt-2 flex items-center gap-2 text-sm font-bold text-blue-600">
                                            <Plus className="h-4 w-4" /> Add Custom Pattern
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SAVE BUTTON */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                            >
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : saved ? <span>✓ Saved</span> : <><Save className="h-4 w-4" /> Save Configuration</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Card 4: Preview ── */}
                {autoAssign && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <GitBranch className="h-5 w-5 text-indigo-600" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-800">Distribution Preview</h2>
                            </div>
                            {distributionType !== 'sheet_based' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Sample Count:</span>
                                    <input type="number" value={previewCount} onChange={e => setPreviewCount(Number(e.target.value))} className="w-14 text-center text-xs font-bold border border-slate-200 rounded-lg p-1" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            {preview1.length > 0 ? (
                                preview1.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                                        <span className="text-sm font-semibold text-slate-600">{d.name}</span>
                                        <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100">{d.leads} leads</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-slate-400 text-xs italic">Setup rules to see a preview.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout >
    );
};

export default WorkflowManagement;
