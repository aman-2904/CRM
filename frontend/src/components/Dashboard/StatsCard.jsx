import React from 'react';
import { cn } from '../../utils/cn';

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, description }) => {
    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-200/50 hover:shadow-blue-200/50 group transition-all duration-500 hover:-translate-y-1">
            <div className="p-7">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={cn(
                            "p-4 rounded-2xl shadow-lg ring-2 ring-white transition-all duration-500 group-hover:scale-110",
                            trendUp
                                ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-200/50"
                                : trendUp === false
                                    ? "bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-rose-200/50"
                                    : "bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-blue-200/50"
                        )}>
                            <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="ml-5 flex-1">
                        <dl>
                            <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</dt>
                            <dd>
                                <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {(trend || description) && (
                <div className="bg-white/40 backdrop-blur-sm px-7 py-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs flex items-center">
                        {trend && (
                            <span className={cn(
                                "font-black uppercase tracking-tighter flex items-center",
                                trendUp ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {trendUp ? '↑' : '↓'} {trend}
                            </span>
                        )}
                        {description && <span className="text-slate-400 font-bold ml-2">{description}</span>}
                    </div>
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        trendUp ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    )} />
                </div>
            )}
        </div>
    );
};

export default StatsCard;
