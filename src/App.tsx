import React, { useState, useEffect, useMemo, useRef } from "react";
import { EmptyState } from './components/EmptyState';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    LayoutDashboard,
    Settings,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    AlertTriangle,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCcw,
    PlusCircle,
    X,
    CreditCard,
    Landmark,
    Lock,
    Zap,
    Ticket,
    Navigation,
    Play,
    User,
    Home,
    ShoppingCart,
    Utensils,
    Cat,
    Briefcase,
    Gift,
    Frown,
    Meh,
    Smile,
    Laugh,
    HelpCircle,
    Edit2,
    Coffee,
    Car,
    Plane,
    Bus,
    Smartphone,
    Monitor,
    Music,
    Tv,
    Wifi,
    Dumbbell,
    Heart,
    Ambulance,
    Beef,
    Beer,
    Bike,
    Book,
    Camera,
    Check,
    Cloud,
    Code,
    DollarSign,
    Droplets,
    Eye,
    FastForward,
    Flame,
    Gamepad,
    Globe,
    GraduationCap,
    Hammer,
    IceCream,
    Info,
    Key,
    Lamp,
    Lightbulb,
    Mail,
    Map,
    Moon,
    Package,
    Phone,
    PiggyBank,
    Pizza,
    Plug,
    Printer,
    Rocket,
    Search,
    Shield,
    Star,
    Sun,
    Tag,
    Target,
    Truck,
    Umbrella,
    Video,
    Watch,
    Clock,
    UserPlus,
    ChevronDown,
    History,
    Image as ImageIcon,
    Upload,
    FileText,
    AlertCircle,
    CheckCircle2,
    Flag,
    Filter,
    ListFilter,
    Activity,
    BarChart2
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Legend
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { FinancialProvider, useFinancial } from "./FinancialContext";
import { Report, Transaction, Category, Source, GlobalConfig, TransactionType } from "./types";
import { CustomSelect } from "./components/CustomSelect";
import { ExpensesView } from "./components/ExpensesView";

// Dynamic Icon Component
const Icon = ({ name, className }: { name: string; className?: string }) => {
    if (name?.startsWith("data:") || name?.startsWith("http")) {
        return <img src={name} className={className || "w-4 h-4 rounded shadow-sm"} alt="icon" />;
    }
    const icons: Record<string, any> = {
        Navigation, Play, User, Home, ShoppingCart, Utensils, Cat,
        Briefcase, Gift, PlusCircle, Zap, Ticket, CreditCard, Wallet,
        Landmark, Lock,
        ArrowUpCircle, ArrowDownCircle, RefreshCcw, X, Frown, Meh,
        Smile, Laugh, HelpCircle, Edit2, Coffee, Car, Plane, Bus,
        Smartphone, Monitor, Music, Tv, Wifi, Dumbbell, Heart,
        Activity, Ambulance, Beef, Beer, Bike, Book, Camera, Check,
        Cloud, Code, DollarSign, Droplets, Eye, FastForward, Flame,
        Gamepad, Globe, GraduationCap, Hammer, IceCream, Info, Key,
        Lamp, Lightbulb,
        Mail, Map, Moon, Package, Phone,
        PiggyBank, Pizza, Plug, Printer, Rocket, Search, Settings,
        Shield, Star, Sun, Tag, Target, Trash2, Truck, Umbrella,
        Video, Watch
    };
    const LucideIcon = icons[name] || Wallet;
    return <LucideIcon className={className || "w-4 h-4"} />;
};

const ICON_OPTIONS = [
    "Wallet", "ShoppingCart", "Utensils", "Home", "User", "Navigation",
    "Zap", "Ticket", "CreditCard", "Play", "Cat", "Briefcase", "Gift",
    "ArrowUpCircle", "ArrowDownCircle", "RefreshCcw", "Coffee", "Car",
    "Plane", "Bus", "Smartphone", "Monitor", "Music", "Tv", "Wifi",
    "Dumbbell", "Heart", "Activity", "Ambulance", "Beef", "Beer",
    "Bike", "Book", "Camera", "Check", "Cloud", "Code", "DollarSign",
    "Droplets", "Eye", "FastForward", "Flame", "Gamepad", "Globe",
    "GraduationCap", "Hammer", "IceCream", "Info", "Key", "Lamp",
    "Lightbulb", "Lock", "Mail", "Map", "Moon", "Package", "Phone",
    "PiggyBank", "Pizza", "Plug", "Printer", "Rocket", "Search",
    "Settings", "Shield", "Star", "Sun", "Tag", "Target", "Trash2",
    "Truck", "Umbrella", "Video", "Watch"
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const MoneyInput = ({ value, onChange, label, className = "", autoFocus = false, disabled = false }: any) => {
    const [displayValue, setDisplayValue] = useState("");

    const formatBRL = (val: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(val);
    };

    useEffect(() => {
        setDisplayValue(formatBRL(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        const numericValue = Number(rawValue) / 100;
        onChange(numericValue);
    };

    return (
        <div className={className}>
            {label && <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5 block">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    autoFocus={autoFocus}
                    disabled={disabled}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none font-bold text-emerald-500 text-left disabled:opacity-50"
                />
            </div>
        </div>
    );
};

const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const SHORT_MONTH_NAMES = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function App() {
    const [view, setView] = useState<"dashboard" | "report" | "settings" | "categories" | "aliases" | "suppliers" | "cards">("dashboard");
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [dashboardHistory, setDashboardHistory] = useState<any[]>([]);
    const [config, setConfig] = useState<GlobalConfig | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sources, setSources] = useState<Source[]>([]);
    const [aliases, setAliases] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [myCards, setMyCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showAddReportModal, setShowAddReportModal] = useState(false);
    const [showEditReportModal, setShowEditReportModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showImportSelection, setShowImportSelection] = useState(false);
    const [showAliasMapper, setShowAliasMapper] = useState(false);
    const [unmappedAliases, setUnmappedAliases] = useState<string[]>([]);
    const [showPhotoImport, setShowPhotoImport] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewTransactions, setReviewTransactions] = useState<any[]>([]);
    const [preSelectedCategories, setPreSelectedCategories] = useState<string[]>([]);
    const [pendingReport, setPendingReport] = useState<{
        month: number;
        year: number;
    } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: "danger" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        variant: "warning"
    });

    const fetchData = async (background = false) => {
        if (!background) setLoading(true);
        try {
            const [resReports, resHistory, resConfig, resCats, resSources, resAliases, resSuppliers, resCards] = await Promise.all([
                fetch("/api/reports"),
                fetch("/api/dashboard/history"),
                fetch("/api/config"),
                fetch("/api/categories"),
                fetch("/api/sources"),
                fetch("/api/aliases"),
                fetch("/api/suppliers"),
                fetch("/api/cards")
            ]);

            const reportsData = await resReports.json();

            const fullReports = await Promise.all(reportsData.map(async (r: Report) => {
                const res = await fetch(`/api/reports/${r.id}`);
                return res.json();
            }));
            setReports(fullReports);

            const historyData = await resHistory.json();
            setDashboardHistory(historyData);

            const configData = await resConfig.json();
            setConfig({
                daily_spent_avg: Number(configData.daily_spent_avg),
                okr_min_default: Number(configData.okr_min_default),
                okr_ambitious_default: Number(configData.okr_ambitious_default),
                cycle_day_default: Number(configData.cycle_day_default),
                daily_spent_estimate_default: Number(configData.daily_spent_estimate_default),
                goal_target_default: Number(configData.goal_target_default),
                default_incomes: configData.default_incomes ? JSON.parse(configData.default_incomes) : []
            });

            setCategories(await resCats.json());
            setSources(await resSources.json());
            setAliases(await resAliases.json());
            setSuppliers(await resSuppliers.json());
            setMyCards(await resCards.json());
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            if (!background) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [activeReportData, setActiveReportData] = useState<Report | null>(null);

    useEffect(() => {
        if (selectedReportId) {
            const found = reports.find(r => r.id === selectedReportId);
            if (found) {
                setActiveReportData(found);
            } else {
                fetch(`/api/reports/${selectedReportId}`)
                    .then(res => res.json())
                    .then(data => setActiveReportData(data));
            }
        } else {
            setActiveReportData(null);
        }
    }, [selectedReportId, reports]);

    const handleCreateReport = async (data: any) => {
        const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const newReport = await res.json();
            await fetchData(true);
            setSelectedReportId(newReport.id);
            setView("report");
            setShowAddReportModal(false);
            setPendingReport(null);
        }
    };

    const handleAliasMappingComplete = async (mapping: Record<string, string>) => {
        // Fetch latest suppliers to get their categories correctly
        const latestSuppliers = await fetch("/api/suppliers").then(res => res.json());
        setSuppliers(latestSuppliers);

        let updatedTransactions = [...reviewTransactions];

        for (const [aliasName, supplierId] of Object.entries(mapping)) {
            // Find the supplier to get its default categories
            const supplier = latestSuppliers.find((s: any) => s.id === supplierId);

            // Update transactions that have this alias
            updatedTransactions = updatedTransactions.map(t => {
                if (t.aliasName === aliasName) {
                    let catId = t.type === 'expense' ? supplier?.expense_category_id : supplier?.income_category_id;
                    return {
                        ...t,
                        supplier_id: supplierId,
                        // Also update categories to match supplier's categories
                        category_id: catId || t.category_id
                    };
                }
                return t;
            });
        }

        setReviewTransactions(updatedTransactions);
        setShowAliasMapper(false);
        setShowReviewModal(true);
    };
    const handleUpdateReport = async (formData: any) => {
        const res = await fetch(`/api/reports/${selectedReportId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            const data = await fetch(`/api/reports/${selectedReportId}`).then(r => r.json());
            setActiveReportData(data);
            await fetchData(true);
            setShowEditReportModal(false);
        }
    };

    const handleDeleteReport = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Deletar Relatório",
            message: "Tem certeza que deseja deletar este relatório e todas as suas transações? Esta ação é irreversível.",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        await fetchData(true);
                        if (selectedReportId === id) {
                            setView("dashboard");
                            setSelectedReportId(null);
                        }
                    }
                } catch (err) {
                    console.error("Error deleting report:", err);
                }
                setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleCalculateProjection = async (reportId: string) => {
        try {
            const res = await fetch(`/api/reports/${reportId}/calculate-projection`, {
                method: "POST"
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Falha ao calcular projeção");
            }
            await fetchData(true);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleAddTransaction = async (formData: any) => {
        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, report_id: selectedReportId })
        });
        if (res.ok) {
            const data = await fetch(`/api/reports/${selectedReportId}`).then(r => r.json());
            setActiveReportData(data);
            setShowTransactionModal(false);
            setEditingTransaction(null);
            await fetchData(true);
        }
    };

    const handleUpdateTransaction = async (formData: any) => {
        if (!editingTransaction) return;
        try {
            const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, report_id: selectedReportId })
            });
            if (res.ok) {
                // Refresh full report data to ensure stats are correct
                const data = await fetch(`/api/reports/${selectedReportId}`).then(r => r.json());
                setActiveReportData(data);
                setShowTransactionModal(false);
                setEditingTransaction(null);
                // Also refresh global reports list for historical context
                await fetchData(true);
            }
        } catch (err) {
            console.error("Error updating transaction:", err);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Deletar Transação",
            message: "Confirmar a exclusão desta movimentação?",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        // 1. Update active report data locally for immediate feedback
                        setActiveReportData(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                transactions: prev.transactions?.filter(t => t.id !== id)
                            };
                        });
                        // 2. Refresh everything in background to keep global stats synced
                        await fetchData(true);
                        // 3. Confirm we have the latest version of THIS report specifically
                        const data = await fetch(`/api/reports/${selectedReportId}`).then(r => r.json());
                        setActiveReportData(data);
                    }
                } catch (err) {
                    console.error("Error deleting transaction:", err);
                }
                setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleNavigate = (direction: 'next' | 'prev') => {
        if (!activeReportData) return;
        const currentMonth = activeReportData.month;
        const currentYear = activeReportData.year;

        let targetMonth = currentMonth;
        let targetYear = currentYear;

        if (direction === 'prev') {
            targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        } else {
            targetMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        }

        const targetReport = reports.find((r: any) => r.month === targetMonth && r.year === targetYear);
        if (targetReport) {
            setSelectedReportId(targetReport.id);
        } else {
            setConfirmModal({
                isOpen: true,
                title: "Criar novo relatório?",
                message: `Deseja criar um novo relatório para ${MONTH_NAMES[targetMonth]}/${targetYear}?`,
                variant: "warning",
                onConfirm: () => {
                    setPendingReport({ month: targetMonth, year: targetYear });
                    setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
                    setShowAddReportModal(true);
                }
            });
        }
    };

    return (
        <FinancialProvider reports={reports} activeReport={activeReportData} config={config}>
            <FinancialAppContent
                view={view} setView={setView}
                selectedReportId={selectedReportId} setSelectedReportId={setSelectedReportId}
                reports={reports} dashboardHistory={dashboardHistory}
                config={config} categories={categories} sources={sources} aliases={aliases} suppliers={suppliers} cards={myCards}
                activeReportData={activeReportData} setActiveReportData={setActiveReportData}
                loading={loading} fetchData={fetchData}
                setShowConfigModal={setShowConfigModal}
                setShowAddReportModal={setShowAddReportModal}
                setShowEditReportModal={setShowEditReportModal}
                setShowTransactionModal={setShowTransactionModal}
                setShowImportSelection={setShowImportSelection}
                setPreSelectedCategories={setPreSelectedCategories}
                setEditingTransaction={setEditingTransaction}
                setPendingReport={setPendingReport}
                setConfirmModal={setConfirmModal}
                handleDeleteReport={handleDeleteReport}
                handleCalculateProjection={handleCalculateProjection}
                handleNavigate={handleNavigate}
                handleDeleteTransaction={handleDeleteTransaction}
            />

            {/* Modals */}
            {showConfigModal && (
                <ConfigModal config={config} categories={categories} sources={sources} onClose={() => setShowConfigModal(false)} onSave={() => fetchData()} />
            )}
            {showAddReportModal && (
                <AddReportModal
                    reports={reports}
                    config={config}
                    onClose={() => {
                        setShowAddReportModal(false);
                        setPendingReport(null);
                    }}
                    onSubmit={handleCreateReport}
                    initialMonth={pendingReport?.month}
                    initialYear={pendingReport?.year}
                />
            )}
            {showTransactionModal && (
                <TransactionModal
                    categories={categories}
                    sources={sources}
                    suppliers={suppliers}
                    cards={myCards}
                    report={activeReportData}
                    transaction={editingTransaction}
                    preSelectedCategories={preSelectedCategories}
                    onClose={() => {
                        setShowTransactionModal(false);
                        setEditingTransaction(null);
                        setPreSelectedCategories([]);
                    }}
                    onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
                />
            )}
            {showImportSelection && (
                <ImportSelectionModal
                    onClose={() => setShowImportSelection(false)}
                    onSelectPhoto={() => {
                        setShowImportSelection(false);
                        setShowPhotoImport(true);
                    }}
                    onSelectManual={() => {
                        setPreSelectedCategories([]);
                        setShowImportSelection(false);
                        setShowTransactionModal(true);
                    }}
                />
            )}
            {showPhotoImport && (
                <PhotoImportModal
                    activeReport={activeReportData}
                    cards={myCards}
                    onClose={() => setShowPhotoImport(false)}
                    onComplete={(data: any) => {
                        setShowPhotoImport(false);
                        const mappedTxs = data.transactions.map((t: any, idx: number) => ({
                            ...t,
                            original_index: idx,
                            importType: data.importType,
                            card_id: data.card_id
                        }));
                        setReviewTransactions(mappedTxs);

                        // Find unique aliases that have NO supplier_id
                        const unmapped = Array.from(new Set(
                            mappedTxs.filter((t: any) => !t.supplier_id && t.aliasName).map((t: any) => t.aliasName)
                        )) as string[];

                        if (unmapped.length > 0) {
                            setUnmappedAliases(unmapped);
                            setShowAliasMapper(true);
                        } else {
                            setShowReviewModal(true);
                        }
                    }}
                />
            )}
            {showAliasMapper && (
                <AliasMapperModal
                    unmappedAliases={unmappedAliases}
                    suppliers={suppliers}
                    categories={categories}
                    aliases={aliases}
                    onRefreshSuppliers={async () => {
                        await fetch("/api/suppliers").then(res => res.json()).then(setSuppliers);
                        // aliases might also be updated because SupplierModal can map aliases!
                        await fetch("/api/aliases").then(res => res.json()).then(setAliases);
                    }}
                    onClose={() => {
                        setShowAliasMapper(false);
                        setReviewTransactions([]);
                    }}
                    onComplete={handleAliasMappingComplete}
                />
            )}
            {showReviewModal && (
                <ReviewTransactionsModal
                    activeReport={activeReportData}
                    reports={reports}
                    transactions={reviewTransactions}
                    categories={categories}
                    sources={sources}
                    suppliers={suppliers}
                    aliases={aliases}
                    cards={myCards}
                    onClose={() => setShowReviewModal(false)}
                    onConfirm={async () => {
                        setShowReviewModal(false);
                        if (activeReportData) {
                            const data = await fetch(`/api/reports/${activeReportData.id}`).then(r => r.json());
                            setActiveReportData(data);
                        }
                        await fetchData(true);
                    }}
                />
            )}
            {showEditReportModal && (
                <EditReportModal
                    report={activeReportData}
                    onClose={() => setShowEditReportModal(false)}
                    onSubmit={handleUpdateReport}
                />
            )}
            {confirmModal.isOpen && (
                <ConfirmModal
                    {...confirmModal}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                />
            )}
        </FinancialProvider>
    );
}

function FinancialAppContent({
    view, setView, selectedReportId, setSelectedReportId, reports, dashboardHistory, config, categories, sources, aliases, suppliers, cards,
    activeReportData, setActiveReportData, loading, fetchData, setShowConfigModal, setShowAddReportModal,
    setShowEditReportModal, setShowTransactionModal, setShowImportSelection, setPreSelectedCategories,
    setEditingTransaction, setPendingReport,
    setConfirmModal, handleDeleteReport, handleCalculateProjection, handleNavigate, handleDeleteTransaction
}: any) {
    const { dailySpentMode, setDailySpentMode, surplusProjectionMode, setSurplusProjectionMode, dailySpentValues, surplusValues, activeReportStats } = useFinancial();

    const { latestReportFull } = useMemo(() => {
        if (reports.length === 0) return { latestReportFull: null };

        const now = getNow();
        const sortedReports = [...reports].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });

        const currentOrPastReport = sortedReports.find(r => {
            const startDate = getInitialDate(r.start_date);
            startDate.setHours(0, 0, 0, 0);
            return startDate <= now;
        }) || sortedReports[0];

        return { latestReportFull: currentOrPastReport };
    }, [reports]);

    const overlappingReports = useMemo(() => {
        if (reports.length < 2) return [];

        const overlaps: string[] = [];
        const sorted = [...reports].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            const currentEnd = getFinalDate(current.end_date);
            const nextStart = getInitialDate(next.start_date);

            if (nextStart < currentEnd) {
                overlaps.push(`${MONTH_NAMES[next.month]}/${next.year}`);
            }
        }
        return overlaps;
    }, [reports]);

    if (loading) return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-sans">
            <div className="flex flex-col items-center gap-4">
                <RefreshCcw className="animate-spin text-emerald-500 w-8 h-8" />
                <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Carregando Sistema...</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
            {/* SIDEBAR */}
            <aside className="w-20 hover:w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out group/sidebar">
                <div className="h-14 border-b border-zinc-800 flex items-center px-6 shrink-0 overflow-hidden">
                    <div
                        className="flex items-center gap-2 cursor-pointer group shrink-0"
                        onClick={() => { setView("dashboard"); setSelectedReportId(null); }}
                    >
                        <span className="w-3 h-3 bg-emerald-500 rounded-full group-hover:animate-pulse shrink-0"></span>
                        <h1 className="text-sm font-bold tracking-tight text-white opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">PATRIMÔNIO.IO</h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4 overflow-hidden">
                    <SidebarItem
                        active={view === 'dashboard'}
                        onClick={() => { setView("dashboard"); setSelectedReportId(null); }}
                        icon={LayoutDashboard}
                        label="Dashboard"
                    />
                    <SidebarItem
                        active={view === 'report'}
                        onClick={() => {
                            if (reports.length > 0) {
                                const latest = [...reports].sort((a, b) => {
                                    if (a.year !== b.year) return b.year - a.year;
                                    return b.month - a.month;
                                })[0];
                                setSelectedReportId(latest.id);
                                setView("report");
                            } else {
                                setView("dashboard");
                            }
                        }}
                        icon={Calendar}
                        label="Relatórios"
                    />
                    <SidebarItem
                        active={view === 'categories'}
                        onClick={() => setView("categories")}
                        icon={Tag}
                        label="Categorias"
                    />
                    <SidebarItem
                        active={view === 'aliases'}
                        onClick={() => setView("aliases")}
                        icon={UserPlus}
                        label="Pseudônimos"
                    />
                    <SidebarItem
                        active={view === 'suppliers'}
                        onClick={() => setView("suppliers")}
                        icon={Package}
                        label="Fornecedores"
                    />
                    <SidebarItem
                        active={view === 'cards'}
                        onClick={() => setView("cards")}
                        icon={CreditCard}
                        label="Cartões"
                    />
                </nav>

                <div className="p-4 border-t border-zinc-800 overflow-hidden">
                    <button
                        onClick={() => setShowConfigModal(true)}
                        className="w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 group"
                    >
                        <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-200 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">Definições</span>
                    </button>
                </div>
            </aside>

            {/* RIGHT CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* HEADER */}
                <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-6 shrink-0 z-40">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                            {view === "dashboard" ? "Visão Geral" : view === "report" ? "Análise Mensal" : view === "aliases" ? "Gestão de Pseudônimos" : view === "suppliers" ? "Gestão de Fornecedores" : view === "cards" ? "Gestão de Cartões" : "Gestão de Categorias"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-zinc-800/40 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm uppercase">
                            <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest px-2">Diário</span>
                            <div className="flex items-center gap-1 uppercase">
                                {[
                                    { id: 'historical', label: 'Histórico', color: 'bg-blue-600', val: dailySpentValues.historical },
                                    { id: 'current', label: 'Atual', color: 'bg-orange-600', val: dailySpentValues.current },
                                    { id: 'default', label: 'Estimado', color: 'bg-emerald-600', val: dailySpentValues.default }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setDailySpentMode(m.id as any)}
                                        className="relative px-3 py-1.5 text-[8px] rounded-lg transition-all duration-300 overflow-hidden uppercase"
                                        style={{ minWidth: 150 }}
                                    >
                                        <span className={`relative z-10 font-bold ${dailySpentMode === m.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'} uppercase`}>
                                            {m.label}: {formatCurrency(m.val || 0)}
                                        </span>
                                        {dailySpentMode === m.id && (
                                            <motion.div
                                                layoutId="activeMode"
                                                className={`absolute inset-0 ${m.color}`}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-zinc-800/40 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm uppercase">
                            <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest px-2">Sobra</span>
                            <div className="flex items-center gap-1 uppercase">
                                {[
                                    { id: 'historical', label: 'Histórica', color: 'bg-blue-600', val: surplusValues.historical },
                                    { id: 'current', label: 'Atual', color: 'bg-orange-600', val: surplusValues.current },
                                    { id: 'default', label: 'Estimada', color: 'bg-emerald-600', val: surplusValues.default }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSurplusProjectionMode(m.id as any)}
                                        className="relative px-3 py-1.5 text-[8px] rounded-lg transition-all duration-300 overflow-hidden uppercase"
                                        style={{ minWidth: 150 }}
                                    >
                                        <span className={`relative z-10 font-bold ${surplusProjectionMode === m.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'} uppercase`}>
                                            {m.label}: {formatCurrency(m.val)}
                                        </span>
                                        {surplusProjectionMode === m.id && (
                                            <motion.div
                                                layoutId="activeSurplusMode"
                                                className={`absolute inset-0 ${m.color}`}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden p-4">
                    <AnimatePresence mode="wait">
                        {view === "dashboard" ? (
                            <DashboardView
                                key="dash"
                                reports={reports}
                                dashboardHistory={dashboardHistory}
                                onSelectReport={(id: string) => { setSelectedReportId(id); setView("report"); }}
                                onAddReport={() => setShowAddReportModal(true)}
                                onDeleteReport={handleDeleteReport}
                                categories={categories}
                                sources={sources}
                                config={config}
                                latestReportFull={latestReportFull}
                            />
                        ) : view === "report" ? (
                            <ReportView
                                key="report"
                                report={activeReportData}
                                reports={reports}
                                categories={categories}
                                sources={sources}
                                suppliers={suppliers}
                                cards={cards}
                                onBack={() => { setView("dashboard"); setSelectedReportId(null); }}
                                onAddTransaction={() => {
                                    setEditingTransaction(null);
                                    setShowImportSelection(true);
                                }}
                                onEditTransaction={(t: Transaction) => {
                                    setEditingTransaction(t);
                                    setShowTransactionModal(true);
                                }}
                                onEditReport={() => setShowEditReportModal(true)}
                                onDeleteTransaction={handleDeleteTransaction}
                                onDeleteReport={handleDeleteReport}
                                onCalculateProjection={handleCalculateProjection}
                                onNavigate={handleNavigate}
                                config={config}
                            />
                        ) : view === "aliases" ? (
                            <AliasesView aliases={aliases} onRefresh={fetchData} />
                        ) : view === "suppliers" ? (
                            <SuppliersView suppliers={suppliers} categories={categories} aliases={aliases} onRefresh={fetchData} />
                        ) : view === "cards" ? (
                            <CardsView onRefresh={fetchData} />
                        ) : (
                            <CategoriesView key="categories" categories={categories} onSave={fetchData} />
                        )}
                    </AnimatePresence>
                </main>

                {/* FOOTER */}
                <footer className="h-8 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            System Sync: Online
                        </span>
                        {overlappingReports.length > 0 && (
                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-tight flex items-center gap-1">
                                <AlertTriangle size={12} />
                                Aviso: Conflito de datas em {overlappingReports.join(", ")}
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono uppercase">
                        NodeJS + SQLite Core • v2.4.0
                    </div>
                </footer>
            </div>
        </div>
    );
}

// --- Helper Hooks ---

function usePatrimonyProjection(report: Report | null, projectionMonths: number, scenarioKey: number) {
    const { selectedSurplusValue, activeReportStats } = useFinancial();

    return useMemo(() => {
        if (!report || !activeReportStats) return [];

        const surplusValue = selectedSurplusValue;

        const annualRate = report.selic_tax / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        // Calculate interest on initial balance before adding surplus (End of current month)
        const currentInterest = report.initial_patrimony * monthlyRate;
        let currentPatrimony = report.initial_patrimony + currentInterest + activeReportStats.expectedSurplus; // First month always uses current expected

        let currentSelic = report.selic_tax;
        const data = [{
            month: `${SHORT_MONTH_NAMES[report.month]}/${report.year}`,
            patrimony: currentPatrimony,
            interest: currentInterest,
            selic: currentSelic
        }];

        for (let i = 1; i <= projectionMonths; i++) {
            // Simulate Selic volatility (simplified logic)
            const adjustments = [0, 0.25, 0.5, 0.75];
            const adjWeights = [0.3, 0.4, 0.15, 0.15];
            const adjIndex = Math.random();
            let acc = 0;
            let adjValue = 0;
            for (let j = 0; j < adjWeights.length; j++) {
                acc += adjWeights[j];
                if (adjIndex <= acc) {
                    adjValue = adjustments[j];
                    break;
                }
            }
            const probPlus = Math.max(0, Math.min(1, 1 - (currentSelic - 10) / 5));
            const sign = Math.random() < probPlus ? 1 : -1;
            currentSelic = parseFloat(Math.max(0, currentSelic + (sign * adjValue)).toFixed(2));

            const mAnnualRate = currentSelic / 100;
            const mRate = Math.pow(1 + mAnnualRate, 1 / 12) - 1;
            // Calculate interest on the previous end balance (which is this month's start balance)
            const interestEarned = currentPatrimony * mRate;
            // Apply interest then add the surplus for the month
            currentPatrimony = currentPatrimony + interestEarned + surplusValue;

            const dateObj = new Date(report.year, report.month + i, 1);
            const mIndex = dateObj.getMonth();
            const yIndex = dateObj.getFullYear();
            data.push({
                month: `${SHORT_MONTH_NAMES[mIndex]}/${yIndex}`,
                patrimony: currentPatrimony,
                interest: interestEarned,
                selic: currentSelic
            });
        }
        return data;
    }, [report, activeReportStats, projectionMonths, scenarioKey, selectedSurplusValue]);
}

function useTimeToGoal(report: Report | null, config: GlobalConfig | null) {
    const { selectedSurplusValue, activeReportStats } = useFinancial();

    return useMemo(() => {
        if (!report || !activeReportStats) return null;

        const surplusValue = selectedSurplusValue;

        const target = Number(config?.goal_target_default) || 1000000;
        const annualRate = report.selic_tax / 100;
        const rate = Math.pow(1 + annualRate, 1 / 12) - 1;

        // Month 0: Initial + (Initial * Rate) + Current Expected Surplus
        let current = report.initial_patrimony * (1 + rate) + activeReportStats.expectedSurplus;
        const monthlySurplus = surplusValue;

        if (current >= target) return { months: 0, years: 0 };
        if (monthlySurplus <= 0 && rate <= 0) return null;

        let m = 0;
        while (current < target && m < 1200) {
            // Future months: (Balance * (1 + rate)) + Surplus
            current = current * (1 + rate) + monthlySurplus;
            m++;
        }
        return { months: m % 12, years: Math.floor(m / 12) };
    }, [report, activeReportStats, config, selectedSurplusValue]);
}

function PatrimonyProjectionCard({
    report,
    config,
    showDetailedStats = true
}: {
    report: Report;
    config: GlobalConfig | null;
    showDetailedStats?: boolean;
}) {
    const { activeReportStats } = useFinancial();
    const [projectionMonths, setProjectionMonths] = useState(3);
    const [scenarioKey, setScenarioKey] = useState(0);

    const projectionData = usePatrimonyProjection(report, projectionMonths, scenarioKey);
    const timeToGoal = useTimeToGoal(report, config);

    if (!activeReportStats) return null;

    return (
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
            <ProjectionSection
                report={report}
                projectionData={projectionData}
                months={projectionMonths}
                setMonths={setProjectionMonths}
                scenarioKey={scenarioKey}
                setScenarioKey={setScenarioKey}
            />

            {showDetailedStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                        <ProgressBar
                            name="OKR MÍNIMO"
                            current={activeReportStats.totalIncome - activeReportStats.totalExpense - activeReportStats.expectedDiscretionaryFuture}
                            target={report.okr_min}
                            color="bg-blue-500"
                        />
                    </div>
                    <div className="bg-zinc-800/30 p-3 rounded border border-zinc-800">
                        <ProgressBar
                            name="OKR AMBICIOSO"
                            current={activeReportStats.totalIncome - activeReportStats.totalExpense - activeReportStats.expectedDiscretionaryFuture}
                            target={report.okr_ambitious}
                            color="bg-emerald-500"
                        />
                    </div>
                    <div className="bg-zinc-800/30 p-2 rounded border border-zinc-800 flex flex-col justify-center">
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">META: {formatCurrency(config?.goal_target_default || 1000000)}</p>
                        <p className="text-xs font-black text-emerald-400 tracking-tighter">
                            {timeToGoal ? `${timeToGoal.years}a ${timeToGoal.months}m` : "∞"}
                        </p>
                        <p className="text-[7px] text-zinc-600 font-bold uppercase">Tempo Estimado</p>
                    </div>
                    <div className="bg-zinc-800/30 p-2 rounded border border-zinc-800 flex flex-col justify-center">
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">ESTIMATIVA EM {projectionMonths}M</p>
                        <p className="text-xs font-black text-white tracking-tighter">
                            {projectionData.length > 0 ? formatCurrency(projectionData[projectionData.length - 1].patrimony) : "---"}
                        </p>
                        <p className="text-[7px] text-zinc-600 font-bold uppercase">Fim do Período</p>
                    </div>
                </div>
            )}
        </div>
    );
}

interface DashboardProps {
    reports: Report[];
    dashboardHistory: any[];
    onSelectReport: (id: string) => void;
    onAddReport: () => void;
    onDeleteReport: (id: string) => void;
    categories: Category[];
    sources: Source[];
    config: GlobalConfig | null;
    latestReportFull: Report | null;
    key?: string;
}

function ReportListItem({ r, onClick, onDelete, config }: { r: Report; onClick: () => void; onDelete: (id: string) => void; key?: string; config: GlobalConfig | null }) {
    const { selectedDailyValue, dailySpentMode } = useFinancial();
    const startDate = getInitialDate(r.start_date);
    const endDate = getFinalDate(r.end_date);
    const now = getNow();
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.min(totalDays, Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));

    const percentage = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    const isInProgress = useMemo(() => {
        const now = getNow();
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return now >= start && now <= end;
    }, [r.start_date, r.end_date]);

    const isNotStarted = useMemo(() => {
        const now = getNow();
        const start = new Date(r.start_date);
        start.setHours(0, 0, 0, 0);
        return now < start;
    }, [r.start_date]);

    const metOkrMin = useMemo(() => {
        if (!r.transactions) return false;
        const income = r.transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.value, 0);
        const expense = r.transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.value, 0);
        return (income - expense) >= r.okr_min;
    }, [r.transactions, r.okr_min]);

    const metOkrAmbitious = useMemo(() => {
        if (!r.transactions) return false;
        const income = r.transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.value, 0);
        const expense = r.transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.value, 0);
        return (income - expense) >= r.okr_ambitious;
    }, [r.transactions, r.okr_ambitious]);

    const projection = useMemo(() => {
        if (!r.transactions) return null;

        const startDate = getInitialDate(r.start_date);
        const endDate = getFinalDate(r.end_date);
        const now = getNow();

        const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const daysPassed = Math.min(totalDays, Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
        let daysRemaining = Math.ceil(Math.max(0, Math.min(totalDays - daysPassed, totalDays)));

        const income = r.transactions.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.value), 0);
        const totalExpenses = r.transactions.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.value), 0);

        const avgDailyExpense = selectedDailyValue;

        const projectedVariable = avgDailyExpense * daysRemaining;
        const estimatedTotalExpense = totalExpenses + projectedVariable;
        const estimatedSurplus = income - estimatedTotalExpense;

        const annualRate = r.selic_tax / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

        const projected = r.initial_patrimony * (1 + monthlyRate) + estimatedSurplus;
        const increase = r.initial_patrimony !== 0 ? ((projected - r.initial_patrimony) / r.initial_patrimony) * 100 : (projected - r.initial_patrimony);

        return { projected, increase, surplus: estimatedSurplus, estimatedTotalExpense, remainingDays: daysRemaining, avgDailyExpense };
    }, [r.transactions, r.initial_patrimony, r.selic_tax, r.start_date, r.end_date, config, dailySpentMode, selectedDailyValue]);

    return (
        <div
            className="relative group p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700/50 hover:shadow-lg rounded-xl transition-all cursor-pointer flex items-center justify-between uppercase"
            onClick={onClick}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all duration-300"
                style={{ cursor: "pointer" }}
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="20" cy="20" r="18" className="stroke-zinc-800" strokeWidth="4" fill="none" />
                        <circle cx="20" cy="20" r="18" className="stroke-emerald-500" strokeWidth="4" fill="none"
                            strokeDasharray="113"
                            strokeDashoffset={113 - (113 * percentage) / 100}
                            strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[8px] font-bold text-zinc-300">{percentage.toFixed(0)}%</span>
                </div>
            </div>

            <div className="flex flex-row items-start gap-1 flex-1 pl-4">
                <div className="flex flex-col  justify-between w-full">
                    <div className="flex flex-col">
                        <p className="font-black text-sm text-zinc-100">{MONTH_NAMES[r.month]} / {r.year}</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                {formatDate(r.start_date).split('/').slice(0, 2).join('/')} a {formatDate(r.end_date).split('/').slice(0, 2).join('/')}
                            </p>
                            {projection ? (
                                <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 tracking-tight">
                                    <span>{formatCurrency(r.initial_patrimony)}</span>
                                    <ArrowRight className="w-3 h-3" style={{ marginTop: 1 }} />
                                    <span className={`${projection.projected >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(projection.projected).replace("-", "")}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-zinc-600 italic self-start">---</p>
                            )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {projection && (
                                <div className={`px-2 py-0.5 rounded-full border ${projection.increase >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: -13 }}>
                                    <span className={`text-[${r.initial_patrimony === 0 ? 11 : 9}px] font-black uppercase`} style={{ padding: 2 }}>
                                        {r.initial_patrimony === 0 ? '∞' : (projection.increase >= 0 ? '+' : '') + Math.abs(Math.abs(projection.increase)).toFixed(2) + '%'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <span className={`font-bold ${(projection?.projected ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`} style={{ fontSize: 9 }}></span>
                <div className="flex flex-col justify-between w-full" style={{ alignItems: "flex-end" }}>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-950 rounded-full border border-zinc-800">
                        {isNotStarted ? (
                            <Clock className="w-3 h-3 text-zinc-500" />
                        ) : isInProgress ? (
                            <HelpCircle className="w-3 h-3 text-blue-500" />
                        ) : metOkrAmbitious ? (
                            <Laugh className="w-3 h-3 text-emerald-400" />
                        ) : metOkrMin ? (
                            <Smile className="w-3 h-3 text-blue-400" />
                        ) : (
                            <Frown className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-[9px] font-bold text-zinc-400 uppercase" style={{ padding: 2 }}>
                            {isNotStarted ? "Não Iniciado" : isInProgress ? "Em Curso" : metOkrAmbitious ? "Excelente" : metOkrMin ? "Bom" : "Atenção"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
function DashboardView({
    reports,
    dashboardHistory,
    onSelectReport,
    onAddReport,
    onDeleteReport,
    categories,
    sources,
    config,
    latestReportFull
}: DashboardProps) {
    const { activeReportStats } = useFinancial();
    const [performanceMetric, setPerformanceMetric] = useState<'discretionary' | 'fixed' | 'surplus'>('surplus');

    const timeToGoal = useTimeToGoal(latestReportFull, config);

    const financialHistory = useMemo(() => {
        return dashboardHistory.map(h => ({
            ...h,
            monthName: `${SHORT_MONTH_NAMES[h.month]}/${h.year}`
        }));
    }, [dashboardHistory]);

    const off = useMemo(() => {
        if (financialHistory.length === 0) return 0;
        const dataMax = Math.max(...financialHistory.map((i) => i[performanceMetric]));
        const dataMin = Math.min(...financialHistory.map((i) => i[performanceMetric]));

        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;

        return dataMax / (dataMax - dataMin);
    }, [financialHistory, performanceMetric]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 h-full"
        >
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                {/* Left Area: History & List */}
                <div className="col-span-8 flex flex-col gap-4 h-full min-h-0">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div>
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Evolução temporal</h3>
                                    <div className="flex bg-zinc-800/40 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm">
                                        {(['surplus', 'discretionary', 'fixed'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setPerformanceMetric(mode)}
                                                className="relative px-3 py-1.5 text-[9px] rounded-lg transition-all duration-300 overflow-hidden"
                                                style={{ minWidth: 100 }}
                                            >
                                                <span className={`relative z-10 font-bold ${performanceMetric === mode ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'} uppercase`}>
                                                    {mode === 'surplus' ? 'Sobra Atual' : mode === 'discretionary' ? 'DISCRICIONÁRIO' : 'OBRIGATÓRIO'}
                                                </span>
                                                {performanceMetric === mode && (
                                                    <motion.div
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                        layoutId="activeMetric"
                                                        className="absolute inset-0 bg-emerald-600"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                            <button
                                onClick={onAddReport}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 uppercase"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Relatório
                            </button>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            {financialHistory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={financialHistory} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id={`color-${performanceMetric}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset={off} stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset={off} stopColor="#f43f5e" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                        <XAxis dataKey="monthName" stroke="#3f3f46" fontSize={9} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#3f3f46" fontSize={9} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    const val = d[performanceMetric];
                                                    return (
                                                        <div className="bg-zinc-900 p-3 border border-zinc-800 rounded shadow-2xl opacity-95">
                                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{d.monthName}</p>
                                                            <p className={`text-sm font-bold ${val >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {formatCurrency(val)}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            name={performanceMetric === 'fixed' ? 'GASTO OBRIGATÓRIO' : performanceMetric === 'discretionary' ? 'GASTO DISCRICIONÁRIO' : 'SOBRA ATUAL'}
                                            type="monotone"
                                            dataKey={performanceMetric}
                                            stroke="#64748b"
                                            fillOpacity={1}
                                            fill={`url(#color-${performanceMetric})`}
                                            strokeWidth={2}
                                            dot={({ cx, cy, payload }) => (
                                                <circle
                                                    key={payload.monthName}
                                                    cx={cx}
                                                    cy={cy}
                                                    r={3}
                                                    fill={payload[performanceMetric] >= 0 ? "#10b981" : "#f43f5e"}
                                                />
                                            )}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-700 bg-zinc-950/30 rounded-lg border border-zinc-800/50 italic text-sm">
                                    Nenhum dado disponível. Iniciando sistema.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        {latestReportFull && activeReportStats ? (
                            <PatrimonyProjectionCard
                                report={latestReportFull}
                                config={config}
                                showDetailedStats={false}
                            />
                        ) : (
                            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center opacity-30 text-center space-y-3">
                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                                    <LayoutDashboard className="w-6 h-6" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest max-w-[150px]">
                                    {latestReportFull ? "Carregando projeção..." :
                                        reports.length > 0 ? "Nenhum relatório iniciado disponível." :
                                            "Crie um relatório para ver projeções."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Mini Stats */}
                <aside className="col-span-4 flex flex-col gap-4">
                    {/* Patrimony Goal and Time Estimate */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
                            <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Meta de Patrimônio</h3>
                            <p className="text-lg font-black text-white">{formatCurrency(config?.goal_target_default || 1000000)}</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
                            <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tempo Estimado</h3>
                            <p className="text-lg font-black text-emerald-400">
                                {timeToGoal ? `${timeToGoal.years}a ${timeToGoal.months}m` : "∞"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-hidden flex flex-col">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Relatórios Arquivados</h3>
                        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                            {reports.map((r) => (
                                <ReportListItem
                                    key={r.id}
                                    r={r}
                                    onClick={() => onSelectReport(r.id)}
                                    onDelete={onDeleteReport}
                                    config={config}
                                />
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
}

interface ReportViewProps {
    report: Report | null;
    reports: Report[];
    categories: Category[];
    sources: Source[];
    suppliers: any[];
    cards: any[];
    onBack: () => void;
    onAddTransaction: () => void;
    onEditTransaction: (t: Transaction) => void;
    onEditReport: () => void;
    onDeleteTransaction: (id: string) => void;
    onDeleteReport: (id: string) => void;
    onNavigate: (direction: 'next' | 'prev') => void;
    onCalculateProjection: (id: string) => void;
    config: GlobalConfig | null;
    key?: string;
}

function getNow() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function getFinalDate(dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date;
}

function getInitialDate(dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
}

function AIProjectionCard({ report, onCalculate }: { report: Report, onCalculate: (id: string) => void }) {
    const [loading, setLoading] = useState(false);

    const handleCalculate = async () => {
        setLoading(true);
        await onCalculate(report.id);
        setLoading(false);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-12 h-12 text-amber-500" />
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                        <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Projeção de IA</h3>
                </div>
                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer"
                >
                    {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                    {report.projected_surplus ? "Recalcular" : "Calcular"}
                </button>
            </div>

            {report.projected_surplus ? (
                <div className="space-y-3">
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-amber-500 font-mono whitespace-nowrap">
                            {formatCurrency(report.projected_surplus)}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold mb-1 uppercase">Sobra Estimada</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-amber-500/30 pl-3 line-clamp-3 overflow-hidden">
                        "{report.projection_reason}"
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                        <Clock className="w-2.5 h-2.5 text-zinc-600" />
                        <p className="text-[9px] text-zinc-600 font-mono italic">
                            Atualizado em: {report.projection_date ? formatDate(report.projection_date) : '-'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="py-2">
                    <p className="text-xs text-zinc-500 mb-4 font-mono leading-tight">
                        Clique no botão acima para que a nossa inteligência artificial analise suas finanças e projete sua sobra real.
                    </p>
                </div>
            )}
        </div>
    );
}

function ReportView({
    report,
    reports,
    categories,
    sources,
    suppliers,
    cards,
    onBack,
    onAddTransaction,
    onEditTransaction,
    onEditReport,
    onDeleteTransaction,
    onDeleteReport,
    onCalculateProjection,
    onNavigate,
    config
}: ReportViewProps) {
    const { activeReportStats } = useFinancial();
    const timeToGoal = useTimeToGoal(report, config);
    const stats = activeReportStats;
    const [viewMode, setViewMode] = useState<"overview" | "transactions" | "expenses" | "discretionary">("overview");

    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterSource, setFilterSource] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string[]>([]);
    const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
    const [filterCard, setFilterCard] = useState<string[]>([]);
    const [filterMandatory, setFilterMandatory] = useState<string[]>([]);
    const [filterOccurrence, setFilterOccurrence] = useState<string[]>([]);
    const [filterStartDate, setFilterStartDate] = useState<string>("");
    const [filterEndDate, setFilterEndDate] = useState<string>("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterDuplicate, setFilterDuplicate] = useState<boolean>(false);

    const clearFilters = () => {
        setFilterType([]);
        setFilterSource([]);
        setFilterCategory([]);
        setFilterSupplier([]);
        setFilterCard([]);
        setFilterMandatory([]);
        setFilterOccurrence([]);
        setFilterStartDate("");
        setFilterEndDate("");
        setFilterDuplicate(false);
    };

    const availableCategories = useMemo(() => {
        const ids = new Set(report.transactions?.map((t: any) => t.category_id || (t.categories && t.categories[0])));
        return categories.filter(c => ids.has(c.id)).map(c => ({ value: c.id, label: c.name, icon: c.icon }));
    }, [report.transactions, categories]);

    const availableSources = useMemo(() => {
        const ids = new Set(report.transactions?.map((t: any) => t.source_id));
        return sources.filter(s => ids.has(s.id)).map(s => ({ value: s.id, label: s.name, icon: s.icon }));
    }, [report.transactions, sources]);

    const availableSuppliers = useMemo(() => {
        const ids = new Set(report.transactions?.map((t: any) => t.supplier_id));
        return suppliers.filter(s => ids.has(s.id)).map(s => ({ value: s.id, label: s.name }));
    }, [report.transactions, suppliers]);

    const availableCards = useMemo(() => {
        const ids = new Set(report.transactions?.map((t: any) => t.card_id));
        return cards.filter(c => ids.has(c.id)).map(c => ({ value: c.id, label: c.name }));
    }, [report.transactions, cards]);

    const potentialDuplicates = useMemo(() => {
        if (!reports) return new Set<string>();
        const counts: Record<string, string[]> = {};
        const duplicates = new Set<string>();

        reports.forEach(r => {
            if (!r.transactions) return;
            r.transactions.forEach(t => {
                if (t.type !== 'expense') return;
                const key = `${t.supplier_id || t.supplier_name || 'unknown'}-${t.value}-${t.report_id}`;
                if (!counts[key]) counts[key] = [];
                counts[key].push(t.id);
            });
        });

        Object.values(counts).forEach(ids => {
            if (ids.length > 1) {
                ids.forEach(id => duplicates.add(id));
            }
        });

        return duplicates;
    }, [reports]);

    const filteredTransactionsList = useMemo(() => {
        if (!report?.transactions) return [];
        return report.transactions.filter(t => {
            if (filterType.length > 0 && !filterType.includes(t.type)) return false;
            if (filterSource.length > 0 && !filterSource.includes(t.source_id)) return false;
            if (filterSupplier.length > 0 && !filterSupplier.includes(t.supplier_id)) return false;
            if (filterCard.length > 0 && !filterCard.includes(t.card_id)) return false;
            if (filterDuplicate && !potentialDuplicates.has(t.id)) return false;

            if (filterMandatory.length > 0) {
                const isMandatory = t.is_mandatory;
                const selected = filterMandatory;
                if (selected.includes('mandatory') && !selected.includes('discretionary') && !isMandatory) return false;
                if (selected.includes('discretionary') && !selected.includes('mandatory') && isMandatory) return false;
            }

            if (filterOccurrence.length > 0) {
                const isRecurring = t.is_recurring;
                const matches = (filterOccurrence.includes('recurring') && isRecurring) ||
                    (filterOccurrence.includes('occasional') && !isRecurring);
                if (!matches) return false;
            }

            let catId = t.category_id;
            if (!catId && (t as any).categories && (t as any).categories.length > 0) catId = (t as any).categories[0];
            if (filterCategory.length > 0 && !filterCategory.includes(catId)) return false;

            if (filterStartDate && t.date < filterStartDate) return false;
            if (filterEndDate && t.date > filterEndDate) return false;

            return true;
        });
    }, [report?.transactions, filterType, filterSource, filterCategory, filterSupplier, filterCard, filterMandatory, filterOccurrence, filterDuplicate, filterStartDate, filterEndDate, potentialDuplicates]);

    const dailyChartData = useMemo(() => {
        if (!report?.transactions || !report.start_date || !report.end_date) return [];

        let earliestDate = report.start_date;
        let latestDate = report.end_date;

        filteredTransactionsList.forEach(t => {
            if (t.date < earliestDate) earliestDate = t.date;
            if (t.date > latestDate) latestDate = t.date;
        });

        const startParts = earliestDate.split('-');
        const endParts = latestDate.split('-');
        if (startParts.length !== 3 || endParts.length !== 3) return [];

        const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
        const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));

        const data = [];
        const curr = new Date(start);

        let totalIncome = 0;
        let totalMandatory = 0;

        filteredTransactionsList.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.value;
            }
            if (t.type === 'expense' && t.is_mandatory) {
                totalMandatory += t.value;
            }
        });

        let accDiscretionary = 0;

        while (curr <= end) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const d = String(curr.getDate()).padStart(2, '0');
            const dayString = `${y}-${m}-${d}`;

            let expense = 0;
            let discretionary = 0;

            filteredTransactionsList.forEach(t => {
                if (t.date === dayString) {
                    if (t.type === 'expense') {
                        expense += t.value;
                        if (!t.is_mandatory) {
                            discretionary += t.value;
                        }
                    }
                }
            });

            accDiscretionary += discretionary;

            data.push({
                date: `${d}/${m}`,
                dayString,
                Despesas: discretionary,
                ReceitaTotal: totalIncome,
                ObrigatorioTotal: totalMandatory,
                AcumuladoDiscricionario: accDiscretionary,
                SobraReal: totalIncome - totalMandatory - accDiscretionary
            });

            curr.setDate(curr.getDate() + 1);
        }
        return data;
    }, [report, filteredTransactionsList]);

    const activeFilters = useMemo(() => {
        const filters = [];
        if (filterType.length > 0) filters.push({ id: 'type', type: 'Tipo', value: filterType.map(v => v === 'income' ? 'Receita' : 'Despesa').join(', '), clear: () => setFilterType([]) });
        if (filterSource.length > 0) filters.push({ id: 'source', type: 'Fonte', value: filterSource.map(id => sources.find(s => s.id === id)?.name || 'Desconhecida').join(', '), clear: () => setFilterSource([]) });
        if (filterCategory.length > 0) filters.push({ id: 'category', type: 'Categoria', value: filterCategory.map(id => categories.find(c => c.id === id)?.name || 'Desconhecida').join(', '), clear: () => setFilterCategory([]) });
        if (filterSupplier.length > 0) filters.push({ id: 'supplier', type: 'Fornecedor', value: filterSupplier.map(id => suppliers.find(s => s.id === id)?.name || 'Desconhecido').join(', '), clear: () => setFilterSupplier([]) });
        if (filterCard.length > 0) filters.push({ id: 'card', type: 'Cartão', value: filterCard.map(id => cards.find(c => c.id === id)?.name || 'Desconhecido').join(', '), clear: () => setFilterCard([]) });
        if (filterDuplicate) filters.push({ id: 'duplicate', type: 'Filtro', value: 'Risco de duplicidade', clear: () => setFilterDuplicate(false) });
        if (filterMandatory.length > 0) {
            const labels: Record<string, string> = {
                'mandatory': 'OBRIGATÓRIO',
                'discretionary': 'DISCRICIONÁRIO'
            };
            filters.push({ id: 'mandatory', type: 'Tipo Gasto', value: filterMandatory.map(v => labels[v]).join(', '), clear: () => setFilterMandatory([]) });
        }
        if (filterOccurrence.length > 0) {
            const labels: Record<string, string> = {
                'recurring': 'Recorrente',
                'occasional': 'Ocasional'
            };
            filters.push({ id: 'occurrence', type: 'Tipo Ocorrência', value: filterOccurrence.map(v => labels[v]).join(', '), clear: () => setFilterOccurrence([]) });
        }
        if (filterStartDate) filters.push({ id: 'filterStartDate', type: 'Início', value: filterStartDate, clear: () => setFilterStartDate("") });
        if (filterEndDate) filters.push({ id: 'filterEndDate', type: 'Fim', value: filterEndDate, clear: () => setFilterEndDate("") });
        return filters;
    }, [filterType, filterSource, filterCategory, filterSupplier, filterCard, filterMandatory, filterOccurrence, filterDuplicate, filterStartDate, filterEndDate, sources, categories, suppliers, cards]);

    const groupedTransactions = useMemo(() => {
        if (!report || !report.transactions) return {};
        const groups: Record<string, Transaction[]> = {};

        filteredTransactionsList.forEach(t => {
            const date = t.date;
            if (!groups[date]) groups[date] = [];
            groups[date].push(t);
        });
        return groups;
    }, [report?.transactions, filteredTransactionsList]);


    const { now, isTheFinalDate, start, end, daysLeft, progress, isInProgress, isNotStarted, metOkrMin, metOkrAmbitious, totalDays, daysPassed } = useMemo(() => {
        if (!report) return { now: new Date(), isTheFinalDate: false, start: new Date(), end: new Date(), daysLeft: 0, progress: 0, isInProgress: false, isNotStarted: false, metOkrMin: false, metOkrAmbitious: false, totalDays: 0, daysPassed: 0 };

        const startDate = getInitialDate(report.start_date);
        const endDate = getFinalDate(report.end_date);
        const now = getNow();

        const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const daysPassed = Math.min(totalDays, Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
        let daysRemaining = Math.ceil(Math.max(0, Math.min(totalDays - daysPassed, totalDays)));

        const percentage = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

        const isInProgress = now >= startDate && now <= endDate;
        const isNotStarted = now < startDate;

        const income = report.transactions?.filter(t => t.type === 'income').reduce((a, b) => a + b.value, 0) || 0;
        const expense = report.transactions?.filter(t => t.type === 'expense').reduce((a, b) => a + b.value, 0) || 0;
        const metOkrMin = (income - expense) >= report.okr_min;
        const metOkrAmbitious = (income - expense) >= report.okr_ambitious;

        const initialEndDate = getInitialDate(report.end_date + "T23:59:59");
        const isTheFinalDate = now.getTime() === initialEndDate.getTime();
        return {
            isTheFinalDate,
            now,
            start: startDate,
            end: endDate,
            daysLeft: daysRemaining,
            progress: percentage,
            isInProgress,
            isNotStarted,
            metOkrMin,
            metOkrAmbitious,
            totalDays,
            daysPassed
        };
    }, [report?.start_date, report?.end_date, report?.transactions, report?.okr_min, report?.okr_ambitious]);

    const { dailySpentValues, dailySpentMode } = useFinancial();

    const filteredStats = useMemo(() => {
        const ts = filteredTransactionsList;
        const allKnownIncome = ts.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
        const allKnownExpenses = ts.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);
        const allMandatoryExpense = ts.filter(t => t.type === 'expense' && t.is_mandatory).reduce((acc, t) => acc + Number(t.value), 0);

        const totalDiscretionary = allKnownExpenses - allMandatoryExpense;
        const currentDailyAvg = daysPassed > 0 ? totalDiscretionary / daysPassed : 0;

        let dailyBase = dailySpentValues.historical;
        if (dailySpentMode === 'current') dailyBase = currentDailyAvg;
        if (dailySpentMode === 'default') dailyBase = config?.daily_spent_estimate_default || 0;

        const projectedVariableExpense = daysLeft * dailyBase;
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
            daysRemaining: daysLeft
        };
    }, [filteredTransactionsList, daysPassed, daysLeft, dailySpentValues, dailySpentMode, config]);

    if (!report) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 h-full overflow-hidden"
        >
            {/* Header Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center justify-between shadow-lg shrink-0 z-20 relative">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer">
                        <Home className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onNavigate('prev')}
                            className="p-1 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 text-zinc-500" />
                        </button>
                        <div className="flex flex-col items-center gap-0.5">
                            <h2 className="text-lg font-bold tracking-tight">{MONTH_NAMES[report.month]} <span className="text-zinc-500 text-sm">{report.year}</span></h2>
                            <p className="text-[10px] text-zinc-500 font-mono">{formatDate(report.start_date)} - {formatDate(report.end_date)}</p>
                        </div>
                        <button
                            onClick={() => onNavigate('next')}
                            className="p-1 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>
                    </div>
                </div>
                <div className="flex gap-6">
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Patrimônio Inicial</p>
                        <p className="text-sm font-mono font-bold text-zinc-200">{formatCurrency(report.initial_patrimony)}</p>
                    </div>
                    <div className="text-right border-l border-zinc-800 pl-6">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Taxa de Juros</p>
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-mono font-bold text-blue-400">
                                {report.selic_tax}% <span className="text-[8px] text-zinc-600 font-normal uppercase tracking-tighter">a.a</span>
                            </p>
                            <p className="text-[10px] font-mono font-bold text-zinc-400">
                                {((Math.pow(1 + (report.selic_tax / 100), 1 / 12) - 1) * 100).toFixed(4)}% <span className="text-[8px] text-zinc-600 font-normal uppercase tracking-tighter">a.m</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={onEditReport}
                                className="p-2 border border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-all cursor-pointer"
                                title="Configurações do Relatório"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDeleteReport(report.id)}
                                className="p-2 border border-zinc-800 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                                title="Deletar Relatório"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onAddTransaction}
                                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs px-4 py-2 rounded-lg font-black uppercase tracking-tighter transition-all shadow-lg active:scale-95 cursor-pointer"
                            >
                                Nova transação
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center gap-2 pt-0 pb-0 z-10 shrink-0">
                {(['overview', 'transactions', 'expenses', 'discretionary'] as const).map((mode, idx) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`w-2 h-2 rounded-full transition-all ${viewMode === mode ? 'bg-emerald-500 w-4' : 'bg-zinc-700 hover:bg-zinc-500 cursor-pointer'}`}
                        title={mode === 'overview' ? 'Geral' : mode === 'transactions' ? 'Transações' : mode === 'expenses' ? 'Despesas' : 'Discricionários'}
                        aria-label={mode}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-h-0 flex flex-col"
                >
                    {viewMode === 'overview' ? (
                        <div className="flex-1 flex flex-col relative overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Stats Grid - Full Width */}
                                <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard title="Receita Atual" value={activeReportStats?.totalIncome || 0} color="text-emerald-400" extra={`v/ 100%`} />
                                    <StatCard
                                        title="Gastos Totais"
                                        value={activeReportStats?.totalExpense || 0}
                                        color="text-rose-400"
                                        secondaryStats={[
                                            {
                                                label: "Obrigatórios",
                                                value: activeReportStats?.mandatoryExpense || 0,
                                                tooltip: "Soma de todos os gastos marcados como obrigatórios"
                                            },
                                            {
                                                label: "Discricionários",
                                                value: (activeReportStats?.totalExpense || 0) - (activeReportStats?.mandatoryExpense || 0),
                                                tooltip: "Gastos não obrigatórios realizados até o momento"
                                            },
                                            {
                                                label: "Diário",
                                                value: activeReportStats?.currentDailyAvg || 0,
                                                tooltip: "Média diária de gastos não obrigatórios (até hoje)"
                                            }
                                        ]}
                                    />
                                    <StatCard
                                        title="Sobra projetada"
                                        value={activeReportStats?.expectedSurplus || 0}
                                        color="text-emerald-400"
                                        highlight
                                        gradient
                                        totalEstimated={activeReportStats?.expectedDiscretionaryFuture || 0}
                                        totalEstimatedTooltip="Estimativa de gastos não obrigatórios restantes até o fim do ciclo"
                                        miniValue={activeReportStats?.partialSurplus || 0}
                                        miniValueTooltip="Quanto sobrou de fato até o momento (Receita - Despesas realizadas)"
                                    />
                                </div>

                                {/* Row 2: Progress + OKRs */}
                                <div className="col-span-12 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Progress Card (Smaller) */}
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase">Progresso</p>
                                                <p className="text-[9px] text-zinc-500 font-medium">{daysPassed} / {totalDays} dias</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full max-w-[150px]">
                                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                        <span className="text-emerald-400 font-black text-sm">{Math.round(progress)}%</span>
                                    </div>

                                    {/* OKRs Card */}
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                <Target className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">OKRs</h3>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="text-[9px] flex justify-between text-zinc-400 font-bold uppercase"><span>Mín</span><span>Ambi</span></div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, (activeReportStats?.totalIncome - activeReportStats?.totalExpense - activeReportStats?.expectedDiscretionaryFuture) / report.okr_min * 100))}%` }} />
                                                </div>
                                                <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, (activeReportStats?.totalIncome - activeReportStats?.totalExpense - activeReportStats?.expectedDiscretionaryFuture) / report.okr_ambitious * 100))}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Wealth + End */}
                                <div className="col-span-12 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Meta de Patrimônio</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-emerald-500 font-mono">
                                                {formatCurrency(config?.goal_target_default || 1000000)}
                                            </span>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                                                Estimado: <span className="text-zinc-300">{timeToGoal ? `${timeToGoal.years}a ${timeToGoal.months}m` : "---"}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-zinc-500/10 rounded-lg">
                                                <Flag className="w-5 h-5 text-zinc-400" />
                                            </div>
                                            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Fim do Relatório</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-white font-mono">
                                                {formatCurrency(report.initial_patrimony + (activeReportStats?.expectedSurplus || 0))}
                                            </span>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Estimativa Final</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 4: AI Projection */}
                                <div className="col-span-12">
                                    <AIProjectionCard
                                        report={report}
                                        onCalculate={onCalculateProjection}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'discretionary' ? (
                        <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl min-h-0 relative">
                            <div className="px-6 pt-6 pb-2 bg-zinc-900 sticky top-0 z-10 rounded-t-xl">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4" style={{ justifyContent: 'space-between', width: '100%' }}>
                                        <h2 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
                                            <BarChart2 className="w-5 h-5 text-rose-400" />
                                            Gastos Discricionários
                                        </h2>
                                        <button onClick={() => setShowFilterModal(true)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 transition-all cursor-pointer">
                                            <Filter className="w-3 h-3" /> Filtrar {activeFilters.length > 0 && <span className="bg-emerald-500 text-emerald-950 px-1.5 py-0.5 rounded text-[10px]">{activeFilters.length}</span>}
                                        </button>
                                    </div>
                                </div>

                                {activeFilters.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {activeFilters.map(f => (
                                            <div key={f.id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 shadow-sm">
                                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest uppercase">{f.type}:</span>
                                                <span className="text-xs font-black text-zinc-200 capitalize uppercase">{f.value}</span>
                                                <button onClick={f.clear} className="text-zinc-500 hover:text-rose-400 transition-colors ml-1 p-0.5 rounded-full hover:bg-zinc-700/50 cursor-pointer">
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

                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-6 pt-0">
                                <div className="flex-1 min-h-[400px] w-full flex flex-col">
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#52525b"
                                                    fontSize={10}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    stroke="#52525b"
                                                    fontSize={10}
                                                    tickFormatter={(value) => `R$${value}`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#27272a' }}
                                                    content={({ active, payload, label }: any) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs w-[240px]">
                                                                    <p className="font-bold text-zinc-300 mb-2 border-b border-zinc-800 pb-2">{label}</p>

                                                                    <div className="space-y-1 mb-3">
                                                                        <p className="flex justify-between items-center text-[10px]">
                                                                            <span className="text-zinc-400">Gastos Discricionários (dia):</span>
                                                                            <span className="text-rose-400 font-bold">{formatCurrency(data.Despesas)}</span>
                                                                        </p>
                                                                    </div>

                                                                    <div className="space-y-1 pt-2 border-t border-zinc-800">
                                                                        <p className="flex justify-between items-center tracking-tight">
                                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Receita Total:</span>
                                                                            <span className="text-emerald-500 font-mono text-[10px]">{formatCurrency(data.ReceitaTotal)}</span>
                                                                        </p>
                                                                        <p className="flex justify-between items-center tracking-tight">
                                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Despesas (Obrigatórias):</span>
                                                                            <span className="text-rose-500 font-mono text-[10px]">{formatCurrency(data.ObrigatorioTotal)}</span>
                                                                        </p>
                                                                        <p className="flex justify-between items-center tracking-tight mt-1 pt-1 border-t border-zinc-800/50">
                                                                            <span className="text-[10px] text-zinc-300 font-bold uppercase">Balanço Real:</span>
                                                                            <span className={`font-mono font-bold text-[10px] ${data.SobraReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                {formatCurrency(data.SobraReal)}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Despesas Discricionárias" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'expenses' ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbarbg-zinc-900 border border-zinc-800 rounded-xl">
                            <ExpensesView
                                transactions={report.transactions || []}
                                categories={categories}
                                sources={sources}
                                suppliers={suppliers}
                                cards={cards}
                                month={report.month}
                                year={report.year}
                                onBack={() => setViewMode('overview')}
                                filterCategory={filterCategory}
                                setFilterCategory={setFilterCategory}
                                filterSource={filterSource}
                                setFilterSource={setFilterSource}
                                filterSupplier={filterSupplier}
                                setFilterSupplier={setFilterSupplier}
                                filterCard={filterCard}
                                setFilterCard={setFilterCard}
                                filterMandatory={filterMandatory}
                                setFilterMandatory={setFilterMandatory}
                                startDate={filterStartDate}
                                setStartDate={setFilterStartDate}
                                endDate={filterEndDate}
                                setEndDate={setFilterEndDate}
                                filterOccurrence={filterOccurrence}
                                setFilterOccurrence={setFilterOccurrence}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl min-h-0 relative">
                            <div className="px-6 pt-6 pb-2 bg-zinc-900 sticky top-0 z-10 rounded-t-xl">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4" style={{ justifyContent: 'space-between', width: '100%' }}>
                                        <h2 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
                                            <ListFilter className="w-5 h-5 text-zinc-500" />
                                            Histórico de Transações
                                        </h2>
                                        <div className="bg-zinc-800 border border-zinc-700 p-2 rounded-xl shadow-lg flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Receitas</p>
                                                <p className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(filteredStats.totalIncome)}</p>
                                            </div>
                                            <div className="w-px h-4 bg-zinc-700"></div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Despesas</p>
                                                <p className="text-sm font-mono font-bold text-rose-400">{formatCurrency(filteredStats.totalExpense)}</p>
                                            </div>
                                            <div className="w-px h-4 bg-zinc-700"></div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[9px] text-zinc-400 uppercase font-bold">Saldo</p>
                                                <p className={`text-sm font-mono font-bold ${filteredStats.totalIncome - filteredStats.totalExpense >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(filteredStats.totalIncome - filteredStats.totalExpense)}</p>
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

                            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-24">
                                <div className="space-y-4">
                                    {(Object.entries(groupedTransactions) as [string, Transaction[]][]).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => (
                                        <div key={date} className="space-y-2">
                                            <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-md py-2 px-3 border border-zinc-800/50 rounded-lg z-10 mx-2">
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{formatDate(date)}</p>
                                            </div>
                                            <div className="space-y-2 pl-4 pr-2">
                                                {items.map((t: Transaction) => (
                                                    <TransactionItem
                                                        key={t.id}
                                                        t={t}
                                                        onDelete={onDeleteTransaction}
                                                        onClick={() => onEditTransaction(t)}
                                                        categories={categories}
                                                        sources={sources}
                                                        isDuplicate={potentialDuplicates.has(t.id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(groupedTransactions).length === 0 && (
                                        <EmptyState
                                            title="Nenhuma transação encontrada"
                                            description="Não encontramos transações que correspondam aos filtros aplicados para este período."
                                            onClearFilters={clearFilters}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {showFilterModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowFilterModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10"
                        >
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                                title="Fechar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-black tracking-tighter uppercase text-white mb-6">Filtros de Transações</h3>

                            <div className="space-y-4">
                                <CustomSelect
                                    label="Tipo de Transação"
                                    multiple
                                    value={filterType}
                                    onChange={setFilterType}
                                    options={[{ value: 'expense', label: 'Despesa', icon: 'ArrowDownCircle' }, { value: 'income', label: 'Receita', icon: 'ArrowUpCircle' }]}
                                />
                                <CustomSelect
                                    label="Fonte"
                                    multiple
                                    value={filterSource}
                                    onChange={setFilterSource}
                                    options={availableSources}
                                />
                                <CustomSelect
                                    label="Categoria"
                                    multiple
                                    value={filterCategory}
                                    onChange={setFilterCategory}
                                    options={availableCategories}
                                />
                                <CustomSelect
                                    label="Fornecedor"
                                    multiple
                                    value={filterSupplier}
                                    onChange={setFilterSupplier}
                                    options={availableSuppliers}
                                />
                                <CustomSelect
                                    label="Cartão"
                                    multiple
                                    value={filterCard}
                                    onChange={setFilterCard}
                                    options={availableCards}
                                />
                                <CustomSelect
                                    label="Tipo de Gasto"
                                    multiple
                                    value={filterMandatory}
                                    onChange={setFilterMandatory}
                                    options={[
                                        { value: 'mandatory', label: 'OBRIGATÓRIO', icon: 'AlertCircle' },
                                        { value: 'discretionary', label: 'DISCRICIONÁRIO', icon: 'Coffee' }
                                    ]}
                                />
                                <CustomSelect
                                    label="Ocorrência"
                                    multiple
                                    value={filterOccurrence}
                                    onChange={setFilterOccurrence}
                                    options={[
                                        { value: 'occasional', label: 'Ocasional', icon: 'Calendar' },
                                        { value: 'recurring', label: 'Recorrente', icon: 'Repeat' }
                                    ]}
                                />
                                <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700 cursor-pointer" onClick={() => setFilterDuplicate(!filterDuplicate)}>
                                    <input type="checkbox" checked={filterDuplicate} readOnly className="accent-emerald-500" />
                                    <span className="text-xs font-bold text-zinc-300">Apenas Risco de Duplicidade</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Data Início</label>
                                    <input
                                        type="date"
                                        value={filterStartDate}
                                        onChange={e => setFilterStartDate(e.target.value)}
                                        className="bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pl-1">Data Fim</label>
                                    <input
                                        type="date"
                                        value={filterEndDate}
                                        onChange={e => setFilterEndDate(e.target.value)}
                                        className="bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors uppercase tracking-tight"
                                >
                                    Limpar Todos
                                </button>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-black rounded-lg transition-colors shadow-lg active:scale-95 uppercase tracking-tight"
                                >
                                    Pronto
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}

// --- Projection Section ---
function ProjectionSection({
    report,
    projectionData,
    months,
    setMonths,
    scenarioKey,
    setScenarioKey
}: {
    report: Report;
    projectionData: any[];
    months: number;
    setMonths: (m: number) => void;
    scenarioKey: number;
    setScenarioKey: (v: any) => void;
}) {
    const off = useMemo(() => {
        const dataMax = Math.max(...projectionData.map((i) => i.patrimony));
        const dataMin = Math.min(...projectionData.map((i) => i.patrimony));

        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;

        return dataMax / (dataMax - dataMin);
    }, [projectionData]);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">Projeção de Patrimônio ({months} meses)</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Base Selic: {report.selic_tax}% ± 0.75%</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CustomSelect
                        value={months}
                        onChange={(val) => setMonths(Number(val))}
                        options={[
                            { value: 3, label: '3M' },
                            { value: 6, label: '6M' },
                            { value: 12, label: '1Y' },
                        ]}
                        className="w-20"
                        buttonClassName="px-3 h-[26px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700 uppercase tracking-tighter pr-6 flex items-center justify-between"
                    />
                    <button
                        onClick={() => setScenarioKey((prev: number) => prev + 1)}
                        className="px-3 h-[26px] w-20 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700 uppercase tracking-tighter flex items-center justify-center"
                    >
                        Resortear
                    </button>
                </div>
            </div>

            <div key={scenarioKey} className="flex-1 bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <defs>
                            <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={off} stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset={off} stopColor="#f43f5e" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="month" stroke="#3f3f46" fontSize={8} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-zinc-900 p-3 border border-zinc-800 rounded shadow-2xl opacity-95">
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{d.month}</p>
                                            <p className="text-sm font-bold text-white">{formatCurrency(d.patrimony)}</p>
                                            <div className="mt-1 space-y-0.5">
                                                <p className="text-[9px] text-zinc-400">Juros: <span className="text-emerald-500">{formatCurrency(d.interest)}</span></p>
                                                <p className="text-[9px] text-zinc-400">Taxa: <span className="text-blue-400">{d.selic}%</span></p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="patrimony"
                            stroke="#64748b"
                            strokeWidth={2}
                            fill="url(#projGradient)"
                            dot={({ cx, cy, payload }) => (
                                <circle
                                    key={payload.month}
                                    cx={cx}
                                    cy={cy}
                                    r={3}
                                    fill={payload.patrimony >= 0 ? "#10b981" : "#f43f5e"}
                                />
                            )}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// --- Components ---

function SidebarItem({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
        >
            <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-200'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{label}</span>
        </button>
    );
}

function StatCard({
    title,
    value,
    color,
    extra,
    split,
    highlight,
    gradient,
    secondaryStats,
    totalEstimated,
    totalEstimatedTooltip,
    miniLabel = "Atual",
    miniValue,
    miniValueTooltip
}: any) {
    return (
        <div className={`bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg relative min-h-[100px] flex flex-col justify-between transition-all duration-500 ${gradient ? 'bg-gradient-to-br from-zinc-900 to-zinc-800' : ''}`}>
            <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h2 className={`text-xl font-black tracking-tighter ${color || 'text-white'}`}>{formatCurrency(value)}</h2>
                    {extra && <span className="text-[10px] text-zinc-600 font-bold">{extra}</span>}
                </div>
            </div>

            <div className="mt-2">
                {secondaryStats ? (
                    <div className="flex flex-wrap gap-1.5">
                        {secondaryStats.map((s: any, idx: number) => (
                            <div key={idx} className="relative group/tooltip">
                                <span className="text-[8px] bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-tight whitespace-nowrap cursor-help">
                                    {s.label}: {formatCurrency(s.value)}
                                </span>
                                {s.tooltip && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-[8px] text-zinc-300 rounded border border-zinc-700 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[999] whitespace-nowrap shadow-xl">
                                        {s.tooltip}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : totalEstimated !== undefined ? (
                    <div className="flex gap-2 items-center">
                        <div className="relative group/tooltip">
                            <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-tight whitespace-nowrap cursor-help">
                                {miniLabel}: {formatCurrency(miniValue !== undefined ? miniValue : value)}
                            </span>
                            {miniValueTooltip && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-[8px] text-zinc-300 rounded border border-zinc-700 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[999] whitespace-nowrap shadow-xl">
                                    {miniValueTooltip}
                                </div>
                            )}
                        </div>

                        <div className="relative group/tooltip">
                            <span className="text-[9px] bg-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-400 font-bold uppercase tracking-tight whitespace-nowrap cursor-help">
                                Est: {formatCurrency(totalEstimated)}
                            </span>
                            {totalEstimatedTooltip && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-[8px] text-zinc-300 rounded border border-zinc-700 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[999] whitespace-nowrap shadow-xl">
                                    {totalEstimatedTooltip}
                                </div>
                            )}
                        </div>
                    </div>
                ) : split ? (
                    <div className="flex gap-2">
                        <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-tight">{split}</span>
                    </div>
                ) : (
                    <p className="text-[10px] text-zinc-500 font-bold uppercase opacity-50">Consolidado</p>
                )}
            </div>

            {highlight && <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/20"></div>}
        </div>
    );
}

function ProgressBar({ name, current, target, color }: { name: string; current: number; target: number; color: string }) {
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    return (
        <div className="w-full">
            <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1.5 tracking-tight">{name} ({formatCurrency(target)})</p>
            <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color}`}
                />
            </div>
            <p className="text-[10px] text-zinc-300 mt-1.5 font-mono">{percentage.toFixed(0)}% completo</p>
        </div>
    );
}

interface TransactionItemProps {
    t: Transaction;
    onDelete: (id: string) => void;
    onClick: () => void;
    categories: Category[];
    sources: Source[];
    isDuplicate?: boolean;
    key?: string;
}

function TransactionItem({ t, onDelete, onClick, categories, sources, isDuplicate }: TransactionItemProps) {
    let catId = t.category_id;
    if (!catId && (t as any).categories && (t as any).categories.length > 0) catId = (t as any).categories[0];
    const cat = categories.find(c => c.id === catId);
    const catNames = cat ? cat.name : "";
    const firstCatIcon = cat?.icon;
    const source = sources.find(s => s.id === t.source_id);

    return (
        <div
            onClick={onClick}
            className={`group flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg cursor-pointer transition-all border-l-2 ${isDuplicate ? 'border-l-amber-500 bg-amber-500/5' : t.is_mandatory ? 'border-l-indigo-500/50 bg-indigo-500/5' : 'border-l-transparent hover:border-zinc-700/50'}`}
        >
            <div className={`w-8 h-8 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                <Icon name={t.supplier_logo || firstCatIcon || source?.icon || "Package"} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-[11px] font-black tracking-tight text-white uppercase truncate">{t.supplier_name || catNames || "Geral"}</p>
                    {!!t.is_mandatory && !t.is_recurring && (
                        <div className="px-1 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[6px] font-black tracking-widest leading-none">
                            OBRIGATÓRIO
                        </div>
                    )}
                    {t.type === 'expense' && !t.is_mandatory && (
                        <div className="px-1 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[6px] font-black tracking-widest leading-none">
                            DISCRICIONÁRIO
                        </div>
                    )}
                    {!!t.is_mandatory && !!t.is_recurring && (
                        <div className="px-1 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[6px] font-black tracking-widest leading-none">
                            {(t.remaining_recurrence !== null && (t.remaining_recurrence ?? 0) > 0) ? `FIXO (${t.remaining_recurrence})` : 'FIXO'}
                        </div>
                    )}
                    {!!t.is_recurring && t.type === 'expense' && !(!!t.is_mandatory && !!t.is_recurring) && (
                        <div className="px-1 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-[6px] font-black tracking-widest leading-none">
                            {(t.remaining_recurrence !== null && (t.remaining_recurrence ?? 0) > 0) ? `RECORRENTE (${t.remaining_recurrence})` : 'RECORRENTE'}
                        </div>
                    )}
                    {!t.is_recurring && t.type === 'expense' && (
                        <div className="px-1 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[6px] font-black tracking-widest leading-none">
                            OCASIONAL
                        </div>
                    )}

                    {isDuplicate && (
                        <div className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[6px] font-black tracking-widest leading-none" title="Possível transação duplicada (mesmo valor e fornecedor)">
                            <AlertTriangle className="w-2 h-2" />
                            DUP
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 flex items-center gap-1">
                        {t.card_logo ? (
                            <img src={t.card_logo} className="w-2.5 h-2.5 rounded-[2px]" alt="Card" />
                        ) : (
                            <Icon name={source?.icon || "Wallet"} className="w-2 h-2 text-zinc-500" />
                        )}
                        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{t.card_name || source?.name}</span>
                    </div>
                    {t.supplier_name && (
                        <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tight truncate max-w-[120px]">{catNames}</span>
                    )}
                </div>
            </div>
            <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                    <p className={`text-xs font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-400' : 'text-zinc-100'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.value).replace('R$', '').trim()}
                    </p>
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest leading-none mt-0.5">{formatDate(t.date).split('/')[0]}/{formatDate(t.date).split('/')[1]}</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-all"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// --- Modals ---

function AddReportModal({ reports, config, onClose, onSubmit, initialMonth, initialYear }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        month: initialMonth !== undefined ? initialMonth : new Date().getMonth(),
        year: initialYear !== undefined ? initialYear : new Date().getFullYear(),
        initial_patrimony: 0,
        okr_min: config?.okr_min_default || 3000,
        okr_ambitious: config?.okr_ambitious_default || 5000,
        daily_spent_default: config?.daily_spent_estimate_default || 100,
        selic_tax: 10.75,
        start_date: "",
        end_date: ""
    });

    useEffect(() => {
        // Default dates based on cycle day
        const cycleDay = config?.cycle_day_default || 25;
        const currentMonth = formData.month;
        const currentYear = formData.year;

        // Period is "Month-1 CycleDay" to "Month CycleDay"
        const start = new Date(currentYear, currentMonth - 1, cycleDay);
        const end = new Date(currentYear, currentMonth, cycleDay);

        setFormData(prev => ({
            ...prev,
            start_date: start.toISOString().split("T")[0],
            end_date: end.toISOString().split("T")[0]
        }));
    }, [formData.month, formData.year, config]);

    const canCreate = useMemo(() => {
        if (reports.length === 0) return true;
        const lastReport = reports[0];
        const lastEnd = new Date(lastReport.end_date);
        const now = getNow();
        return now.getTime() >= lastEnd.getTime();
    }, [reports]);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (!isSubmitting && e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#121212] border border-zinc-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6 relative"
            >
                {isSubmitting && <div className="absolute inset-0 bg-black/10 z-[60] rounded-3xl cursor-wait" />}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Novo Relatório Mensal</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-30"
                    >
                        <X />
                    </button>
                </div>

                {!canCreate && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 text-xs font-bold flex items-start gap-3">
                        <RefreshCcw className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>AVISO: Você está iniciando um relatório antes do fim do período do último relatório. Verifique as datas.</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                        <CustomSelect
                            label="Mês Referência"
                            disabled={isSubmitting}
                            value={formData.month}
                            onChange={val => setFormData({ ...formData, month: Number(val) })}
                            options={MONTH_NAMES.map((name, i) => ({ value: i, label: name }))}
                            buttonClassName="bg-[#18181b] border border-zinc-800 py-3 pl-3 pr-10 text-left min-h-[46px] text-zinc-200 sm:text-xs font-bold hover:bg-zinc-800/80"
                            disableClear
                        />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Ano Referência</label>
                        <input
                            type="number"
                            disabled={isSubmitting}
                            value={formData.year}
                            onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none disabled:opacity-50 h-[46px]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Início do Ciclo</label>
                        <input
                            type="date"
                            disabled={isSubmitting}
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Fim do Ciclo</label>
                        <input
                            type="date"
                            disabled={isSubmitting}
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <MoneyInput
                        label="Patrimônio Inicial"
                        disabled={isSubmitting}
                        value={formData.initial_patrimony}
                        onChange={(val: number) => setFormData({ ...formData, initial_patrimony: val })}
                    />
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Taxa Selic (%)</label>
                        <input
                            type="number" step="0.25"
                            disabled={isSubmitting}
                            value={formData.selic_tax}
                            onChange={e => setFormData({ ...formData, selic_tax: Number(e.target.value) })}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none disabled:opacity-50 h-[46px]"
                        />
                    </div>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="space-y-1 pt-1">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Automação Ativa</p>
                        <p className="text-[11px] text-zinc-400 font-bold leading-tight">Serão criados transações automáticas conforme configurado nas definições gerais.</p>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? "Processando..." : "Criar Relatório"}
                </button>
            </motion.div>
        </div>
    );
}

function TransactionModal({ categories, sources, suppliers, cards, report, transaction, preSelectedCategories = [], onClose, onSubmit }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        type: transaction?.type || "expense",
        value: transaction?.value || 0,
        source_id: transaction?.source_id || null,
        supplier_id: transaction?.supplier_id || null,
        card_id: transaction?.card_id || null,
        category_id: transaction?.category_id || (transaction?.categories?.length > 0 ? transaction.categories[0] : (preSelectedCategories.length > 0 ? preSelectedCategories[0] : null)),
        date: transaction?.date || new Date().toISOString().split("T")[0],
        is_mandatory: transaction?.is_mandatory || false,
        is_recurring: transaction ? !!transaction.is_recurring : false,
        remaining_recurrence: transaction?.remaining_recurrence || "",
    });

    const isCardSource = sources.find((s: any) => s.id === formData.source_id)?.name === "CARTÃO";
    const isFormValid = formData.type && formData.source_id && formData.supplier_id && formData.category_id && formData.value > 0 && (isCardSource ? !!formData.card_id : true);

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find((s: any) => s.id === supplierId);
        if (supplier) {
            let catId = formData.type === 'expense' ? supplier.expense_category_id : supplier.income_category_id;

            // Fallback
            if (!catId) {
                const defaultCatName = formData.type === 'expense' ? 'OUTRAS DESPESAS' : 'OUTRAS RECEITAS';
                const defaultCat = categories.find((c: any) => c.name === defaultCatName && c.type === formData.type);
                catId = defaultCat?.id;
            }

            setFormData(prev => ({
                ...prev,
                supplier_id: supplierId,
                category_id: catId || null
            }));
        } else {
            setFormData(prev => ({ ...prev, supplier_id: supplierId }));
        }
    };

    useEffect(() => {
        if (!transaction && report) {
            const now = new Date().toISOString().split("T")[0];
            if (now >= report.start_date && now <= report.end_date) {
                setFormData(f => ({ ...f, date: now }));
            } else {
                setFormData(f => ({ ...f, date: report.start_date }));
            }
        }
    }, [transaction, report]);

    const handleSubmit = async () => {
        if (!formData.supplier_id) {
            setError("Por favor, selecione um fornecedor.");
            return;
        }
        if (!formData.category_id) {
            setError("Por favor, selecione uma categoria.");
            return;
        }
        setError(null);
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit({ ...formData, categories: [formData.category_id] });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter((c: Category) => c.type === formData.type);
    const filteredSuppliers = suppliers;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (!isSubmitting && e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#121212] border border-zinc-800 w-full max-w-md min-h-[600px] rounded-3xl p-8 shadow-2xl flex flex-col relative"
            >
                {isSubmitting && <div className="absolute inset-0 bg-black/10 z-[60] rounded-3xl cursor-wait" />}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold uppercase italic tracking-tighter">{transaction ? "Editar Transação" : "Lançar Transação"}</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-30"
                    >
                        <X />
                    </button>
                </div>

                <div className="flex bg-[#18181b] p-1 rounded-2xl border border-zinc-800 mb-6 font-sans">
                    <button
                        disabled={isSubmitting || !!transaction}
                        onClick={() => setFormData({ ...formData, type: 'expense', supplier_id: null, categories: [] })}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${formData.type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'} disabled:opacity-50`}
                    >
                        Despesa
                    </button>
                    <button
                        disabled={isSubmitting || !!transaction}
                        onClick={() => setFormData({ ...formData, type: 'income', supplier_id: null, categories: [] })}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'} disabled:opacity-50`}
                    >
                        Receita
                    </button>
                </div>

                <div className="flex-1 space-y-5 custom-scrollbar overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5 block">Data</label>
                            <input
                                type="date"
                                disabled={isSubmitting}
                                value={formData.date}
                                min={report?.start_date}
                                max={report?.end_date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 h-[38px] focus:outline-none text-zinc-200 disabled:opacity-50 text-xs font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <CustomSelect
                                label="Fonte"
                                disabled={isSubmitting}
                                value={formData.source_id}
                                onChange={val => setFormData({ ...formData, source_id: val })}
                                options={sources.map((s: Source) => ({ value: s.id, label: s.name, icon: s.icon }))}
                            />
                        </div>
                    </div>
                    {isCardSource && (
                        <div className="space-y-1.5 pt-1">
                            <CustomSelect
                                label="Cartão"
                                disabled={isSubmitting}
                                value={formData.card_id}
                                onChange={val => setFormData({ ...formData, card_id: val })}
                                options={cards.map((c: any) => ({ value: c.id, label: c.name, logo: c.logo }))}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <CustomSelect
                            label="Fornecedor"
                            disabled={isSubmitting}
                            value={formData.supplier_id}
                            onChange={handleSupplierChange}
                            options={filteredSuppliers.map((s: any) => ({
                                value: s.id,
                                label: s.name,
                                icon: s.logo || 'Package'
                            }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <CustomSelect
                            label="Categoria"
                            disabled={isSubmitting || !formData.supplier_id}
                            value={formData.category_id}
                            onChange={val => setFormData({ ...formData, category_id: val })}
                            options={filteredCategories.map((c: Category) => ({
                                value: c.id,
                                label: c.name,
                                icon: c.icon
                            }))}
                        />
                    </div>

                    {formData.type === 'expense' && (
                        <div className="space-y-4">
                            <CustomSelect
                                label="Tipo de Despesa"
                                disabled={isSubmitting}
                                value={formData.is_mandatory ? 'mandatory' : 'discretionary'}
                                onChange={val => setFormData({
                                    ...formData,
                                    is_mandatory: val === 'mandatory'
                                })}
                                options={[
                                    { value: 'mandatory', label: 'OBRIGATÓRIO' },
                                    { value: 'discretionary', label: 'DISCRICIONÁRIO' }
                                ]}
                            />

                            <CustomSelect
                                label="Tipo de Ocorrência"
                                disabled={isSubmitting}
                                value={formData.is_recurring ? 'recurring' : 'occasional'}
                                onChange={val => setFormData({
                                    ...formData,
                                    is_recurring: val === 'recurring',
                                    remaining_recurrence: val === 'recurring' ? formData.remaining_recurrence : ""
                                })}
                                options={[
                                    { value: 'occasional', label: 'OCASIONAL' },
                                    { value: 'recurring', label: 'RECORRENTE' }
                                ]}
                            />

                            {formData.is_recurring && (
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block pl-1 text-center">Ocorrências Restantes</label>
                                    <input
                                        type="number"
                                        value={formData.remaining_recurrence}
                                        onChange={e => setFormData({ ...formData, remaining_recurrence: e.target.value })}
                                        placeholder="Indefinido"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-center text-white placeholder-zinc-700 outline-none focus:border-zinc-500 transition-colors"
                                    />
                                    <p className="text-[10px] text-zinc-600 pl-1 text-center mt-1">Deixe vazio se for indefinido</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center block mb-1.5">Valor</label>
                        <div className="relative">
                            <input
                                type="text"
                                disabled={isSubmitting}
                                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(formData.value)}
                                onChange={e => {
                                    const rawValue = e.target.value.replace(/\D/g, "");
                                    const numericValue = Number(rawValue) / 100;
                                    setFormData({ ...formData, value: numericValue });
                                }}
                                className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl px-6 py-5 focus:outline-none font-black text-3xl text-center text-emerald-500 disabled:opacity-50 shadow-xl"
                                autoFocus={!transaction}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-red-500 text-[10px] font-bold text-center mt-2 uppercase tracking-widest">{error}</p>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isFormValid}
                    className={`w-full font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg active:scale-95 mt-6 border ${formData.type === 'income'
                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-emerald-900/20'
                        : 'bg-red-600 hover:bg-red-500 border-red-500/50 shadow-red-900/20'
                        } text-white disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                >
                    {isSubmitting ? "Processando..." : (transaction ? "Confirmar Edição" : "Confirmar Transação")}
                </button>
            </motion.div>
        </div>
    );
}

function ConfigModal({ config, categories, sources, onClose, onSave }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localConfig, setLocalConfig] = useState(config);

    const handleSave = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(localConfig)
            });
            onSave();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (!isSubmitting && e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#121212] border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative"
            >
                {isSubmitting && <div className="absolute inset-0 bg-black/10 z-[60] rounded-[32px] cursor-wait" />}
                <div className="flex items-center justify-between p-8 pb-4 shrink-0">
                    <h2 className="text-2xl font-bold">Configurações Gerais</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-30"
                    >
                        <X />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 custom-scrollbar">
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest border-bottom border-emerald-500/20 pb-2">Parâmetros do Ciclo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MoneyInput
                                label="OKR Mínimo"
                                disabled={isSubmitting}
                                value={localConfig.okr_min_default}
                                onChange={(val: number) => setLocalConfig({ ...localConfig, okr_min_default: val })}
                            />
                            <MoneyInput
                                label="OKR Ambicioso"
                                disabled={isSubmitting}
                                value={localConfig.okr_ambitious_default}
                                onChange={(val: number) => setLocalConfig({ ...localConfig, okr_ambitious_default: val })}
                            />
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Dia Ciclo Padrão</label>
                                <input
                                    type="number"
                                    disabled={isSubmitting}
                                    value={localConfig.cycle_day_default}
                                    onChange={e => setLocalConfig({ ...localConfig, cycle_day_default: Number(e.target.value) })}
                                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                                />
                            </div>
                            <MoneyInput
                                label="Gasto Diário Planejado (Meta)"
                                disabled={isSubmitting}
                                value={localConfig.daily_spent_estimate_default}
                                onChange={(val: number) => setLocalConfig({ ...localConfig, daily_spent_estimate_default: val })}
                            />
                            <MoneyInput
                                className="md:col-span-2"
                                label="Meta de Patrimônio Final"
                                disabled={isSubmitting}
                                value={localConfig.goal_target_default}
                                onChange={(val: number) => setLocalConfig({ ...localConfig, goal_target_default: val })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-zinc-800/50 group">
                        <div className="flex items-center justify-between px-1">
                            <div className="space-y-0.5">
                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Receitas Padrão</h3>
                                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Transações automáticas para novos ciclos</p>
                            </div>
                            <button
                                disabled={isSubmitting}
                                onClick={() => {
                                    const newIncome = { name: "Nova Receita", value: 0, source_id: sources[0]?.id || "", category_id: categories.find((c: any) => c.type === 'income')?.id || "" };
                                    setLocalConfig({ ...localConfig, default_incomes: [...localConfig.default_incomes, newIncome] });
                                }}
                                className="group flex items-center gap-2 p-1.5 px-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-full transition-all active:scale-95 disabled:opacity-50"
                            >
                                <PlusCircle className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Adicionar</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                            {localConfig.default_incomes.map((income: any, idx: number) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={idx}
                                    className="relative group bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/50 p-4 rounded-2xl transition-all"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                                                <Icon name={sources.find((s: any) => s.id === income.source_id)?.icon || "Wallet"} className="w-3.5 h-3.5 text-emerald-500/50" />
                                            </div>
                                            <input
                                                disabled={isSubmitting}
                                                className="flex-1 bg-transparent text-sm font-bold text-zinc-100 focus:outline-none placeholder:text-zinc-700 disabled:opacity-50"
                                                placeholder="Nome da Receita"
                                                value={income.name}
                                                onChange={e => {
                                                    const updated = [...localConfig.default_incomes];
                                                    updated[idx].name = e.target.value;
                                                    setLocalConfig({ ...localConfig, default_incomes: updated });
                                                }}
                                            />
                                            <button
                                                disabled={isSubmitting}
                                                onClick={() => {
                                                    const updated = localConfig.default_incomes.filter((_: any, i: number) => i !== idx);
                                                    setLocalConfig({ ...localConfig, default_incomes: updated });
                                                }}
                                                className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <MoneyInput
                                            disabled={isSubmitting}
                                            value={income.value}
                                            onChange={(val: number) => {
                                                const updated = [...localConfig.default_incomes];
                                                updated[idx].value = val;
                                                setLocalConfig({ ...localConfig, default_incomes: updated });
                                            }}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <CustomSelect
                                                disabled={isSubmitting}
                                                value={income.source_id}
                                                buttonClassName="bg-[#18181b] border border-zinc-800 py-3 pl-3 pr-10 text-left min-h-[46px] text-zinc-200 sm:text-xs font-bold hover:bg-zinc-800/80 rounded-xl"
                                                onChange={val => {
                                                    const updated = [...localConfig.default_incomes];
                                                    updated[idx].source_id = val;
                                                    setLocalConfig({ ...localConfig, default_incomes: updated });
                                                }}
                                                options={sources.map((s: any) => ({ value: s.id, label: s.name, icon: s.icon }))}
                                            />
                                            <CustomSelect
                                                disabled={isSubmitting}
                                                value={income.category_id}
                                                buttonClassName="bg-[#18181b] border border-zinc-800 py-3 pl-3 pr-10 text-left min-h-[46px] text-zinc-200 sm:text-xs font-bold hover:bg-zinc-800/80 rounded-xl"
                                                onChange={val => {
                                                    const updated = [...localConfig.default_incomes];
                                                    updated[idx].category_id = val;
                                                    setLocalConfig({ ...localConfig, default_incomes: updated });
                                                }}
                                                options={categories.filter((c: any) => c.type === 'income').map((c: any) => ({ value: c.id, label: c.name, icon: c.icon }))}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {localConfig.default_incomes.length === 0 && (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-[32px] bg-zinc-900/10">
                                    <PlusCircle className="w-8 h-8 text-zinc-800 mb-2" />
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Nenhuma receita padrão configurada</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-4 shrink-0 border-t border-zinc-800/50">
                    <button
                        disabled={isSubmitting}
                        onClick={handleSave}
                        className="w-full bg-emerald-600 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-[10px] py-5 rounded-[24px] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function EditReportModal({ report, onClose, onSubmit }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: report?.name || "",
        start_date: report?.start_date || "",
        end_date: report?.end_date || "",
        selic_tax: report?.selic_tax || 10.75,
        initial_patrimony: report?.initial_patrimony || 0,
        okr_min: report?.okr_min || 0,
        okr_ambitious: report?.okr_ambitious || 0,
    });
    const [error, setError] = useState<string | null>(null);

    const handleApply = async () => {
        if (isSubmitting) return;

        // Check if new period excludes any existing transaction
        if (report.transactions) {
            const outOfRange = report.transactions.some((t: any) => t.date < formData.start_date || t.date > formData.end_date);
            if (outOfRange) {
                setError("Existem transações fora do novo período selecionado. Ajuste as transações primeiro.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!report) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (!isSubmitting && e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#121212] border border-zinc-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6 relative"
            >
                {isSubmitting && <div className="absolute inset-0 bg-black/10 z-[60] rounded-3xl cursor-wait" />}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">Configurações do Período</h2>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{MONTH_NAMES[report.month]} {report.year}</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-30"
                    >
                        <X />
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Início do Ciclo</label>
                        <input
                            type="date"
                            disabled={isSubmitting}
                            value={formData.start_date}
                            onChange={e => { setFormData({ ...formData, start_date: e.target.value }); setError(null); }}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Fim do Ciclo</label>
                        <input
                            type="date"
                            disabled={isSubmitting}
                            value={formData.end_date}
                            onChange={e => { setFormData({ ...formData, end_date: e.target.value }); setError(null); }}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Selic do Período (%)</label>
                            <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase">
                                {((Math.pow(1 + (formData.selic_tax / 100), 1 / 12) - 1) * 100).toFixed(4)}% ao mês
                            </span>
                        </div>
                        <input
                            type="number" step="0.25"
                            disabled={isSubmitting}
                            value={formData.selic_tax}
                            onChange={e => setFormData({ ...formData, selic_tax: Number(e.target.value) })}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none font-mono text-blue-400 disabled:opacity-50"
                        />
                    </div>
                    <MoneyInput
                        label="Patrimônio Inicial"
                        disabled={isSubmitting}
                        value={formData.initial_patrimony}
                        onChange={(val: number) => setFormData({ ...formData, initial_patrimony: val })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <MoneyInput
                        label="OKR Mínimo"
                        disabled={isSubmitting}
                        value={formData.okr_min}
                        onChange={(val: number) => setFormData({ ...formData, okr_min: val })}
                    />
                    <MoneyInput
                        label="OKR Ambicioso"
                        disabled={isSubmitting}
                        value={formData.okr_ambitious}
                        onChange={(val: number) => setFormData({ ...formData, okr_ambitious: val })}
                    />
                </div>

                <button
                    onClick={handleApply}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? "Salvando..." : "Salvar Configurações"}
                </button>
            </motion.div>
        </div>
    );
}

function ConfirmModal({ title, message, onConfirm, onClose, variant }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const result = await onConfirm();
            if (result && result.error) {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message || "Erro desconhecido");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={(e) => {
                if (!isSubmitting && e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center relative"
            >
                {isSubmitting && <div className="absolute inset-0 bg-black/10 z-[60] rounded-[32px] cursor-wait" />}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {variant === 'warning' ? <FileText className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
                </div>

                <h2 className="text-xl font-bold mb-2 text-white">{title}</h2>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed px-2">{isSubmitting ? (variant === 'warning' ? "Processando..." : "Processando exclusão...") : message}</p>

                {error && (
                    <div className="mb-6 w-full p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-start gap-2 text-left">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex flex-col w-full gap-3">
                    <button
                        disabled={isSubmitting}
                        onClick={handleConfirm}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} disabled:opacity-50`}
                    >
                        {isSubmitting ? (variant === 'warning' ? "Confirmando..." : "Excluindo...") : (variant === 'warning' ? "Confirmar" : "Confirmar Exclusão")}
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-bold text-xs text-zinc-500 hover:text-zinc-300 transition-all uppercase tracking-widest disabled:opacity-30"
                    >
                        Cancelar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function CategoryModal({ category, onClose, onSubmit, categories }: any) {
    const [formData, setFormData] = useState(category || { name: "", type: "expense", icon: "Wallet" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFormValid = formData.name.trim() && formData.type;

    const handleInnerSubmit = async () => {
        setError(null);
        if (!formData.name.trim()) {
            setError("O nome da categoria é obrigatório.");
            return;
        }
        if (!formData.type) {
            setError("O tipo da categoria é obrigatório.");
            return;
        }
        if (categories.some((c: any) => c.name.toLowerCase() === formData.name.toLowerCase() && c.id !== category?.id)) {
            setError("Uma categoria com este nome já existe.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            const result = await onSubmit(formData);
            if (result && result.error) {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message || "Erro desconhecido");
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableIcons = ICON_OPTIONS.filter(iconName =>
        !categories.some((c: any) => c.icon === iconName) || (category && category.icon === iconName)
    );

    if (category?.is_system) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#121212] border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name={category.icon} className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">{category.name}</h2>
                    <p className="text-sm text-zinc-500 font-bold leading-relaxed">Esta é uma categoria do sistema necessária para o funcionamento básico e não pode ser editada.</p>
                    <button onClick={onClose} className="w-full py-4 bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-700 transition-all">Fechar</button>
                </motion.div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative"
            >
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold uppercase italic tracking-tighter text-white">{category ? "Editar Categoria" : "Nova Categoria"}</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-white"
                    >
                        <X />
                    </button>
                </div>

                <AnimatePresence>
                    {error && (
                        <div className="px-6 pt-6">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-medium"
                            >
                                <X className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Type Toggle */}
                    <div className="space-y-1.5 w-full">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block pl-1">Tipo</label>
                        <div className="flex bg-[#18181b] p-1 rounded-2xl border border-zinc-800 font-sans">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                                className={`flex-1 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${formData.type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'} disabled:opacity-50`}
                            >
                                Despesa
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'income' })}
                                className={`flex-1 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'} disabled:opacity-50`}
                            >
                                Receita
                            </button>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1.5 w-full">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block pl-1">Nome da Categoria</label>
                        <input
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-medium h-[38px]"
                            placeholder="EX: ALIMENTAÇÃO, SALÁRIO..."
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            autoFocus
                        />
                    </div>

                    {/* Icon Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pl-1">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Ícone</label>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase">{availableIcons.length} disponíveis</span>
                        </div>
                        <div className="p-4 rounded-3xl bg-black/20 border border-zinc-800">
                            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 p-1">
                                {availableIcons.map((iconName) => (
                                    <button
                                        key={iconName}
                                        onClick={() => setFormData({ ...formData, icon: iconName })}
                                        className={`aspect-square rounded-lg flex items-center justify-center transition-all border ${formData.icon === iconName ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-zinc-800/30 border-zinc-800/50 text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                        <Icon name={iconName} className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-800">
                    <button
                        onClick={handleInnerSubmit}
                        disabled={isSubmitting || !isFormValid}
                        className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'} text-white shadow-xl`}
                    >
                        {isSubmitting ? "Salvando..." : (category ? "Salvar Alterações" : "Criar Categoria")}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function CategoriesView({ categories, onSave }: any) {
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

    const handleSubmit = async (data: any) => {
        const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
        const method = editingCategory ? "PUT" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (res.ok) {
            setEditingCategory(null);
            setShowAdd(false);
            onSave();
        } else {
            const err = await res.json();
            return { error: err.error || "Erro ao salvar categoria" };
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        const res = await fetch(`/api/categories/${categoryToDelete.id}`, { method: 'DELETE' });
        if (res.ok) {
            setCategoryToDelete(null);
            onSave();
            return {};
        } else {
            const err = await res.json();
            return { error: err.error || "Erro ao excluir categoria" };
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-white flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold">Categorias</h2>
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest italic">Organize o plano de contas</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20">
                    <PlusCircle className="w-4 h-4" /> Nova Categoria
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 custom-scrollbar">
                {categories.map((cat: any) => {
                    const tCount = cat.transaction_count || 0;
                    const sCount = cat.supplier_count || 0;
                    const canDelete = tCount === 0 && sCount === 0 && !cat.is_system;

                    return (
                        <div key={cat.id} className="relative bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between group hover:border-zinc-700 transition-all gap-4 cursor-pointer" onClick={() => setEditingCategory(cat)}>
                            {canDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoryToDelete(cat);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-red-500 transition-colors bg-black/50 rounded-full opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-zinc-800 flex-shrink-0"><Icon name={cat.icon || "Wallet"} /></div>
                                    <div className="min-w-0">
                                        <div className="font-bold truncate flex items-center gap-1.5" title={cat.name}>
                                            {cat.name}
                                            {!!cat.is_system && <div className="w-1 h-1 rounded-full bg-blue-500" title="Sistema" />}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{cat.type === 'expense' ? 'Despesa' : 'Receita'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/5 text-emerald-500/70 border border-emerald-500/10 text-[9px] font-black">
                                    <Clock className="w-3 h-3" />
                                    {tCount} TXs
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/5 text-blue-500/70 border border-blue-500/10 text-[9px] font-black">
                                    <Package className="w-3 h-3" />
                                    {sCount} FORN
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {(showAdd || editingCategory) && <CategoryModal category={editingCategory} onClose={() => { setEditingCategory(null); setShowAdd(false); }} onSubmit={handleSubmit} categories={categories} />}

            {categoryToDelete && (
                <ConfirmModal
                    isOpen={true}
                    title="Excluir Categoria"
                    message={`Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"?`}
                    variant="danger"
                    onConfirm={handleDelete}
                    onClose={() => setCategoryToDelete(null)}
                />
            )}
        </div>
    );
}

function SuppliersView({ suppliers, categories, aliases, onRefresh }: any) {
    const [showAdd, setShowAdd] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<any>(null);

    const handleDelete = async () => {
        if (!supplierToDelete) return;
        const res = await fetch(`/api/suppliers/${supplierToDelete.id}`, { method: "DELETE" });
        if (res.ok) {
            onRefresh();
            setSupplierToDelete(null);
            return {};
        } else {
            const err = await res.json();
            return { error: err.error || "Erro ao excluir fornecedor" };
        }
    };

    const handleSubmit = async (data: any) => {
        const method = editingSupplier ? "PUT" : "POST";
        const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            onRefresh();
            setShowAdd(false);
            setEditingSupplier(null);
        } else {
            const err = await res.json();
            return { error: err.error || "Erro ao salvar fornecedor" };
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-white">Gestão de Fornecedores</h2>
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Base de dados central para transações</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" />
                    Novo Fornecedor
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
                {suppliers.map((supplier: any) => {
                    const supplierCats = [];
                    if (supplier.expense_category_id) {
                        const cat = categories.find((c: any) => c.id === supplier.expense_category_id);
                        if (cat) supplierCats.push(cat);
                    }
                    if (supplier.income_category_id) {
                        const cat = categories.find((c: any) => c.id === supplier.income_category_id);
                        if (cat) supplierCats.push(cat);
                    }
                    const isSystem = supplier.is_system === 1;
                    const tCount = supplier.transaction_count || 0;
                    return (
                        <div key={supplier.id} className="relative group bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-emerald-500/50 transition-all cursor-pointer" onClick={() => setEditingSupplier(supplier)}>
                            {tCount === 0 && !isSystem && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSupplierToDelete(supplier);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-red-500 transition-colors bg-black/50 rounded-full opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-800 shadow-xl bg-zinc-800 text-emerald-500`}>
                                        <Icon name={supplier.logo || 'Package'} className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-sm text-white truncate">{supplier.name}</h3>
                                            {tCount > 0 && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[8px] font-black border border-zinc-700">
                                                    {tCount} TXs
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">{supplierCats.length} Categorias vinculadas</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {supplierCats.map((c: any) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-800 text-[8px] font-bold text-zinc-400 uppercase"
                                        >
                                            <Icon name={c.icon} className="w-2.5 h-2.5" />
                                            <span>{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                                {supplier.aliases && supplier.aliases.length > 0 && (
                                    <div className="pt-2 border-t border-zinc-800/50">
                                        <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1.5">Pseudônimos associados:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {supplier.aliases.split(',').map((alias: string, idx: number) => (
                                                <span key={idx} className="text-[9px] text-zinc-500 bg-black/20 px-1.5 rounded uppercase border border-zinc-800/50">{alias}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {(showAdd || editingSupplier) && (
                <SupplierModal
                    supplier={editingSupplier}
                    categories={categories}
                    aliases={aliases}
                    onClose={() => { setEditingSupplier(null); setShowAdd(false); }}
                    onSubmit={handleSubmit}
                />
            )}

            {supplierToDelete && (
                <ConfirmModal
                    isOpen={true}
                    title="Excluir Fornecedor"
                    message={`Tem certeza que deseja excluir o fornecedor "${supplierToDelete.name}"?`}
                    variant="danger"
                    onConfirm={handleDelete}
                    onClose={() => setSupplierToDelete(null)}
                />
            )}
        </div>
    );
}

function CardModal({ card, onClose, onSubmit }: any) {
    const [name, setName] = useState(card?.name || "");
    const [logo, setLogo] = useState(card?.logo || "");

    // Crop state
    const [imgSrc, setImgSrc] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const getCroppedImg = async (image: HTMLImageElement, pixelCrop: PixelCrop) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.drawImage(
            image,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0, 0, pixelCrop.width, pixelCrop.height
        );
        return canvas.toDataURL('image/png');
    };

    const handleDoneCropping = async () => {
        if (imgRef.current && completedCrop) {
            const base64 = await getCroppedImg(imgRef.current, completedCrop);
            setLogo(base64);
            setImgSrc('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || isSubmitting) return;

        setApiError(null);
        setIsSubmitting(true);

        try {
            const result = await onSubmit({ id: card?.id, name, logo });
            if (result && result.error) {
                setApiError(result.error);
            }
        } catch (err: any) {
            setApiError(err.message || "Erro desconhecido");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 uppercase italic tracking-tighter">{card ? "Editar Cartão" : "Adicionar Cartão"}</h2>

                {apiError && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{apiError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="NOME DO BANCO"
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold"
                        required
                        disabled={isSubmitting}
                    />
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase">Logo</label>
                        <div className="flex items-center gap-4">
                            {logo.startsWith('data:') ? (
                                <img src={logo} className="w-16 h-16 rounded-2xl object-cover border border-zinc-700" alt="Preview" />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                            )}
                            <label className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center py-3 rounded-xl cursor-pointer transition-colors text-xs uppercase tracking-widest">
                                Selecionar Imagem
                                <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                            </label>
                        </div>
                        {imgSrc && (
                            <div className="space-y-2 pt-2 border-t border-zinc-800">
                                <div className="max-h-48 overflow-hidden rounded-xl bg-black flex justify-center">
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(c) => setCrop(c)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={1}
                                    >
                                        <img ref={imgRef} src={imgSrc} style={{ maxHeight: '192px' }} />
                                    </ReactCrop>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDoneCropping}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-widest"
                                >
                                    Confirmar Recorte
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold uppercase text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold uppercase text-xs"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CardsView({ onRefresh }: any) {
    const [cards, setCards] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCard, setEditingCard] = useState<any>(null);
    const [cardToDelete, setCardToDelete] = useState<any>(null);

    useEffect(() => {
        fetch("/api/cards").then(res => res.json()).then(setCards);
    }, [editingCard, cardToDelete]); // Refresh after changes

    const handleSave = async (card: any) => {
        try {
            const res = card.id
                ? await fetch(`/api/cards/${card.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(card)
                })
                : await fetch("/api/cards", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(card)
                });

            if (!res.ok) {
                const err = await res.json();
                return { error: err.error || "Erro ao salvar cartão." };
            }

            onRefresh();
            setShowModal(false);
            return {};
        } catch (e: any) {
            console.error(e);
            return { error: e.message || "Erro ao salvar cartão." };
        }
    };

    const performDelete = async () => {
        if (!cardToDelete) return;
        const res = await fetch(`/api/cards/${cardToDelete.id}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            return { error: data.error || "Erro ao excluir o cartão." };
        }
        onRefresh();
        setCards(cards.filter(c => c.id !== cardToDelete.id));
        setCardToDelete(null);
        return {};
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gerir Cartões</h1>
                <button
                    onClick={() => { setEditingCard(null); setShowModal(true); }}
                    className="px-4 py-2 bg-emerald-600 rounded-xl font-bold"
                >
                    Adicionar Cartão
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map((c: any) => (
                    <div
                        key={c.id}
                        className="bg-zinc-800 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-zinc-700 transition-colors group"
                        onClick={() => { setEditingCard(c); setShowModal(true); }}
                    >
                        <div className="flex items-center gap-3">
                            <img src={c.logo} alt={c.name} referrerPolicy="no-referrer" className="w-10 h-10 object-contain rounded bg-white p-1" />
                            <span className="font-bold">{c.name}</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCardToDelete(c); }}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            title="Excluir"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            {showModal && <CardModal card={editingCard} onClose={() => setShowModal(false)} onSubmit={handleSave} />}
            {cardToDelete && (
                <ConfirmModal
                    isOpen={true}
                    title="Excluir Cartão"
                    message={`Tem certeza que deseja excluir o cartão "${cardToDelete.name}"?`}
                    variant="danger"
                    onConfirm={performDelete}
                    onClose={() => setCardToDelete(null)}
                />
            )}
        </div>
    );
}

function SupplierModal({ supplier, categories, aliases, onClose, onSubmit }: any) {
    const [name, setName] = useState(supplier?.name || "");
    const [expenseCategoryId, setExpenseCategoryId] = useState<string | null>(supplier?.expense_category_id || null);
    const [incomeCategoryId, setIncomeCategoryId] = useState<string | null>(supplier?.income_category_id || null);
    const [selectedAliases, setSelectedAliases] = useState<string[]>([]);
    const isSystem = supplier?.is_system === 1;

    // Visual state
    const initialVisualType = supplier?.logo?.startsWith('data:') ? 'logo' : (supplier?.logo ? 'icon' : 'none');
    const [visualType, setVisualType] = useState<'none' | 'logo' | 'icon'>(initialVisualType);
    const [logo, setLogo] = useState(supplier?.logo || "Package"); // Icon name or Base64 image

    // Crop state
    const [imgSrc, setImgSrc] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    // Pseudônimos que não estão vinculados a nenhum fornecedor OU que já estão vinculados a este fornecedor
    const availableAliases = aliases.filter((a: any) => !a.supplier_id || a.supplier_id === supplier?.id);

    useEffect(() => {
        if (supplier) {
            setSelectedAliases(availableAliases.filter((a: any) => a.supplier_id === supplier.id).map((a: any) => a.id));
        }
    }, [supplier]);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
            width,
            height
        );
        setCrop(initialCrop);
    };

    const getCroppedImg = async (image: HTMLImageElement, pixelCrop: PixelCrop) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return '';

        ctx.drawImage(
            image,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return canvas.toDataURL('image/png');
    };

    const handleDoneCropping = async () => {
        if (imgRef.current && completedCrop) {
            const base64 = await getCroppedImg(imgRef.current, completedCrop);
            setLogo(base64);
            setImgSrc('');
        }
    };

    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const expenseCategories = categories.filter((c: any) => c.type === 'expense');
    const incomeCategories = categories.filter((c: any) => c.type === 'income');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name && !isSystem) return;

        let finalLogo = null;
        if (visualType === 'icon') finalLogo = logo;
        else if (visualType === 'logo') finalLogo = logo.startsWith('data:') ? logo : null;

        setApiError(null);
        setIsSubmitting(true);

        try {
            const payload = {
                name: isSystem ? supplier.name : name,
                logo: isSystem ? supplier.logo : finalLogo,
                expense_category_id: expenseCategoryId,
                income_category_id: incomeCategoryId,
                alias_ids: isSystem ? (supplier.alias_ids || []) : selectedAliases
            };
            const result = await onSubmit(payload);
            if (result && result.error) {
                setApiError(result.error);
            }
        } catch (err: any) {
            setApiError(err.message || "Erro desconhecido");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isInvalid = (!name && !isSystem) || isSubmitting;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">{supplier ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {apiError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{apiError}</span>
                        </div>
                    )}
                    <div className="space-y-1.5 w-full">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Nome do Fornecedor</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value.toUpperCase())}
                            placeholder="EX: AMAZON, MERCADO LIVRE..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none placeholder:text-zinc-700 text-white font-bold h-[38px] disabled:opacity-50"
                            required={!isSystem}
                            disabled={isSystem}
                        />
                        {isSystem && <p className="text-[10px] text-zinc-500 font-bold uppercase">Fornecedor do sistema, nome não pode ser alterado.</p>}
                    </div>

                    <CustomSelect
                        label="Pseudônimos"
                        multiple
                        value={selectedAliases}
                        onChange={setSelectedAliases}
                        options={availableAliases.map((a: any) => ({ value: a.id, label: a.name }))}
                        className="w-full text-left"
                        disabled={isSystem}
                    />

                    <CustomSelect
                        label="Categoria Padrão - Despesas"
                        value={expenseCategoryId || ""}
                        onChange={setExpenseCategoryId}
                        options={expenseCategories.map((c: any) => ({
                            value: c.id,
                            label: c.name,
                            icon: c.icon
                        }))}
                        className="w-full text-left"
                    />

                    <CustomSelect
                        label="Categoria Padrão - Receitas"
                        value={incomeCategoryId || ""}
                        onChange={setIncomeCategoryId}
                        options={incomeCategories.map((c: any) => ({
                            value: c.id,
                            label: c.name,
                            icon: c.icon
                        }))}
                        className="w-full text-left"
                    />

                    <div className={`space-y-4 pt-4 border-t border-zinc-800/50 ${isSystem && 'opacity-50 pointer-events-none'}`}>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Identidade Visual</label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-zinc-800">
                            {(['none', 'logo', 'icon'] as const).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setVisualType(v)}
                                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border ${visualType === v ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400'}`}
                                    disabled={isSystem}
                                >
                                    {v === 'none' ? 'Sem logo' : v === 'logo' ? 'Logo' : 'Ícone'}
                                </button>
                            ))}
                        </div>

                        {visualType === 'logo' && (
                            <div className="space-y-4 p-4 rounded-3xl bg-black/20 border border-zinc-800">
                                <div className="flex items-center gap-4">
                                    {logo.startsWith('data:') ? (
                                        <img src={logo} className="w-16 h-16 rounded-2xl object-cover border border-zinc-700" alt="Preview" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center py-3 rounded-xl cursor-pointer transition-colors text-[10px] uppercase tracking-widest">
                                            Selecionar Imagem
                                            <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                {imgSrc && (
                                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                                        <div className="max-h-64 overflow-hidden rounded-2xl bg-black flex justify-center">
                                            <ReactCrop
                                                crop={crop}
                                                onChange={(c) => setCrop(c)}
                                                onComplete={(c) => setCompletedCrop(c)}
                                                aspect={1}
                                            >
                                                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '256px' }} />
                                            </ReactCrop>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDoneCropping}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest"
                                        >
                                            Confirmar Recorte
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {visualType === 'icon' && (
                            <div className="p-4 rounded-3xl bg-black/20 border border-zinc-800">
                                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 p-1">
                                    {ICON_OPTIONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setLogo(icon)}
                                            className={`aspect-square rounded-lg flex items-center justify-center transition-all border ${logo === icon ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-zinc-800/30 border-zinc-800/50 text-zinc-600 hover:text-zinc-400'}`}
                                        >
                                            <Icon name={icon} className="w-3.5 h-3.5" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 border-t border-zinc-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-6 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold hover:bg-zinc-700 transition-colors uppercase text-xs tracking-widest">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isInvalid}
                        className={`flex-[2] px-6 py-4 rounded-2xl font-bold transition-all shadow-xl uppercase text-xs tracking-widest ${isInvalid ? 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20'}`}
                    >
                        {supplier ? "Salvar Alterações" : "Criar Fornecedor"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function AliasesView({ aliases, onRefresh }: any) {
    const [showAdd, setShowAdd] = useState(false);
    const [editingAlias, setEditingAlias] = useState<any>(null);
    const [aliasToDelete, setAliasToDelete] = useState<any>(null);

    const handleDelete = async () => {
        if (!aliasToDelete) return;
        const res = await fetch(`/api/aliases/${aliasToDelete.id}`, { method: "DELETE" });
        if (res.ok) {
            onRefresh();
            setAliasToDelete(null);
            return {};
        } else {
            const err = await res.json();
            return { error: err.error || "Erro ao excluir pseudônimo" };
        }
    };

    const handleSubmit = async (data: any) => {
        const method = editingAlias ? "PUT" : "POST";
        const url = editingAlias ? `/api/aliases/${editingAlias.id}` : "/api/aliases";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            onRefresh();
            setShowAdd(false);
            setEditingAlias(null);
            return {};
        } else {
            const err = await res.json();
            return { error: err.error || "Erro ao salvar pseudônimo" };
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-white">Gestão de Pseudônimos</h2>
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Nomes que aparecem nos extratos</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" />
                    Novo Pseudônimo
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
                {aliases.map((alias: any) => {
                    const siblingCount = aliases.filter((a: any) => a.supplier_id === alias.supplier_id).length;
                    const canDelete = !alias.supplier_id || siblingCount > 1;

                    return (
                        <div key={alias.id} className="relative group bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-emerald-500/50 transition-all cursor-pointer" onClick={() => setEditingAlias(alias)}>
                            {canDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAliasToDelete(alias);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-red-500 transition-colors bg-black/50 rounded-full opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-500">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white">{alias.name}</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                                            {alias.supplier_id ? "Vinculado a Fornecedor" : "Sem Fornecedor"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {(showAdd || editingAlias) && (
                <AliasModal
                    alias={editingAlias}
                    onClose={() => { setEditingAlias(null); setShowAdd(false); }}
                    onSubmit={handleSubmit}
                />
            )}

            {aliasToDelete && (
                <ConfirmModal
                    isOpen={true}
                    title="Excluir Pseudônimo"
                    message={`Tem certeza que deseja excluir o pseudônimo "${aliasToDelete.name}"?`}
                    variant="danger"
                    onConfirm={handleDelete}
                    onClose={() => setAliasToDelete(null)}
                />
            )}
        </div>
    );
}

function AliasModal({ alias, onClose, onSubmit }: any) {
    const [name, setName] = useState(alias?.name || "");
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || isSubmitting) return;

        setApiError(null);
        setIsSubmitting(true);

        try {
            const result = await onSubmit({ name });
            if (result && result.error) {
                setApiError(result.error);
            }
        } catch (err: any) {
            setApiError(err.message || "Erro desconhecido");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isInvalid = !name || isSubmitting;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">{alias ? "Editar Pseudônimo" : "Novo Pseudônimo"}</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {apiError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{apiError}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Nome do Pseudônimo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value.toUpperCase())}
                            placeholder="EX: ALMOÇO DE TRABALHO"
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none placeholder:text-zinc-700 text-white font-bold"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                </form>

                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                    <button
                        onClick={handleSubmit}
                        disabled={isInvalid}
                        className={`w-full font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] ${isInvalid
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                            : "bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
                            }`}
                    >
                        Salvar Pseudônimo
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function ImportSelectionModal({ onSelectPhoto, onSelectManual, onClose }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl space-y-8"
            >
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Nova Transação</h2>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Como deseja registrá-la?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
                    <motion.button
                        whileHover={{ scale: 1.02, translateY: -4 }}
                        onClick={onSelectPhoto}
                        className="group relative bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:border-emerald-500/50 hover:bg-zinc-800 transition-all text-left flex items-start gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shrink-0">
                            <Camera className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-lg text-white uppercase tracking-tight">Câmera / Extrato</h3>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">A IA lê os itens para você</p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, translateY: -4 }}
                        onClick={onSelectManual}
                        className="group relative bg-zinc-950 border-2 border-dashed border-zinc-800 p-6 rounded-3xl hover:border-zinc-600 hover:bg-zinc-900 transition-all text-left flex items-start gap-4 text-white"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-zinc-200 transition-colors shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-lg text-zinc-500 group-hover:text-zinc-200 uppercase tracking-tight">Manual</h3>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Digitar item a item</p>
                        </div>
                    </motion.button>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={onClose}
                        className="text-[10px] font-black text-zinc-600 hover:text-zinc-200 uppercase tracking-[0.3em] transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function PhotoImportModal({ activeReport, cards, onClose, onComplete }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importType, setImportType] = useState<string | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (importType === "credit_card" && !selectedCardId) {
            setError("Por favor, selecione um cartão antes de enviar os arquivos.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const fileParams = await Promise.all(files.map(async (file: File) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Data = (reader.result as string).split(",")[1];
                        resolve({
                            inlineData: {
                                data: base64Data,
                                mimeType: file.type || "application/octet-stream",
                                fileName: file.name
                            }
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }));

            const res = await fetch("/api/gemini/extract-transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageParams: fileParams,
                    reportStartDate: activeReport?.start_date,
                    reportEndDate: activeReport?.end_date,
                    importType
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao processar arquivo");

            onComplete({ transactions: data, importType, card_id: selectedCardId });
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const types = [
        { id: 'bank_statement', label: 'Extrato Bancário', icon: Landmark, desc: 'Entradas e saídas de conta' },
        { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard, desc: 'Apenas despesas e estornos' },
        { id: 'ticket', label: 'Extrato de Ticket', icon: Ticket, desc: 'Entradas e saídas de benefícios' },
        { id: 'other', label: 'Outros', icon: FileText, desc: 'Planilhas, recibos ou gerais' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl bg-[#121212] border border-zinc-800 rounded-3xl p-8 space-y-6 relative overflow-hidden"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Importar Arquivos</h2>
                    <button onClick={!loading ? onClose : undefined} disabled={loading} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"><X size={20} className="text-zinc-500" /></button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
                        {error}
                    </div>
                )}

                {!importType ? (
                    <div className="space-y-4">
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest text-center mb-6">Selecione o tipo do arquivo para uma melhor extração</p>
                        <div className="grid grid-cols-1 gap-3">
                            {types.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setImportType(t.id)}
                                    className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-emerald-500/50 hover:bg-zinc-800 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-colors">
                                        <t.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{t.label}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">{t.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {importType === "credit_card" && (
                            <div className="space-y-2">
                                <CustomSelect
                                    label="Qual Cartão?"
                                    value={selectedCardId}
                                    onChange={setSelectedCardId}
                                    options={cards?.map((c: any) => ({
                                        value: c.id,
                                        label: c.name,
                                        icon: c.logo
                                    })) || []}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl relative transition-all ${(importType === "credit_card" && !selectedCardId)
                            ? "border-zinc-800 bg-zinc-900/10 opacity-30 cursor-not-allowed"
                            : "border-zinc-700/50 bg-zinc-900/30 hover:bg-zinc-800/50 cursor-pointer"
                            }`}>
                            {loading ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">A IA está lendo os arquivos...</p>
                                    <p className="text-zinc-500 text-[9px] uppercase font-bold">{types.find(t => t.id === importType)?.label}</p>
                                    {importType === "credit_card" && selectedCardId && (
                                        <div className="flex items-center gap-2 mt-2 bg-zinc-800 px-3 py-1 rounded-full">
                                            <img src={cards.find((c: any) => c.id === selectedCardId)?.logo} className="w-4 h-4 object-contain rounded" />
                                            <span className="text-[9px] text-white font-bold uppercase">{cards.find((c: any) => c.id === selectedCardId)?.name}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Upload className={`w-12 h-12 mb-4 ${importType === "credit_card" && !selectedCardId ? 'text-zinc-800' : 'text-zinc-500'}`} />
                                    <p className={`text-sm font-bold uppercase ${importType === "credit_card" && !selectedCardId ? 'text-zinc-700' : 'text-zinc-300'}`}>
                                        {importType === "credit_card" && !selectedCardId ? "Selecione um cartão primeiro" : "Clique para enviar arquivos"}
                                    </p>
                                    <p className={`text-[10px] uppercase tracking-widest mt-2 text-center ${importType === "credit_card" && !selectedCardId ? 'text-zinc-800' : 'text-zinc-600'}`}>
                                        Imagens, PDF, Excel, Word, CSV permitidos<br />(Pode selecionar vários)
                                    </p>

                                    {(!selectedCardId || importType !== 'credit_card') && (
                                        <div className="mt-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                            <Check size={10} /> {types.find(t => t.id === importType)?.label}
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                                        multiple
                                        onChange={handleFileChange}
                                        className={`absolute inset-0 w-full h-full opacity-0 ${importType === "credit_card" && !selectedCardId ? 'hidden' : 'cursor-pointer'}`}
                                        disabled={(importType === "credit_card" && !selectedCardId) || loading}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function AliasMapperModal({ unmappedAliases, suppliers, categories, aliases, onRefreshSuppliers, onClose, onComplete }: any) {
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [ignoredAliases, setIgnoredAliases] = useState<Set<string>>(new Set());
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [activeAliasForNewSupplier, setActiveAliasForNewSupplier] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeAliases = unmappedAliases.filter((a: string) => !ignoredAliases.has(a));

    const isComplete = activeAliases.every((alias: string) => {
        const val = mapping[alias];
        return !!val;
    });

    const handleSubmit = async () => {
        if (!isComplete || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const mappings = Object.entries(mapping).map(([name, supplier_id]) => ({ name, supplier_id }));
            // Only send non-ignored mappings
            const res = await fetch("/api/aliases/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mappings })
            });
            if (res.ok) {
                onComplete(mapping);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSupplier = async (data: any) => {
        // If we have an active alias, include it in newAliases
        const finalData = {
            ...data,
            newAliases: activeAliasForNewSupplier ? [activeAliasForNewSupplier] : []
        };

        const res = await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalData)
        });

        if (res.ok) {
            const newSupplier = await res.json();
            if (onRefreshSuppliers) await onRefreshSuppliers();

            // If it was created for a specific alias, map it automatically
            if (activeAliasForNewSupplier && newSupplier.id) {
                setMapping(prev => ({ ...prev, [activeAliasForNewSupplier]: newSupplier.id }));
            }

            setShowSupplierModal(false);
            setActiveAliasForNewSupplier(null);
        } else {
            const err = await res.json();
            return { error: err.error || "Erro ao criar fornecedor." };
        }
    };

    return (
        <>
            <div className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 ${showSupplierModal ? 'hidden' : ''}`}>
                <div className="w-full max-w-2xl bg-[#121212] border border-zinc-800 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-8 pb-6 flex items-center justify-between border-b border-zinc-800 shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Novos Fornecedores</h2>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Vincule os nomes encontrados a fornecedores conhecidos.</p>
                        </div>
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Novo Fornecedor
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
                        {activeAliases.map((alias: string) => (
                            <div key={alias} className="p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-zinc-900/60 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1 opacity-50">Texto Encontrado</p>
                                    <p className="font-bold text-white text-sm uppercase tracking-tight truncate">{alias}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-56">
                                        <CustomSelect
                                            value={mapping[alias] || ""}
                                            onChange={(val) => setMapping(prev => ({ ...prev, [alias]: val }))}
                                            options={suppliers.map((s: any) => ({
                                                value: s.id,
                                                label: s.name,
                                                icon: s.logo
                                            }))}
                                            label="SELECIONE"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIgnoredAliases(prev => new Set(prev).add(alias));
                                        }}
                                        className="p-2.5 bg-zinc-800 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                        title="Ignorar pseudônimo"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveAliasForNewSupplier(alias);
                                            setShowSupplierModal(true);
                                        }}
                                        className="p-2.5 bg-zinc-800 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-700/50 rounded-xl transition-all"
                                        title="Criar Fornecedor para este nome"
                                    >
                                        <PlusCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 flex gap-3 border-t border-zinc-800 shrink-0 bg-[#0a0a0a]">
                        {!isSubmitting && (
                            <button
                                onClick={onClose}
                                className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg active:scale-95"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!isComplete || isSubmitting}
                            className="flex-1 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <> <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
                            ) : (
                                <> <CheckCircle2 size={16} /> Confirmar Relacionamentos </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {showSupplierModal && (
                <SupplierModal
                    supplier={activeAliasForNewSupplier ? { name: activeAliasForNewSupplier } : null}
                    categories={categories}
                    aliases={aliases}
                    onClose={() => {
                        setShowSupplierModal(false);
                        setActiveAliasForNewSupplier(null);
                    }}
                    onSubmit={handleCreateSupplier}
                />
            )}
        </>
    );
}

function ReviewTransactionsModal({ activeReport, reports, transactions: initialTransactions, categories, sources, suppliers, aliases, cards, onClose, onConfirm }: any) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const [transactions, setTransactions] = useState<any[]>(() => {
        const pixSource = sources.find((s: any) => s.name.toUpperCase() === 'PIX');
        const cardSource = sources.find((s: any) => s.name.toUpperCase() === 'CARTÃO' || s.name.toUpperCase() === 'CREDIT' || s.name.toUpperCase() === 'CARTÃO DE CRÉDITO');
        const ticketSource = sources.find((s: any) => s.name.toUpperCase() === 'TICKET');

        // Filter transactions: ignore those where the alias doesn't exist or isn't linked to a supplier
        const filtered = initialTransactions.filter((t: any) => {
            if (!t.aliasName) return true;
            const alias = aliases.find((a: any) => a.name === t.aliasName);
            return alias && alias.supplier_id;
        });

        // Sort by date, then by original index to maintain order
        const sorted = [...filtered].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.original_index || 0) - (b.original_index || 0);
        });

        return sorted.map((t: any) => {
            let source_id = sources[0]?.id || "";
            if (t.importType === 'bank_statement' && pixSource) source_id = pixSource.id;
            if (t.importType === 'credit_card' && cardSource) source_id = cardSource.id;
            if (t.importType === 'ticket' && ticketSource) source_id = ticketSource.id;

            const alias = aliases.find((a: any) => a.name === t.aliasName);

            return {
                ...t,
                source_id,
                is_mandatory: false,
                category_id: t.category_id || (alias ? alias.category_id : null), // Also map category
                supplier_id: alias ? alias.supplier_id : null,
                type: (t.importType === 'credit_card') ? 'expense' : t.type
            };
        });
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [removingIndex, setRemovingIndex] = useState<number | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean; type: 'selected' | 'alerts' }>({ isOpen: false, type: 'selected' });

    const hasAlert = (t: any) => {
        const tDateStr = (t.date || "").substring(0, 10);
        const tDate = new Date(tDateStr + 'T12:00:00');

        const isOutOfBounds = activeStart && activeEnd && (tDate < activeStart || tDate > activeEnd);

        const report = reports?.find((r: any) => r.id === t.report_id);

        const transactions = report?.transactions || [];

        const isDuplicate = transactions.some((existing: any) =>
            existing.id !== t.id &&
            Math.abs(existing.value - t.value) < 0.01 &&
            existing.type === t.type &&
            existing.supplier_id === t.supplier_id &&
            existing.source_id === t.source_id &&
            existing.report_id === t.report_id
        );

        return isOutOfBounds || isDuplicate || t.is_potential_reversal || !t.category_id;
    };

    const handleToggleSelect = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setSelectedIndices(next);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIndices(new Set(transactions.map((_, i) => i)));
        } else {
            setSelectedIndices(new Set());
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIndices.size === 0) return;
        setTransactions(prev => prev.filter((_, i) => !selectedIndices.has(i)));
        setSelectedIndices(new Set());
        setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleDeleteAlerts = () => {
        setTransactions(prev => prev.filter(t => !hasAlert(t)));
        setSelectedIndices(new Set());
        setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleUpdateItem = (index: number, updatedItem: any) => {
        const copy = [...transactions];
        copy[index] = updatedItem;
        setTransactions(copy);
    };

    const handleRemove = (index: number) => {
        setTransactions(transactions.filter((_, i) => i !== index));
        setSelectedIndices(new Set());
    };

    const handleSave = async () => {
        if (transactions.length === 0) return onClose();
        setSubmitting(true);

        // In bulk insert, we now expect supplier info
        const payload = transactions.map(t => ({
            report_id: activeReport?.id,
            value: t.value || 0,
            type: t.type,
            source_id: t.source_id,
            card_id: t.card_id,
            date: t.date,
            category_id: t.category_id,
            is_mandatory: !!t.is_mandatory,
            is_recurring: !!t.is_recurring,
            remaining_recurrence: t.remaining_recurrence !== undefined ? t.remaining_recurrence : null,
            supplier_id: t.supplier_id,
            alias: { name: t.aliasName, category_id: t.category_id }
        }));

        try {
            const res = await fetch("/api/transactions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactions: payload })
            });
            if (res.ok) {
                onConfirm();
            } else {
                const data = await res.json();
                console.error("Bulk Insert error:", data.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const activeStart = activeReport?.start_date ? new Date(activeReport.start_date.substring(0, 10) + 'T00:00:00') : null;
    const activeEnd = activeReport?.end_date ? new Date(activeReport.end_date.substring(0, 10) + 'T23:59:59') : null;

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + (t.value || 0), 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + (t.value || 0), 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#09090b] border border-zinc-800 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] p-6 md:p-10 flex flex-col shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors">
                    <X size={20} />
                </button>

                <div className="shrink-0 mb-8 mt-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
                            <Zap className="text-emerald-500" /> Revisar Lançamentos
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
                                <Activity size={10} className="text-emerald-500 animate-pulse" /> {transactions.length} transações
                            </p>
                            <div className="h-3 w-px bg-zinc-800" />
                            <p className="text-[10px] uppercase font-black tracking-widest flex items-center gap-2 text-emerald-500">
                                <ArrowUpCircle size={10} /> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                            </p>
                            <p className="text-[10px] uppercase font-black tracking-widest flex items-center gap-2 text-red-500">
                                <ArrowDownCircle size={10} /> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                            </p>
                        </div>
                    </div>

                    {transactions.length > 0 && (
                        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
                            <label className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedIndices.size === transactions.length && transactions.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                                />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tudo</span>
                            </label>

                            <div className="h-4 w-px bg-zinc-800 mx-1" />

                            <button
                                onClick={() => setShowConfirmModal({ isOpen: true, type: 'selected' })}
                                disabled={selectedIndices.size === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 disabled:opacity-20 disabled:grayscale rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Trash2 size={12} /> Apagar Selecionados ({selectedIndices.size})
                            </button>

                            <button
                                onClick={() => setShowConfirmModal({ isOpen: true, type: 'alerts' })}
                                disabled={transactions.filter(t => hasAlert(t)).length === 0}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 disabled:grayscale"
                            >
                                <AlertTriangle size={12} /> Apagar com Alertas ({transactions.filter(t => hasAlert(t)).length})
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {transactions.map((t, i) => {
                        const tDateStr = (t.date || "").substring(0, 10);
                        const tDate = new Date(tDateStr + 'T12:00:00');

                        const isOutOfBounds = activeStart && activeEnd && (tDate < activeStart || tDate > activeEnd);

                        const tSupplierKey = t.supplier_id || t.aliasName;

                        const report = reports?.find((r: any) => r.id === t.report_id);

                        const transactions = report?.transactions || [];

                        const isDuplicate = transactions.some((existing: any) =>
                            existing.id !== t.id &&
                            Math.abs(existing.value - t.value) < 0.01 &&
                            existing.type === t.type &&
                            existing.supplier_id === t.supplier_id &&
                            existing.source_id === t.source_id &&
                            existing.report_id === t.report_id
                        );

                        const sourceName = sources.find((s: any) => s.id === t.source_id)?.name || "Não definida";
                        const catName = categories.find((c: any) => c.id === t.category_id)?.name || "Sem categoria";
                        const supplier = suppliers.find((s: any) => s.id === t.supplier_id);

                        return (
                            <div
                                key={i}
                                onClick={() => setEditingIndex(i)}
                                className={`relative bg-[#18181b]/50 border ${selectedIndices.has(i) ? 'border-emerald-500/50 bg-emerald-500/5' : (t.category_id ? 'border-zinc-800/50' : 'border-amber-500/20')} p-5 rounded-3xl flex items-center gap-5 group cursor-pointer hover:bg-zinc-800/80 transition-all active:scale-[0.99]`}
                            >
                                <div
                                    onClick={e => { e.stopPropagation(); handleToggleSelect(i); }}
                                    className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIndices.has(i)}
                                        onChange={() => { }} // Controlled by onClick
                                        className="w-5 h-5 rounded-lg border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                                    />
                                </div>

                                <div className="absolute -top-3 left-16 flex gap-2">
                                    {isOutOfBounds && (
                                        <span className="bg-amber-950 text-amber-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1 shadow-lg backdrop-blur-md">
                                            ⚠️ FORA DO PERÍODO
                                        </span>
                                    )}
                                    {isDuplicate && (
                                        <span className="bg-amber-950 text-amber-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1 shadow-lg backdrop-blur-md">
                                            ⚠️ DUPLICIDADE
                                        </span>
                                    )}
                                    {t.is_potential_reversal && (
                                        <span className="bg-blue-950 text-blue-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/50 flex items-center gap-1 shadow-lg backdrop-blur-md">
                                            ℹ️ ESTORNO/CANCELAMENTO
                                        </span>
                                    )}
                                    {t.installments && (
                                        <span className="bg-emerald-950 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/50 flex items-center gap-1 shadow-lg backdrop-blur-md">
                                            📦 PARCELA {t.installments}
                                        </span>
                                    )}
                                    {!t.category_id && (
                                        <span className="bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                            FALTA CATEGORIA
                                        </span>
                                    )}
                                </div>

                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-400'} border border-zinc-800`}>
                                    <Icon name={supplier?.logo || (categories.find(c => c.id === t.category_id)?.icon) || (t.type === 'income' ? 'ArrowUpCircle' : 'ArrowDownCircle')} className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{supplier?.name || t.aliasName || "Sem descrição"}</h3>
                                            {supplier && <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{t.aliasName}</p>}
                                        </div>
                                        <span className={`text-base font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                                            {t.type === 'expense' ? '-' : '+'} {formatCurrency(t.value)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                            <Calendar size={12} className="opacity-50 text-emerald-500" /> {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                            <Wallet size={12} className="opacity-50 text-emerald-500" /> {sourceName}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                                            <Tag size={10} /> {catName}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setRemovingIndex(i); }}
                                    className="p-3 bg-red-500/5 text-red-500 hover:bg-red-500/15 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="shrink-0 pt-8 border-t border-zinc-800 flex items-center justify-between">
                    <div className="text-left">
                        {transactions.some(t => !t.category_id) ? (
                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                                <Info size={12} /> Preencha a categoria pendente
                            </p>
                        ) : (
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
                                <Check size={12} className="text-emerald-500" /> Tudo pronto para importar
                            </p>
                        )}
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                            As transações só serão salvas após clicar no botão confirmar
                        </p>
                    </div>
                    <button
                        disabled={submitting || transactions.length === 0 || transactions.some(t => !t.category_id)}
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs px-10 py-5 rounded-3xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-3"
                    >
                        {submitting ? (
                            <> <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando... </>
                        ) : (
                            <> <PlusCircle size={18} /> Confirmar {transactions.length} itens </>
                        )}
                    </button>
                </div>

                {editingIndex !== null && (
                    <ReviewItemEditModal
                        transaction={transactions[editingIndex]}
                        categories={categories}
                        sources={sources}
                        suppliers={suppliers}
                        cards={cards}
                        onClose={() => setEditingIndex(null)}
                        onSave={(updated: any) => {
                            handleUpdateItem(editingIndex, updated);
                            setEditingIndex(null);
                        }}
                    />
                )}

                {removingIndex !== null && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#121212] border border-zinc-800 p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6 shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <Trash2 size={32} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Excluir Item?</h4>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">
                                    Tem certeza que deseja remover esta transação da lista de importação?
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    onClick={() => { handleRemove(removingIndex); setRemovingIndex(null); }}
                                    className="w-full bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl transition-all active:scale-[0.98]"
                                >
                                    Sim, Remover Item
                                </button>
                                <button
                                    onClick={() => setRemovingIndex(null)}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showConfirmModal.isOpen && (
                    <ConfirmModal
                        title={showConfirmModal.type === 'selected' ? "Apagar Selecionados" : "Apagar com Alertas"}
                        message={showConfirmModal.type === 'selected'
                            ? `Tem certeza que deseja apagar as ${selectedIndices.size} transações selecionadas?`
                            : "Tem certeza que deseja apagar TODAS as transações que possuem algum alerta (período, duplicação, reversal ou categoria faltando)?"
                        }
                        onConfirm={showConfirmModal.type === 'selected' ? handleDeleteSelected : handleDeleteAlerts}
                        onClose={() => setShowConfirmModal(prev => ({ ...prev, isOpen: false }))}
                        variant="danger"
                    />
                )}
            </motion.div>
        </div>
    );
}

function ReviewItemEditModal({ transaction, categories, sources, suppliers, cards, onClose, onSave }: any) {
    const [formData, setFormData] = useState({ ...transaction });

    const isCardSource = sources.find((s: any) => s.id === formData.source_id)?.name === "CARTÃO";

    const filteredCategories = categories.filter((c: any) => c.type === formData.type);
    const filteredSuppliers = suppliers;

    const isFormValid = !!formData.category_id;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#121212] border border-zinc-800 w-full max-w-md min-h-[550px] rounded-3xl p-8 shadow-2xl flex flex-col relative"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold uppercase italic tracking-tighter">Editar Transação</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X /></button>
                </div>

                <div className="flex bg-[#18181b] p-1 rounded-2xl border border-zinc-800 mb-6 font-sans opacity-50">
                    <button
                        disabled
                        className={`flex-1 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${formData.type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-600'}`}
                    >
                        Despesa
                    </button>
                    <button
                        disabled
                        className={`flex-1 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'text-zinc-600'}`}
                    >
                        Receita
                    </button>
                </div>

                <div className="flex-1 space-y-5 custom-scrollbar overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5 block">Data</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 h-[38px] focus:outline-none text-zinc-200 text-xs font-bold font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <CustomSelect
                                label="Fonte"
                                value={formData.source_id}
                                onChange={val => setFormData({ ...formData, source_id: val })}
                                options={sources.map((s: any) => ({ value: s.id, label: s.name, icon: s.icon }))}
                            />
                        </div>
                    </div>

                    {isCardSource && (
                        <div className="space-y-1.5 pt-1">
                            <CustomSelect
                                label="Cartão"
                                value={formData.card_id}
                                onChange={val => setFormData({ ...formData, card_id: val })}
                                options={cards.map((c: any) => ({ value: c.id, label: c.name, logo: c.logo }))}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5 ">
                        <CustomSelect
                            label="Fornecedor"
                            value={formData.supplier_id}
                            onChange={val => setFormData({ ...formData, supplier_id: val })}
                            options={suppliers.map((s: any) => ({
                                value: s.id,
                                label: s.name,
                                icon: s.logo || 'Package'
                            }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <CustomSelect
                            label="Categoria"
                            value={formData.category_id}
                            onChange={val => setFormData({ ...formData, category_id: val })}
                            options={filteredCategories.map((c: any) => ({
                                value: c.id,
                                label: c.name,
                                icon: c.icon
                            }))}
                        />
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center block mb-1.5">Valor</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(formData.value || 0)}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, "");
                                    const numericValue = Number(rawValue) / 100;
                                    setFormData({ ...formData, value: numericValue });
                                }}
                                className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl px-6 py-5 focus:outline-none font-black text-3xl text-center text-emerald-500 shadow-xl"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onSave(formData)}
                    disabled={!isFormValid}
                    className={`w-full font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg active:scale-95 mt-6 border ${formData.type === 'income'
                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-emerald-900/20'
                        : 'bg-red-600 hover:bg-red-500 border-red-500/50 shadow-red-900/20'
                        } text-white disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed`}
                >
                    Salvar Alterações
                </button>
            </motion.div>
        </div>
    );
}


function AccordionItem({ title, isOpen, onToggle, children, className = "" }: any) {
    return (
        <div className={`overflow-hidden rounded-xl transition-all duration-300 border border-zinc-800 ${isOpen ? 'bg-zinc-900/50' : 'bg-transparent hover:bg-zinc-800/20'} ${className}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 focus:outline-none group"
            >
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isOpen ? 'text-emerald-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {title}
                </span>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : 'text-zinc-500'}`}>
                    <ChevronDown size={14} />
                </div>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="px-4 pb-4 overflow-hidden"
            >
                {children}
            </motion.div>
        </div>
    );
}
