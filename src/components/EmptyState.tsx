import React from 'react';
import { ListFilter, X } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    onClearFilters?: () => void;
    icon?: React.ReactNode;
}

export function EmptyState({ title, description, onClearFilters, icon }: EmptyStateProps) {
    return (
        <div className="h-full flex items-center justify-center p-6 sm:p-12">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 sm:p-12 text-center max-w-sm flex flex-col items-center gap-6 shadow-2xl backdrop-blur-md">
                <div className="w-20 h-20 bg-zinc-800/80 rounded-full flex items-center justify-center mb-2 border border-zinc-700/50 shadow-inner">
                    {icon || <ListFilter className="w-10 h-10 text-zinc-500" />}
                </div>
                <div className="space-y-2">
                    <h3 className="text-white font-black uppercase tracking-tighter text-xl italic">{title}</h3>
                    <p className="text-zinc-500 text-xs font-semibold leading-relaxed px-4">
                        {description}
                    </p>
                </div>
                {onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="mt-2 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border border-zinc-700/50 shadow-lg flex items-center gap-2 group"
                    >
                        <X className="w-3 h-3 text-zinc-500 group-hover:text-rose-400 transition-colors" />
                        Limpar Filtros
                    </button>
                )}
            </div>
        </div>
    );
}
