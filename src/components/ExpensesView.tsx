import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, Category, Source, Supplier, Card } from '../types';
import { CustomSelect } from './CustomSelect';
import { Calendar, Filter, ListFilter, X } from 'lucide-react';

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
    cards
}: {
    transactions: Transaction[];
    categories: Category[];
    sources: Source[];
    suppliers: Supplier[];
    cards: Card[];
}) => {
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterSource, setFilterSource] = useState<string>("all");
    const [filterSupplier, setFilterSupplier] = useState<string>("all");
    const [filterCard, setFilterCard] = useState<string>("all");
    const [filterMandatory, setFilterMandatory] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const activeFilters = useMemo(() => {
        const filters = [];
        if (filterCategory !== 'all') filters.push({ id: 'category', type: 'Categoria', value: categories.find(c => c.id === filterCategory)?.name || 'Desconhecida', clear: () => setFilterCategory('all') });
        if (filterSource !== 'all') filters.push({ id: 'source', type: 'Fonte', value: sources.find(s => s.id === filterSource)?.name || 'Desconhecida', clear: () => setFilterSource('all') });
        if (filterSupplier !== 'all') filters.push({ id: 'supplier', type: 'Fornecedor', value: suppliers.find(s => s.id === filterSupplier)?.name || 'Desconhecido', clear: () => setFilterSupplier('all') });
        if (filterCard !== 'all') filters.push({ id: 'card', type: 'Cartão', value: cards.find(c => c.id === filterCard)?.name || 'Desconhecido', clear: () => setFilterCard('all') });
        if (filterMandatory !== 'all') filters.push({ id: 'mandatory', type: 'Tipo Gasto', value: filterMandatory === 'mandatory' ? 'Obrigatório' : 'Discricionário', clear: () => setFilterMandatory('all') });
        if (startDate) filters.push({ id: 'startDate', type: 'Início', value: startDate, clear: () => setStartDate('') });
        if (endDate) filters.push({ id: 'endDate', type: 'Fim', value: endDate, clear: () => setEndDate('') });
        return filters;
    }, [filterCategory, filterSource, filterSupplier, filterCard, filterMandatory, startDate, endDate, categories, sources, suppliers, cards]);

    const clearFilters = () => {
        setFilterCategory("all");
        setFilterSource("all");
        setFilterSupplier("all");
        setFilterCard("all");
        setFilterMandatory("all");
        setStartDate("");
        setEndDate("");
    };

    const filtered = useMemo(() => {
        return transactions.filter(t => {
            if (filterCategory !== "all" && (t.category_id !== filterCategory)) return false;
            if (filterSource !== "all" && t.source_id !== filterSource) return false;
            if (filterSupplier !== "all" && t.supplier_id !== filterSupplier) return false;
            if (filterCard !== "all" && t.card_id !== filterCard) return false;
            if (filterMandatory === 'mandatory' && !t.is_mandatory) return false;
            if (filterMandatory === 'discretionary' && t.is_mandatory) return false;
            if (startDate && t.date < startDate) return false;
            if (endDate && t.date > endDate) return false;
            return true;
        });
    }, [transactions, filterCategory, filterSource, filterSupplier, filterCard, filterMandatory, startDate, endDate]);

    const totals = useMemo(() => {
        const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
        const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
        return { income, expense };
    }, [filtered]);

    const getRanked = (key: 'category_id' | 'source_id' | 'supplier_id', items: any[]) => {
        const data: Record<string, number> = {};
        filtered.filter(t => t.type === 'expense').forEach(t => {
            const id = t[key];
            const name = items.find(i => i.id === id)?.name || "Outros";
            data[name] = (data[name] || 0) + t.value;
        });
        return Object.entries(data).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    };

    const renderRankList = (data: any[], title: string) => (
        <div className="bg-zinc-800 p-4 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-zinc-300">{title}</h3>
            {data.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">{item.name}</span>
                    <span className="font-mono text-rose-400">{formatCurrency(item.value)}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-950">
            <div className="px-6 pt-6 pb-2 sticky top-0 z-10 bg-zinc-950">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
                            <ListFilter className="w-5 h-5 text-zinc-500" />
                            Despesas
                        </h2>
                        <div className="bg-zinc-800 border border-zinc-700 p-2 rounded-xl shadow-lg flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Receitas</p>
                                <p className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(totals.income)}</p>
                            </div>
                            <div className="w-px h-4 bg-zinc-700"></div>
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Despesas</p>
                                <p className="text-sm font-mono font-bold text-rose-400">{formatCurrency(totals.expense)}</p>
                            </div>
                            <div className="w-px h-4 bg-zinc-700"></div>
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Saldo</p>
                                <p className={`text-sm font-mono font-bold ${totals.income - totals.expense >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(totals.income - totals.expense)}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowFilterModal(true)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 transition-all">
                        <Filter className="w-4 h-4" /> Filtrar {activeFilters.length > 0 && <span className="bg-emerald-500 text-emerald-950 px-1.5 py-0.5 rounded text-[10px]">{activeFilters.length}</span>}
                    </button>
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {activeFilters.map(f => (
                            <div key={f.id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 shadow-sm">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">{f.type}:</span>
                                <span className="text-xs font-black text-zinc-200 capitalize truncate max-w-[150px]">{f.value}</span>
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
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-6">
                        <h3 className="text-lg font-black uppercase tracking-tighter text-white">Filtros de Despesas</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <CustomSelect label="Categoria" value={filterCategory} onChange={setFilterCategory} options={[{ value: 'all', label: 'Todas' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
                            <CustomSelect label="Fonte" value={filterSource} onChange={setFilterSource} options={[{ value: 'all', label: 'Todas' }, ...sources.map(c => ({ value: c.id, label: c.name }))]} />
                            <CustomSelect label="Fornecedor" value={filterSupplier} onChange={setFilterSupplier} options={[{ value: 'all', label: 'Todas' }, ...suppliers.map(c => ({ value: c.id, label: c.name }))]} />
                            <CustomSelect label="Cartão" value={filterCard} onChange={setFilterCard} options={[{ value: 'all', label: 'Todos' }, ...cards.map(c => ({ value: c.id, label: c.name }))]} />
                            <CustomSelect label="Tipo de Gasto" value={filterMandatory} onChange={setFilterMandatory} options={[{ value: 'all', label: 'Todos' }, { value: 'mandatory', label: 'Obrigatório' }, { value: 'discretionary', label: 'Discricionário' }]} />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Data Início</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Data Fim</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none" />
                            </div>
                        </div>
                        <div className="flex justify-between gap-3 pt-4 border-t border-zinc-800/50">
                            <button onClick={clearFilters} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-lg transition-colors uppercase tracking-tight">Limpar</button>
                            <button onClick={() => setShowFilterModal(false)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-tight text-xs transition-colors">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    {renderRankList(getRanked('category_id', categories), "Rank por Categoria")}
                    {renderRankList(getRanked('source_id', sources), "Rank por Fonte")}
                    {renderRankList(getRanked('supplier_id', suppliers), "Rank por Fornecedor")}
                </div>
            </div>
        </div>
    );
}
