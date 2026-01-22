import React from 'react';
import { cn } from '../../utils/cn';

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, description }) => {
    return (
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={cn(
                            "p-3 rounded-lg shadow-sm ring-1 ring-inset",
                            trendUp
                                ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20"
                                : trendUp === false
                                    ? "bg-red-50 text-red-600 ring-red-500/20"
                                    : "bg-blue-50 text-blue-600 ring-blue-500/20"
                        )}>
                            <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
                            <dd>
                                <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {(trend || description) && (
                <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100">
                    <div className="text-sm flex items-center">
                        {trend && (
                            <span className={cn(
                                "font-semibold flex items-center",
                                trendUp ? "text-emerald-700" : "text-red-700"
                            )}>
                                {trend}
                            </span>
                        )}
                        {description && <span className="text-slate-500 ml-2">{description}</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsCard;
