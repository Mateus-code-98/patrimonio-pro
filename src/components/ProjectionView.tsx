import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Report, GlobalConfig } from '../types';
import { useFinancial } from '../FinancialContext';
import { CustomSelect } from './CustomSelect';
import {
    TrendingUp,
    Goal,
    Calendar,
    DollarSign,
    Clock,
    ArrowUpRight,
    Check,
    AlertTriangle,
    Layers,
    Activity,
    Sliders,
    HelpCircle
} from 'lucide-react';

const SHORT_MONTH_NAMES = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

function getStatsForReport(report: Report, config: GlobalConfig | null, dailySpentMode: string, dailySpentValues: any) {
    if (!report || !report.transactions) return null;

    const now = new Date();
    const transactions = report.transactions || [];
    const nowStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    const allKnownIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
    const allKnownExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);
    const allMandatoryExpense = transactions.filter(t => t.type === 'expense' && (t.is_mandatory || t.is_non_recurring_mandatory)).reduce((acc, t) => acc + Number(t.value), 0);

    const start = new Date(report.start_date + "T00:00:00");
    const end = new Date(report.end_date + "T23:59:59");

    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysFromStart = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.max(0, Math.min(totalDays, daysFromStart));
    const daysRemaining = totalDays - daysPassed;

    const totalDiscretionaryRecurring = transactions
        .filter(t => t.type === 'expense' && !t.is_mandatory && !t.is_non_recurring_mandatory && !!t.is_recurring)
        .reduce((sum, t) => sum + Number(t.value), 0);
    const currentDailyAvg = daysPassed > 0 ? totalDiscretionaryRecurring / daysPassed : 0;

    let dailyBase = 0;
    if (dailySpentMode === 'historical') {
        dailyBase = dailySpentValues.historical;
    } else if (dailySpentMode === 'current') {
        dailyBase = currentDailyAvg;
    } else {
        dailyBase = config?.daily_spent_estimate_default || 0;
    }

    const projectedVariableExpense = daysRemaining * dailyBase;
    const expectedSurplus = allKnownIncome - allKnownExpenses - projectedVariableExpense;
    const partialSurplus = allKnownIncome - allKnownExpenses;

    return {
        currentDailyAvg,
        expectedSurplus,
        partialSurplus,
        totalIncome: allKnownIncome,
        totalExpense: allKnownExpenses,
        mandatoryExpense: allMandatoryExpense,
        expectedDiscretionaryFuture: projectedVariableExpense,
        daysRemaining
    };
}

export const ProjectionView = ({
    reports,
    config,
    initialReportId,
    onBack
}: {
    reports: Report[];
    config: GlobalConfig | null;
    initialReportId?: string | null;
    onBack: () => void;
}) => {
    const { dailySpentMode, setDailySpentMode, dailySpentValues, selectedDailyValue } = useFinancial();

    // Base Report Selection
    const [selectedReportId, setSelectedReportId] = useState<string>(() => {
        if (initialReportId) return initialReportId;
        if (reports.length > 0) {
            // Find current/active or default report
            const active = reports.find(r => r.is_current);
            if (active) return active.id;
            return reports[0].id;
        }
        return '';
    });

    const baseReport = useMemo(() => {
        return reports.find(r => r.id === selectedReportId) || reports[0] || null;
    }, [reports, selectedReportId]);

    // Customizable Goal Target
    const [customGoal, setCustomGoal] = useState<number>(() => {
        return Number(config?.goal_target_default) || 1000000;
    });

    // Custom Horizon Selector: 6M, 12M, 24M, 60M (5Y), until_goal
    const [horizonMode, setHorizonMode] = useState<string>('until_goal');

    // Stats calculated dynamically for selected report
    const reportStats = useMemo(() => {
        if (!baseReport) return null;
        return getStatsForReport(baseReport, config, dailySpentMode, dailySpentValues);
    }, [baseReport, config, dailySpentMode, dailySpentValues]);

    // Active recurring list of selected report in play
    const recurringList = useMemo(() => {
        if (!baseReport) return [];
        return (baseReport.transactions || []).filter(t => t.is_recurring);
    }, [baseReport]);

    // Simulation Engine matching exactly "meta de patrimônio"
    const simulation = useMemo(() => {
        if (!baseReport || !reportStats) return null;

        const target = customGoal;
        const annualRate = baseReport.selic_tax / 100;
        const rate = Math.pow(1 + annualRate, 1 / 12) - 1;

        // Month 0 (Base month)
        const startObj = new Date(baseReport.year, baseReport.month - 1, 1);
        const label0 = `${SHORT_MONTH_NAMES[startObj.getMonth()]}/${String(startObj.getFullYear()).slice(-2)}`;

        const initialPatrimony = baseReport.initial_patrimony;
        const interest0 = initialPatrimony * rate;
        const endPatrimony0 = initialPatrimony * (1 + rate) + reportStats.expectedSurplus;

        const dataPoints = [{
            monthIndex: 0,
            month: label0,
            startPatrimony: initialPatrimony,
            surplus: reportStats.expectedSurplus,
            interest: interest0,
            endPatrimony: endPatrimony0,
            selic: baseReport.selic_tax,
            recurringIncome: baseReport.transactions?.filter(t => t.type === 'income' && t.is_recurring).reduce((sum, t) => sum + Number(t.value), 0) || 0,
            recurringExpense: baseReport.transactions?.filter(t => t.type === 'expense' && t.is_recurring).reduce((sum, t) => sum + Number(t.value), 0) || 0
        }];

        let activeRecurring = recurringList.map(t => {
            let rem = null;
            if (t.remaining_recurrence !== undefined && t.remaining_recurrence !== null && String(t.remaining_recurrence) !== '') {
                const parsed = parseInt(String(t.remaining_recurrence), 10);
                if (!isNaN(parsed)) rem = parsed;
            }
            return {
                type: t.type,
                value: Number(t.value),
                remaining: rem
            };
        });

        let current = endPatrimony0;
        let m = 0;
        // Limit to max 120 months (10 years) for chart visibility, or 1200 months for infinite safety
        const maxMonths = horizonMode === 'until_goal' ? 1200 : Number(horizonMode);

        while (m < maxMonths) {
            if (horizonMode === 'until_goal' && current >= target) {
                break;
            }

            const activeItems = activeRecurring.filter(item => item.remaining === null || item.remaining >= 1);
            const incomeSum = activeItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.value, 0);
            const expenseSum = activeItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.value, 0);
            const monthlySurplus = incomeSum - expenseSum - (selectedDailyValue * 30);

            // Decrement remaining for future months
            activeRecurring = activeRecurring.map(item => {
                if (item.remaining !== null) {
                    return { ...item, remaining: item.remaining - 1 };
                }
                return item;
            });

            // If we are not earning interest and the surplus is negative, we can never reach the target
            if (monthlySurplus <= 0 && rate <= 0 && current < target) {
                break;
            }

            const interestEarned = current * rate;
            const startPatrimonyValue = current;
            current = current * (1 + rate) + monthlySurplus;
            m++;

            const dateObj = new Date(baseReport.year, baseReport.month + m - 1, 1);
            const label = `${SHORT_MONTH_NAMES[dateObj.getMonth()]}/${String(dateObj.getFullYear()).slice(-2)}`;

            dataPoints.push({
                monthIndex: m,
                month: label,
                startPatrimony: startPatrimonyValue,
                surplus: monthlySurplus,
                interest: interestEarned,
                endPatrimony: current,
                selic: baseReport.selic_tax,
                recurringIncome: incomeSum,
                recurringExpense: expenseSum
            });
        }

        const reachedGoal = current >= target;
        const totalMonthsToGoal = reachedGoal ? m : null;

        // Format nice output target reached text
        let timeToGoalText = '---';
        if (totalMonthsToGoal !== null) {
            const years = Math.floor(totalMonthsToGoal / 12);
            const rMonths = totalMonthsToGoal % 12;
            if (years === 0) {
                timeToGoalText = `${rMonths}m`;
            } else if (rMonths === 0) {
                timeToGoalText = `${years}a`;
            } else {
                timeToGoalText = `${years}a ${rMonths}m`;
            }
        }

        return {
            dataPoints,
            reachedGoal,
            monthsToGoal: totalMonthsToGoal,
            timeToGoalText,
            finalPatrimony: current,
            totalInterest: dataPoints.reduce((sum, dp) => sum + dp.interest, 0),
            totalSurplusAdded: dataPoints.reduce((sum, dp) => sum + dp.surplus, 0),
        };
    }, [baseReport, reportStats, customGoal, horizonMode, selectedDailyValue, recurringList]);

    // Table Pagination
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;
    const paginatedData = useMemo(() => {
        if (!simulation) return [];
        const start = page * rowsPerPage;
        return simulation.dataPoints.slice(start, start + rowsPerPage);
    }, [simulation, page]);

    const totalPages = useMemo(() => {
        if (!simulation) return 0;
        return Math.ceil(simulation.dataPoints.length / rowsPerPage);
    }, [simulation]);

    // Options for Selects
    const reportOptions = useMemo(() => {
        return reports.map(r => ({
            value: r.id,
            label: `${SHORT_MONTH_NAMES[r.month - 1]}/${r.year} ${r.is_current ? '(Atual)' : ''}`
        }));
    }, [reports]);

    if (!baseReport || !reportStats || !simulation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-center">
                <AlertTriangle className="text-zinc-500 w-12 h-12 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-white uppercase">Dados indisponíveis</h3>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">Carregue ou crie relatórios para ver a projeção patrimonial.</p>
            </div>
        );
    }

    const goalMonth = simulation.monthsToGoal !== null ? simulation.dataPoints[simulation.monthsToGoal]?.month : null;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-950 space-y-6">
            {/* Header / Intro Card */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
                <div className="space-y-1">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <TrendingUp size={12} className="animate-pulse" /> Simulador de Patrimônio a Longo Prazo
                    </span>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Projeção de Longo Prazo</h2>
                    <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
                        Simule a evolução do seu patrimônio com base nas suas receitas e despesas recorrentes ativas,
                        o juro composto Selic ao mês e a sua estimativa de gasto diário.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Relatório Base</span>
                        <CustomSelect
                            value={selectedReportId}
                            onChange={(id) => { setSelectedReportId(id); setPage(0); }}
                            options={reportOptions}
                            disableClear
                            className="w-48"
                            buttonClassName="h-10 text-xs py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold border border-zinc-800 uppercase"
                        />
                    </div>
                </div>
            </div>

            {/* Top Indicator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Tempo para Meta */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between relative min-h-[140px] shadow-md group hover:border-emerald-500/20 transition-all duration-300">
                    <div>
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Tempo até a Meta</span>
                        <h2 className={`text-3xl font-black tracking-tight font-mono ${simulation.reachedGoal ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                            {simulation.reachedGoal ? simulation.timeToGoalText : '∞'}
                        </h2>
                    </div>
                    <div className="border-t border-zinc-800/50 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                        <span>Meta de Patrimônio:</span>
                        <span className="text-zinc-300 font-bold font-mono text-xs">{formatCurrency(customGoal)}</span>
                    </div>
                    {/* Glowing emerald sidebar on success */}
                    {simulation.reachedGoal && (
                        <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/10 group-hover:bg-emerald-500/30 transition-colors"></div>
                    )}
                </div>

                {/* 2. Patrimônio Final */}
                <div className="bg-zinc-900 border border-zinc-805 border-zinc-800 p-5 rounded-xl flex flex-col justify-between relative min-h-[140px] shadow-md hover:border-zinc-700 transition-all duration-300">
                    <div>
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Patrimônio Projetado</span>
                        <h2 className="text-3xl font-black tracking-tight text-white font-mono">
                            {formatCurrency(simulation.finalPatrimony)}
                        </h2>
                    </div>
                    <div className="border-t border-zinc-800/50 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                        <span>Horizonte:</span>
                        <span className="text-zinc-400 font-bold">
                            {horizonMode === 'until_goal'
                                ? `Até a Meta ${goalMonth ? `(${goalMonth})` : ''}`
                                : `${Number(horizonMode) / 12} ${Number(horizonMode) / 12 === 1 ? 'Ano' : 'Anos'} (${horizonMode} meses)`}
                        </span>
                    </div>
                </div>

                {/* 3. Juros Simulado */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between relative min-h-[140px] shadow-md hover:border-zinc-700 transition-all duration-300">
                    <div>
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Juros Acumulados</span>
                        <h2 className="text-3xl font-black tracking-tight text-emerald-400 font-mono">
                            {formatCurrency(simulation.totalInterest)}
                        </h2>
                    </div>
                    <div className="border-t border-zinc-800/50 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                        <span>Selic do Relatório:</span>
                        <span className="text-zinc-400 font-semibold">{baseReport.selic_tax}% a.a.</span>
                    </div>
                </div>

                {/* 4. Sobra Mensal de Equilíbrio */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between relative min-h-[140px] shadow-md hover:border-zinc-700 transition-all duration-300">
                    <div>
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Sobra Mês Base</span>
                        <h2 className="text-3xl font-black tracking-tight text-zinc-300 font-mono">
                            {formatCurrency(reportStats.expectedSurplus)}
                        </h2>
                    </div>
                    <div className="border-t border-zinc-800/50 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                        <span>Primeiro Mês:</span>
                        <span className="text-zinc-450 text-emerald-400 font-semibold">Consolidado</span>
                    </div>
                </div>
            </div>

            {/* Split Screen Graph and Variables Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Control Panel Variable Adjustment (Left Column - 4 cols) */}
                <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-5">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-2">
                        <Sliders size={18} className="text-emerald-500" />
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Variáveis da Simulação</h3>
                    </div>

                    {/* Meta de Patrimônio Target Input */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
                            <span>Meta de Patrimônio (R$)</span>
                            <span className="text-emerald-450 text-emerald-400 font-mono text-xs">{formatCurrency(customGoal)}</span>
                        </div>
                        <input
                            type="range"
                            min={100000}
                            max={5000000}
                            step={50000}
                            value={customGoal}
                            onChange={(e) => setCustomGoal(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex items-center gap-1.5 mt-2 bg-zinc-850 border border-zinc-800/50 p-2 rounded">
                            <Goal size={12} className="text-emerald-500 shrink-0" />
                            <input
                                type="number"
                                value={customGoal}
                                onChange={(e) => setCustomGoal(Math.max(0, Number(e.target.value)))}
                                className="bg-transparent text-xs text-zinc-300 font-bold font-mono focus:outline-none w-full"
                            />
                        </div>
                    </div>

                    {/* Daily Spent Mode selector */}
                    <div className="space-y-2">
                        <span className="text-[10px] text-zinc-550 text-zinc-500 font-bold uppercase tracking-wider block">Gasto Diário Selecionado</span>
                        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/50">
                            {[
                                { id: 'historical', label: 'Histórica', val: dailySpentValues.historical },
                                { id: 'current', label: 'Atual', val: reportStats.currentDailyAvg },
                                { id: 'default', label: 'Estimada', val: config?.daily_spent_estimate_default || 0 }
                            ].map((m) => {
                                const active = dailySpentMode === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setDailySpentMode(m.id as any)}
                                        className={`py-1.5 text-[9px] font-bold rounded uppercase tracking-tighter transition-all ${active
                                                ? 'bg-emerald-600 text-white shadow-shadow'
                                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                                            }`}
                                    >
                                        <div>{m.label}</div>
                                        <div className="opacity-80 font-mono">R$ {Math.round(m.val)}/dia</div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[9px] text-zinc-500 italic">
                            O juro é calculado mês a mês, e cada mês subsequente adiciona 30 dias de custos variáveis calculados com esta taxa diária.
                        </p>
                    </div>

                    {/* Projection Horizon Mode Selector */}
                    <div className="space-y-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Limitação de Horizonte</span>
                        <CustomSelect
                            value={horizonMode}
                            onChange={(val) => { setHorizonMode(String(val)); setPage(0); }}
                            options={[
                                { value: 'until_goal', label: 'Até alcançar a Meta' },
                                { value: '12', label: '1 Ano (12 meses)' },
                                { value: '24', label: '2 Anos (24 meses)' },
                                { value: '36', label: '3 Anos (36 meses)' },
                                { value: '48', label: '4 Anos (48 meses)' },
                                { value: '60', label: '5 Anos (60 meses)' },
                                { value: '72', label: '6 Anos (72 meses)' },
                                { value: '84', label: '7 Anos (84 meses)' },
                                { value: '96', label: '8 Anos (96 meses)' },
                                { value: '108', label: '9 Anos (108 meses)' },
                                { value: '120', label: '10 Anos (120 meses)' },
                            ]}
                            className="w-full"
                            buttonClassName="h-9 text-[10px] py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded border border-zinc-700 uppercase tracking-tighter flex items-center justify-between"
                        />
                    </div>

                    {/* Active Recurring Breakdown Stats for transparency */}
                    <div className="border-t border-zinc-800 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Activity size={12} className="text-zinc-500" /> Transações Recorrentes (Mês Base)
                            </span>
                            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono font-semibold">
                                {recurringList.length} itens
                            </span>
                        </div>

                        <div className="max-h-[140px] overflow-y-auto custom-scrollbar border border-zinc-900 rounded bg-zinc-950/50 p-2 space-y-1.5 text-[10px]">
                            {recurringList.length === 0 ? (
                                <p className="text-zinc-650 text-center py-2 text-[10px] italic">Nenhuma transação recorrente no relatório base.</p>
                            ) : (
                                recurringList.map((t, idx) => {
                                    const isIncome = t.type === 'income';
                                    let remText = 'Contínuo';
                                    if (t.remaining_recurrence !== undefined && t.remaining_recurrence !== null && String(t.remaining_recurrence) !== '') {
                                        remText = `${t.remaining_recurrence}x rest.`;
                                    }
                                    return (
                                        <div key={idx} className="flex items-center justify-between border-b border-zinc-850/50 pb-1">
                                            <div className="flex flex-col">
                                                <span className="text-zinc-300 font-semibold truncate max-w-[150px]">{t.source_id ? `Fonte ${t.source_id.slice(0, 4)}` : 'Transação'}</span>
                                                <span className="text-[8px] text-zinc-500 uppercase font-black">{remText}</span>
                                            </div>
                                            <span className={`font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isIncome ? '+' : '-'}{formatCurrency(t.value)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Graph View (Right Column - 8 cols) */}
                <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col min-h-[480px]">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Evolução do Patrimônio Projetada</h3>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar size={12} /> {simulation.dataPoints.length} meses simulados
                        </div>
                    </div>

                    {/* Embedded Recharts Area Chart */}
                    <div className="h-72 bg-zinc-950/40 border border-zinc-850/50 p-4 rounded-lg overflow-hidden relative">
                        {simulation.dataPoints.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={simulation.dataPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="progGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#52525b"
                                        fontSize={9}
                                        axisLine={false}
                                        tickLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        fontSize={9}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `R$ ${Math.round(val / 1000)}k`}
                                        width={50}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-zinc-950 text-zinc-100 p-3.5 border border-zinc-800 rounded-lg shadow-2xl relative max-w-sm">
                                                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest border-b border-zinc-850 pb-1.5 mb-2">
                                                            {d.month} (Mês {d.monthIndex})
                                                        </div>
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between gap-6">
                                                                <span className="text-zinc-500">Saldo Inicial:</span>
                                                                <span className="font-mono text-zinc-300 font-semibold">{formatCurrency(d.startPatrimony)}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-6">
                                                                <span className="text-zinc-500">Soba Mensal:</span>
                                                                <span className="font-mono text-indigo-400 font-semibold">{formatCurrency(d.surplus)}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-6">
                                                                <span className="text-zinc-500">Rendimento Juros:</span>
                                                                <span className="font-mono text-emerald-400 font-semibold">+{formatCurrency(d.interest)}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-6 border-t border-zinc-850 pt-1.5 text-sm font-bold mt-1.5">
                                                                <span>Patrimônio Final:</span>
                                                                <span className="font-mono text-white">{formatCurrency(d.endPatrimony)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {/* Horizontal Goal Target indicator line */}
                                    <ReferenceLine
                                        y={customGoal}
                                        stroke="#10b981"
                                        strokeDasharray="4 4"
                                        strokeWidth={1}
                                        label={{ value: 'Meta', fill: '#10b981', position: 'top', fontSize: 9, fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="endPatrimony"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        fill="url(#progGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Detailed month by month breakdown table */}
                    <div className="mt-6 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Layers size={12} /> Tabela de Acompanhamento Mensal
                            </span>
                        </div>

                        <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden flex-1 select-none">
                            <table className="w-full text-left text-xs text-zinc-400 leading-normal table-fixed">
                                <thead className="bg-zinc-900 text-zinc-500 text-[9px] font-bold uppercase tracking-wider border-b border-zinc-800">
                                    <tr>
                                        <th className="py-2.5 px-4 w-20">Mês</th>
                                        <th className="py-2.5 px-4 text-right">Patrimônio Inicial</th>
                                        <th className="py-2.5 px-4 text-right">Sobra Projetada</th>
                                        <th className="py-2.5 px-4 text-right">Rendimentos Juros</th>
                                        <th className="py-2.5 px-4 text-right">Patrimônio Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {paginatedData.map((dp) => (
                                        <tr key={dp.monthIndex} className="hover:bg-zinc-900/40 transition-colors">
                                            <td className="py-2.5 px-4 font-bold text-zinc-300 font-mono text-[10px] uppercase">
                                                {dp.month}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-zinc-400">
                                                {formatCurrency(dp.startPatrimony)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-indigo-400">
                                                {formatCurrency(dp.surplus)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono text-emerald-450 text-emerald-405 text-emerald-500">
                                                +{formatCurrency(dp.interest)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                                                {formatCurrency(dp.endPatrimony)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Selector */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-[10px] text-zinc-550 text-zinc-500">
                                    Mostrando {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, simulation.dataPoints.length)} de {simulation.dataPoints.length} meses
                                </span>
                                <div className="flex items-center gap-1 bg-zinc-950 p-0.5 border border-zinc-850 rounded">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        className="h-6 px-2 text-[10px] font-bold bg-zinc-900 text-zinc-400 hover:text-white rounded disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-[10px] text-zinc-400 px-3 font-bold">
                                        Pág {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        className="h-6 px-2 text-[10px] font-bold bg-zinc-900 text-zinc-400 hover:text-white rounded disabled:opacity-40"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
