import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Sheet } from 'lucide-react';

const SheetSyncPanel = () => {
    const [status, setStatus] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/sheets/status');
            setStatus(res.data.data);
        } catch (err) {
            console.error('SheetSync status error:', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleSyncNow = async () => {
        setSyncing(true);
        setMessage(null);
        try {
            await api.post('/sheets/sync-now');
            setMessage({ type: 'success', text: 'Sync started! New leads will appear shortly.' });
            // Poll status after 3s to pick up result
            setTimeout(fetchStatus, 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to trigger sync.' });
        } finally {
            setSyncing(false);
        }
    };

    const formatTime = (iso) => {
        if (!iso) return 'Never';
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-[2rem] p-7 transition-all duration-500 hover:shadow-blue-100/50">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/50 ring-2 ring-white">
                        <Sheet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Sheet Sync</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Import</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-500 border ${status?.syncEnabled
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status?.syncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {status?.syncEnabled ? 'Active' : 'Standby'}
                </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center group hover:bg-white hover:shadow-sm transition-all duration-300">
                    <p className="text-2xl font-black text-slate-900 group-hover:scale-110 transition-transform">{status?.totalImported ?? '0'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">Total</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center group hover:bg-white hover:shadow-blue-100/50 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-2xl font-black text-blue-600 relative z-10 group-hover:scale-110 transition-transform">{status?.lastSyncLeadsImported ?? '0'}</p>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mt-1 relative z-10">Last Inc.</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center flex flex-col items-center justify-center group hover:bg-white transition-all">
                    <Clock className="w-5 h-5 text-slate-300 mb-1.5 group-hover:text-amber-500 transition-colors" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">5 Min</p>
                </div>
            </div>

            {/* Last sync time */}
            <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-white/50 border border-slate-100 rounded-2xl shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-xs font-bold text-slate-600 truncate">
                    Last sync: <span className="text-slate-400">{formatTime(status?.lastSync)}</span>
                </span>
            </div>

            {/* Error display */}
            {status?.lastError && (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-rose-700 leading-relaxed">{status.lastError}</p>
                </div>
            )}

            {/* Sync Now button */}
            <button
                onClick={handleSyncNow}
                disabled={syncing || status?.isRunning}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-200/50 hover:shadow-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 group overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <RefreshCw className={`w-4 h-4 relative z-10 ${syncing || status?.isRunning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="relative z-10">{syncing || status?.isRunning ? 'Refreshing...' : 'Run Sync Now'}</span>
            </button>
        </div>
    );
};

export default SheetSyncPanel;
