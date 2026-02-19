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
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Google Sheets Sync</h3>
                        <p className="text-xs text-gray-500">Auto-imports leads from your Facebook Lead Ads sheet</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status?.syncEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status?.syncEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {status?.syncEnabled ? 'Active' : 'Disabled'}
                </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{status?.totalImported ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Imported</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{status?.lastSyncLeadsImported ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Last Sync</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center flex flex-col items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600 font-medium">Every 5 min</p>
                </div>
            </div>

            {/* Last sync time */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Last sync: {formatTime(status?.lastSync)}
            </div>

            {/* Error display */}
            {status?.lastError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{status.lastError}</p>
                </div>
            )}

            {/* Message feedback */}
            {message && (
                <div className={`flex items-center gap-2 rounded-lg p-3 mb-4 text-xs ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Sync Now button */}
            <button
                onClick={handleSyncNow}
                disabled={syncing || status?.isRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <RefreshCw className={`w-4 h-4 ${syncing || status?.isRunning ? 'animate-spin' : ''}`} />
                {syncing || status?.isRunning ? 'Syncing...' : 'Sync Now'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-2">
                Auto-syncs every 5 minutes · Deduplicates by email
            </p>
        </div>
    );
};

export default SheetSyncPanel;
