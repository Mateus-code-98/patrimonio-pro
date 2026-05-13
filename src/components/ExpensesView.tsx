import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, Category, Source, Supplier } from '../types';
import { CustomSelect } from './CustomSelect';
import { Calendar, ChevronLeft, Filter, ListFilter, X } from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export const ExpensesView = ({
    transactions,
    categories,
    sources,
    suppliers,
    cards,
    month,
    year,
    onBack,
    filterCategory,
    setFilterCategory,
    filterSource,
    setFilterSource,
    filterSupplier,
    setFilterSupplier,
    filterCard,
    setFilterCard,
    filterMandatory,
    setFilterMandatory,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterOccurrence,
    setFilterOccurrence,
}: {
    transactions: Transaction[];
    categories: Category[];
    sources: Source[];
    suppliers: Supplier[];
    cards: any[];
    month: number;
    year: number;
    onBack: () => void;
    filterCategory: string[];
    setFilterCategory: (ids: string[]) => void;
    filterSource: string[];
    setFilterSource: (ids: string[]) => void;
    filterSupplier: string[];
    setFilterSupplier: (ids: string[]) => void;
    filterCard: string[];
    setFilterCard: (ids: string[]) => void;
    filterMandatory: string[];
    setFilterMandatory: (ids: string[]) => void;
    startDate: string;
    setStartDate: (s: string) => void;
    endDate: string;
    setEndDate: (s: string) => void;
    filterOccurrence: string[];
    setFilterOccurrence: (v: string[]) => void;
}) => {
    const [showFilterModal, setShowFilterModal] = useState(false);

    const availableCategories = useMemo(() => {
        const ids = new Set(transactions.filter(t => t.type === 'expense').map(t => t.category_id));
        return categories.filter(c => ids.has(c.id)).map(c => ({ value: c.id, label: c.name }));
    }, [transactions, categories]);

    const availableSources = useMemo(() => {
        const ids = new Set(transactions.filter(t => t.type === 'expense').map(t => t.source_id));
        return sources.filter(s => ids.has(s.id)).map(s => ({ value: s.id, label: s.name }));
    }, [transactions, sources]);

    const availableSuppliers = useMemo(() => {
        const ids = new Set(transactions.filter(t => t.type === 'expense').map(t => t.supplier_id));
        return suppliers.filter(s => ids.has(s.id)).map(s => ({ value: s.id, label: s.name }));
    }, [transactions, suppliers]);

    const availableCards = useMemo(() => {
        const ids = new Set(transactions.filter(t => t.type === 'expense').map(t => t.card_id));
        return cards.filter(c => ids.has(c.id)).map(c => ({ value: c.id, label: c.name }));
    }, [transactions, cards]);

    const TYPE_LABELS: Record<string, string> = {
        'mandatory': 'OBRIGATÓRIO',
        'discretionary': 'DISCRICIONÁRIO'
    };

    const MONTH_NAMES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const activeFilters = useMemo(() => {
        const filters = [];
        if (filterCategory.length > 0) filters.push({ id: 'category', type: 'Categoria', value: filterCategory.map(id => categories.find(c => c.id === id)?.name || 'Desconhecida').join(', '), clear: () => setFilterCategory([]) });
        if (filterSource.length > 0) filters.push({ id: 'source', type: 'Fonte', value: filterSource.map(id => sources.find(s => s.id === id)?.name || 'Desconhecida').join(', '), clear: () => setFilterSource([]) });
        if (filterSupplier.length > 0) filters.push({ id: 'supplier', type: 'Fornecedor', value: filterSupplier.map(id => suppliers.find(s => s.id === id)?.name || 'Desconhecido').join(', '), clear: () => setFilterSupplier([]) });
        if (filterCard.length > 0) filters.push({ id: 'card', type: 'Cartão', value: filterCard.map(id => cards.find(c => c.id === id)?.name || 'Desconhecido').join(', '), clear: () => setFilterCard([]) });
        if (filterMandatory.length > 0) filters.push({ id: 'mandatory', type: 'Tipo Gasto', value: filterMandatory.map(v => TYPE_LABELS[v]).join(', '), clear: () => setFilterMandatory([]) });
        if (filterOccurrence.length > 0) {
            const labels: Record<string, string> = { 'recurring': 'Recorrente', 'occasional': 'Ocasional' };
            filters.push({ id: 'occurrence', type: 'Ocorrência', value: filterOccurrence.map(v => labels[v]).join(', '), clear: () => setFilterOccurrence([]) });
        }
        if (startDate) filters.push({ id: 'startDate', type: 'Início', value: startDate, clear: () => setStartDate('') });
        if (endDate) filters.push({ id: 'endDate', type: 'Fim', value: endDate, clear: () => setEndDate('') });
        return filters;
    }, [filterCategory, filterSource, filterSupplier, filterCard, filterMandatory, filterOccurrence, startDate, endDate, categories, sources, suppliers, cards]);

    const clearFilters = () => {
        setFilterCategory([]);
        setFilterSource([]);
        setFilterSupplier([]);
        setFilterCard([]);
        setFilterMandatory([]);
        setFilterOccurrence([]);
        setStartDate("");
        setEndDate("");
    };

    const filtered = useMemo(() => {
        return transactions.filter(t => {
            if (filterCategory.length > 0 && !filterCategory.includes(t.category_id || "")) return false;
            if (filterSource.length > 0 && !filterSource.includes(t.source_id)) return false;
            if (filterSupplier.length > 0 && !filterSupplier.includes(t.supplier_id || "")) return false;
            if (filterCard.length > 0 && !filterCard.includes(t.card_id || "")) return false;

            if (filterMandatory.length > 0) {
                const isMandatory = t.is_mandatory;
                const selected = filterMandatory;
                if (selected.includes('mandatory') && !selected.includes('discretionary') && !isMandatory) return false;
                if (selected.includes('discretionary') && !selected.includes('mandatory') && isMandatory) return false;
            }

            if (filterOccurrence.length > 0) {
                const isRecurring = t.is_recurring;
                const selected = filterOccurrence;
                if (selected.includes('recurring') && !selected.includes('occasional') && !isRecurring) return false;
                if (selected.includes('occasional') && !selected.includes('recurring') && isRecurring) return false;
            }

            if (startDate && t.date < startDate) return false;
            if (endDate && t.date > endDate) return false;
            return true;
        });
    }, [transactions, filterCategory, filterSource, filterSupplier, filterCard, filterMandatory, startDate, endDate]);

    const filteredExpenses = useMemo(() => filtered.filter(t => t.type === 'expense'), [filtered]);

    const totals = useMemo(() => {
        const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
        const expense = filteredExpenses.reduce((sum, t) => sum + t.value, 0);
        return { income, expense };
    }, [filtered, filteredExpenses]);

    const getRanked = (key: 'category_id' | 'source_id' | 'supplier_id' | 'type' | 'occurrence', items: any[]) => {
        const data: Record<string, number> = {};
        filteredExpenses.forEach(t => {
            let name = "Outros";
            if (key === 'type') {
                if (t.is_mandatory) name = "OBRIGATÓRIO";
                else name = "DISCRICIONÁRIO";
            } else if (key === 'occurrence') {
                name = t.is_recurring ? "Recorrente" : "Ocasional";
            } else {
                const id = t[key as 'category_id' | 'source_id' | 'supplier_id'];
                name = items.find(i => i.id === id)?.name || "Outros";
            }
            data[name] = (data[name] || 0) + t.value;
        });
        return Object.entries(data).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    };

    const renderRankList = (data: any[], title: string) => (
        <div className="bg-zinc-800 p-4 rounded-xl flex flex-col min-h-0" style={{ maxHeight: "calc(100vh - 315px)" }}>
            <h3 className="text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-3 flex-shrink-0">{title}</h3>
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-[10px] border-b border-zinc-700/30 pb-2 last:border-0">
                        <span className="text-zinc-400 uppercase font-bold truncate pr-2">{item.name}</span>
                        <span className="font-mono text-rose-400 font-bold shrink-0">{formatCurrency(item.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl min-h-0 relative">
            <div className="px-6 pt-6 pb-2 bg-zinc-900 sticky top-0 z-10 flex-shrink-0 rounded-t-xl">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <h2 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
                            <ListFilter className="w-5 h-5 text-zinc-500" />
                            Despesas
                        </h2>
                        <div className="bg-zinc-800 border border-zinc-700 p-2 rounded-xl shadow-lg flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Total</p>
                                <p className="text-sm font-mono font-bold text-rose-400">{formatCurrency(totals.expense)}</p>
                            </div>
                            <div className="w-px h-4 bg-zinc-700 ml-2"></div>
                            <button onClick={() => setShowFilterModal(true)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 transition-all cursor-pointer">
                                <Filter className="w-3 h-3" /> Filtrar {activeFilters.length > 0 && <span className="bg-emerald-500 text-emerald-950 px-1.5 py-0.5 rounded text-[10px]">{activeFilters.length}</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {activeFilters.map(f => (
                            <div key={f.id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 shadow-sm">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest uppercase">{f.type}:</span>
                                <span className="text-xs font-black text-zinc-200 capitalize truncate max-w-[150px] uppercase">{f.value}</span>
                                <button onClick={f.clear} className="text-zinc-500 hover:text-rose-400 transition-colors ml-1 p-0.5 rounded-full hover:bg-zinc-700/50">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button onClick={clearFilters} className="text-[10px] text-rose-500 hover:bg-rose-500/10 px-3 py-1 rounded-full uppercase font-bold tracking-widest transition-colors">
                            Limpar Tudo
                        </button>
                    </div>
                )}
            </div>


            {showFilterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-6 relative">
                        <button onClick={() => setShowFilterModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-white">Filtros de Despesas</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <CustomSelect multiple label="Categoria" value={filterCategory} onChange={setFilterCategory} options={availableCategories} />
                            <CustomSelect multiple label="Fonte" value={filterSource} onChange={setFilterSource} options={availableSources} />
                            <CustomSelect multiple label="Fornecedor" value={filterSupplier} onChange={setFilterSupplier} options={availableSuppliers} />
                            <CustomSelect multiple label="Cartão" value={filterCard} onChange={setFilterCard} options={availableCards} />
                            <CustomSelect multiple label="Tipo de Gasto" value={filterMandatory} onChange={setFilterMandatory} options={[
                                { value: 'mandatory', label: 'OBRIGATÓRIO' },
                                { value: 'discretionary', label: 'DISCRICIONÁRIO' }
                            ]} />
                            <CustomSelect multiple label="Ocorrência" value={filterOccurrence} onChange={setFilterOccurrence} options={[
                                { value: 'recurring', label: 'Recorrente' },
                                { value: 'occasional', label: 'Ocasional' }
                            ]} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Data Início</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Data Fim</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between gap-3 pt-4 border-t border-zinc-800/50">
                            <button onClick={clearFilters} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-lg transition-colors uppercase tracking-tight">Limpar</button>
                            <button onClick={() => setShowFilterModal(false)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-tight text-xs transition-colors">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 px-6 pb-6 overflow-hidden">
                {filteredExpenses.length === 0 ? (
                    <div className="h-full flex items-center justify-center pt-4">
                        <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-12 text-center max-w-sm flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                                <ListFilter className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h3 className="text-white font-black uppercase tracking-tighter text-lg">Nenhuma despesa encontrada</h3>
                            <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                                Não encontramos gastos que correspondam aos filtros aplicados para este período.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 border border-zinc-700"
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 h-full">
                        {renderRankList(getRanked('category_id', categories), "Rank por Categoria")}
                        {renderRankList(getRanked('source_id', sources), "Rank por Fonte")}
                        {renderRankList(getRanked('supplier_id', suppliers), "Rank por Fornecedor")}
                        {renderRankList(getRanked('type', []), "Rank por Tipo")}
                        {renderRankList(getRanked('occurrence', []), "Rank por Ocorrência")}
                    </div>
                )}
            </div>
        </div>
    );

}
