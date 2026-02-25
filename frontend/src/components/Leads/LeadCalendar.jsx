import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, Search, Settings, MoreHorizontal, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../utils/cn';

const LeadCalendar = ({ leadId, onEventClick, onDateClick }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [followups, setFollowups] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchFollowups = async () => {
        if (!leadId) return;
        try {
            setLoading(true);
            const response = await api.get(`/followups`, { params: { lead_id: leadId } });
            setFollowups(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch lead followups', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowups();
    }, [leadId]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        // Fillers from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                currentMonth: false
            });
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                currentMonth: true
            });
        }

        // Fillers from next month (total grid size 42 - 6 rows)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                currentMonth: false
            });
        }

        return days;
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setViewDate(new Date());
    };

    const calendarDays = getDaysInMonth(viewDate);

    const getFollowupsForDay = (date) => {
        return followups.filter(f => {
            const fDate = new Date(f.scheduled_at);
            return fDate.getDate() === date.getDate() &&
                fDate.getMonth() === date.getMonth() &&
                fDate.getFullYear() === date.getFullYear();
        });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                        onClick={handleToday}
                        className="px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-full border border-blue-100 hover:bg-blue-100 transition-all active:scale-95"
                    >
                        Today
                    </button>
                    <div className="flex items-center gap-1">
                        <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-slate-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-50 last:border-r-0 bg-slate-50/30">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-[600px]">
                {calendarDays.map((item, idx) => {
                    const dayFollowups = getFollowupsForDay(item.date);
                    const isToday = item.date.toDateString() === new Date().toDateString();

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "border-b border-r border-slate-50 p-3 flex flex-col gap-2 min-h-[100px] transition-all group/day",
                                !item.currentMonth ? "bg-slate-50/20" : "bg-white",
                                idx % 7 === 6 && "border-r-0"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                    !item.currentMonth ? "text-slate-300" : "text-slate-400",
                                    isToday && "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                )}>
                                    {item.date.getDate()}
                                </span>
                                {item.currentMonth && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDateClick && onDateClick(item.date); }}
                                        className="p-1 opacity-0 group-hover/day:opacity-100 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                                        title="Schedule Follow-up"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 overflow-hidden">
                                {dayFollowups.map((f, fIdx) => (
                                    <div
                                        key={f.id}
                                        onClick={(e) => { e.stopPropagation(); onEventClick && onEventClick(f); }}
                                        className={cn(
                                            "px-2.5 py-2 rounded-xl border text-[10px] font-bold leading-tight shadow-sm transition-all hover:scale-[1.02] cursor-pointer",
                                            f.status === 'completed'
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100/20"
                                                : "bg-blue-50 border-blue-100 text-blue-700 shadow-blue-100/20",
                                            f.status === 'pending' && new Date(f.scheduled_at) < new Date() && "bg-rose-50 border-rose-100 text-rose-700 shadow-rose-100/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>{new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                                            <div className="truncate font-black uppercase tracking-tight">
                                                {f.notes || 'Scheduled Follow-up'}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Delete this follow-up?')) {
                                                        api.delete(`/followups/${f.id}`).then(() => fetchFollowups());
                                                    }
                                                }}
                                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/50 rounded-lg transition-all text-current"
                                                title="Delete Follow-up"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Refreshing Schedule...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadCalendar;
