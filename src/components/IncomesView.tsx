import React, { useState, useMemo } from 'react';
import { Transaction, Category, Source, Supplier } from '../types';
import { CustomSelect } from './CustomSelect';
import { Filter, ListFilter, X } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { CustomDateRangePicker } from './CustomDateRangePicker';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export const IncomesView = ({
    transactions,
    categories,
    sources,
    suppliers,
    month,
    year,
    onBack,
    filterCategory,
    setFilterCategory,
    filterSource,
    setFilterSource,
    filterSupplier,
    setFilterSupplier,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
}: {
    transactions: Transaction[];
    categories: Category[];
    sources: Source[];
    suppliers: Supplier[];
    month: number;
    year: number;
    onBack: () => void;
    filterCategory: string[];
    setFilterCategory: (ids: string[]) => void;
    filterSource: string[];
    setFilterSource: (ids: string[]) => void;
    filterSupplier: string[];
    setFilterSupplier: (ids: string[]) => void;
    startDate: string;
    setStartDate: (s: string) => void;
    endDate: string;
    setEndDate: (s: string) => void;
}) => {
    const [showFilterModal, setShowFilterModal] = useState(false);

    const availableCategories = useMemo(() => {
        const ids = new Set(transactions.filter(t => t.type === 'income').map(t => t.category_id));
        return categories.filter(c => ids.has(c.id)).map(c => ({ value: c.id, label: c.name }));
    }, [transactions, categories]);

    const availableSources = useMemo(() => {
        const ids = new Set(transactions.filter(t => t.type === 'income').map(t => t.source_id));
        return sources.filter(s => ids.has(s.id)).map(s => ({ value: s.id, label: s.name }));
    }, [transactions, sources]);

    const availableSuppliers = useMemo(() => {
        const ids = new Set(transactions.filter(t => t.type === 'income').map(t => t.supplier_id));
        return suppliers.filter(s => ids.has(s.id)).map(s => ({ value: s.id, label: s.name }));
    }, [transactions, suppliers]);

    const activeFilters = useMemo(() => {
        const filters = [];
        if (filterCategory.length > 0) filters.push({ id: 'category', type: 'Categoria', value: filterCategory.map(id => categories.find(c => c.id === id)?.name || 'Desconhecida').join(', '), clear: () => setFilterCategory([]) });
        if (filterSource.length > 0) filters.push({ id: 'source', type: 'Fonte', value: filterSource.map(id => sources.find(s => s.id === id)?.name || 'Desconhecida').join(', '), clear: () => setFilterSource([]) });
        if (filterSupplier.length > 0) filters.push({ id: 'supplier', type: 'Fornecedor', value: filterSupplier.map(id => suppliers.find(s => s.id === id)?.name || 'Desconhecido').join(', '), clear: () => setFilterSupplier([]) });
        if (startDate) {
            const startDayFormatted = startDate.substring(0, 10).split('-').reverse().join('/');
            let rangeVal = startDayFormatted;
            if (endDate) {
                const endInclusiveObj = new Date(endDate.substring(0, 10) + "T00:00:00");
                endInclusiveObj.setDate(endInclusiveObj.getDate() - 1);
                const y = endInclusiveObj.getFullYear();
                const m = String(endInclusiveObj.getMonth() + 1).padStart(2, '0');
                const d = String(endInclusiveObj.getDate()).padStart(2, '0');
                const endDayFormatted = `${d}/${m}/${y}`;
                if (startDayFormatted !== endDayFormatted) {
                    rangeVal = `${startDayFormatted} a ${endDayFormatted}`;
                }
            }
            filters.push({
                id: 'datePeriod',
                type: 'Período',
                value: rangeVal,
                clear: () => {
                    setStartDate('');
                    setEndDate('');
                }
            });
        }
        return filters;
    }, [filterCategory, filterSource, filterSupplier, startDate, endDate, categories, sources, suppliers]);

    const clearFilters = () => {
        setFilterCategory([]);
        setFilterSource([]);
        setFilterSupplier([]);
        setStartDate("");
        setEndDate("");
    };

    const filtered = useMemo(() => {
        return transactions.filter(t => {
            if (filterCategory.length > 0 && !filterCategory.includes(t.category_id || "")) return false;
            if (filterSource.length > 0 && !filterSource.includes(t.source_id)) return false;
            if (filterSupplier.length > 0 && !filterSupplier.includes(t.supplier_id || "")) return false;

            const tDateNormalized = t.date.includes('T') ? t.date : `${t.date}T00:00:00`;
            if (startDate && tDateNormalized < startDate) return false;
            if (endDate && tDateNormalized >= endDate) return false;
            return true;
        });
    }, [transactions, filterCategory, filterSource, filterSupplier, startDate, endDate]);

    const filteredIncomes = useMemo(() => filtered.filter(t => t.type === 'income'), [filtered]);

    const totals = useMemo(() => {
        const income = filteredIncomes.reduce((sum, t) => sum + t.value, 0);
        return { income };
    }, [filteredIncomes]);

    const getRanked = (key: 'category_id' | 'source_id' | 'supplier_id', items: any[]) => {
        const data: Record<string, number> = {};
        filteredIncomes.forEach(t => {
            const id = t[key];
            const name = items.find(i => i.id === id)?.name || "Outros";
            data[name] = (data[name] || 0) + t.value;
        });
        return Object.entries(data).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    };

    const renderRankList = (data: any[], title: string) => (
        <div className="bg-zinc-800 p-4 rounded-xl flex flex-col min-h-0" style={{ maxHeight: activeFilters.length > 0 ? "calc(100vh - 401px)" : "calc(100vh - 375px)" }}>
            <h3 className="text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-3 flex-shrink-0">{title}</h3>
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-[10px] border-b border-zinc-700/30 pb-2 last:border-0">
                        <span className="text-zinc-400 uppercase font-bold truncate pr-2">{item.name}</span>
                        <span className="font-mono text-emerald-400 font-bold shrink-0">{formatCurrency(item.value)}</span>
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
                            Receitas
                        </h2>
                        <div className="bg-zinc-800 border border-zinc-700 p-2 rounded-xl shadow-lg flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Total</p>
                                <p className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(totals.income)}</p>
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
                                <button onClick={f.clear} className="text-zinc-500 hover:text-emerald-400 transition-colors ml-1 p-0.5 rounded-full hover:bg-zinc-700/50">
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
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setShowFilterModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-6">Filtros de Receitas</h3>
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <CustomSelect multiple label="Categoria" value={filterCategory} onChange={setFilterCategory} options={availableCategories} />
                                    <CustomSelect multiple label="Fonte" value={filterSource} onChange={setFilterSource} options={availableSources} />
                                    <CustomSelect multiple label="Fornecedor" value={filterSupplier} onChange={setFilterSupplier} options={availableSuppliers} />
                                </div>
                            </div>

                            <div className="w-full lg:w-[280px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800/50 pt-5 lg:pt-0 lg:pl-6">
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Período para Consulta</label>
                                    <CustomDateRangePicker
                                        startDate={startDate}
                                        setStartDate={setStartDate}
                                        endDate={endDate}
                                        setEndDate={setEndDate}
                                        reportMonth={month}
                                        reportYear={year}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between gap-3 pt-6 mt-6 border-t border-zinc-800/50">
                            <button onClick={clearFilters} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-lg transition-colors uppercase tracking-tight">Limpar</button>
                            <button onClick={() => setShowFilterModal(false)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-tight text-xs transition-colors">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            {filteredIncomes.length === 0 ? (
                <EmptyState
                    title="Nenhuma receita encontrada"
                    description="Não encontramos receitas que correspondam aos filtros aplicados para este período."
                    onClearFilters={clearFilters}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 h-full p-4">
                    {renderRankList(getRanked('category_id', categories), "Rank por Categoria")}
                    {renderRankList(getRanked('source_id', sources), "Rank por Fonte")}
                    {renderRankList(getRanked('supplier_id', suppliers), "Rank por Fornecedor")}
                </div>
            )}
        </div>
    );
};
