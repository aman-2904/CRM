import React, { useState, useEffect, useRef } from 'react';
import { Users, ChevronDown } from 'lucide-react';

const CustomDropdown = ({
    items,
    selectedId,
    onSelect,
    placeholder = 'Select...',
    showAllOption = true,
    allOptionLabel = 'All Employees',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedItem = items.find(item => item.id === selectedId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-500 hover:ring-4 hover:ring-blue-500/10 transition-all duration-300"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedId === 'all' ? (
                        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center">
                            <Users className="h-3 w-3 text-slate-400" />
                        </div>
                    ) : (
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600">
                            {selectedItem?.full_name?.charAt(0) || selectedItem?.name?.charAt(0) || '?'}
                        </div>
                    )}
                    <span className="truncate">
                        {selectedId === 'all' ? allOptionLabel : (selectedItem?.full_name || selectedItem?.name || placeholder)}
                    </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-full min-w-[200px] rounded-xl bg-white shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {showAllOption && (
                            <button
                                onClick={() => { onSelect('all'); setIsOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${selectedId === 'all' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Users className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                {allOptionLabel}
                            </button>
                        )}
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { onSelect(item.id); setIsOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${selectedId === item.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                                    {item.full_name?.charAt(0) || item.name?.charAt(0) || '?'}
                                </div>
                                <div className="flex flex-col items-start overflow-hidden text-left">
                                    <span className="truncate w-full font-semibold">{item.full_name || item.name}</span>
                                    {item.email && <span className="text-[10px] text-slate-400 truncate w-full font-normal">{item.email}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
