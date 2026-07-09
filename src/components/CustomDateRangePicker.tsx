import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';

const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CustomDateRangePickerProps {
    startDate: string; // YYYY-MM-DDTHH:mm:ss
    setStartDate: (s: string) => void;
    endDate: string; // YYYY-MM-DDTHH:mm:ss
    setEndDate: (s: string) => void;
    reportMonth?: number; // 1-12
    reportYear?: number;
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reportMonth,
    reportYear,
}) => {
    // Determine initial displayed month and year
    const initialMonth = useMemo(() => {
        if (startDate) {
            return new Date(startDate.substring(0, 10) + "T00:00:00").getMonth();
        }
        if (reportMonth) {
            return reportMonth - 1; // Convert 1-12 to 0-11
        }
        return new Date().getMonth();
    }, [startDate, reportMonth]);

    const initialYear = useMemo(() => {
        if (startDate) {
            return new Date(startDate.substring(0, 10) + "T00:00:00").getFullYear();
        }
        if (reportYear) {
            return reportYear;
        }
        return new Date().getFullYear();
    }, [startDate, reportYear]);

    const [displayedMonth, setDisplayedMonth] = useState(initialMonth);
    const [displayedYear, setDisplayedYear] = useState(initialYear);
    const [isPickingSecond, setIsPickingSecond] = useState(false);
    const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

    // Parse current values
    const startTimestamp = useMemo(() => {
        if (!startDate) return null;
        return new Date(startDate.substring(0, 10) + "T00:00:00").getTime();
    }, [startDate]);

    const endTimestampInclusive = useMemo(() => {
        if (!endDate) return null;
        // Subtract 1 day in ms to get inclusive end date presentation
        return new Date(endDate.substring(0, 10) + "T00:00:00").getTime() - 86400000;
    }, [endDate]);

    // Format current state text
    const displayRangeText = useMemo(() => {
        if (!startDate) return "Selecionar período";

        const startDayFormatted = startDate.substring(0, 10).split('-').reverse().join('/');
        if (!endDate) return startDayFormatted;

        const endInclusiveObj = new Date(endDate.substring(0, 10) + "T00:00:00");
        endInclusiveObj.setDate(endInclusiveObj.getDate() - 1);
        
        const y = endInclusiveObj.getFullYear();
        const m = String(endInclusiveObj.getMonth() + 1).padStart(2, '0');
        const d = String(endInclusiveObj.getDate()).padStart(2, '0');
        const endDayFormatted = `${d}/${m}/${y}`;

        if (startDayFormatted === endDayFormatted) {
            return startDayFormatted;
        }

        return `${startDayFormatted} a ${endDayFormatted}`;
    }, [startDate, endDate]);

    // Helpers to build navigation calendar days
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarGrid = useMemo(() => {
        const firstDayIndex = firstDayOfMonth(displayedYear, displayedMonth);
        const totalDays = daysInMonth(displayedYear, displayedMonth);

        const days = [];

        // Previous month padding days
        const prevMonth = displayedMonth === 0 ? 11 : displayedMonth - 1;
        const prevYear = displayedMonth === 0 ? displayedYear - 1 : displayedYear;
        const totalDaysPrev = daysInMonth(prevYear, prevMonth);
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push({
                day: totalDaysPrev - i,
                month: prevMonth,
                year: prevYear,
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                month: displayedMonth,
                year: displayedYear,
                isCurrentMonth: true,
            });
        }

        // Next month padding days to complete 42 cells (6 rows of 7 days)
        const remaining = 42 - days.length;
        const nextMonth = displayedMonth === 11 ? 0 : displayedMonth + 1;
        const nextYear = displayedMonth === 11 ? displayedYear + 1 : displayedYear;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                month: nextMonth,
                year: nextYear,
                isCurrentMonth: false,
            });
        }

        return days;
    }, [displayedMonth, displayedYear]);

    // Handlers
    const handlePrevMonth = () => {
        if (displayedMonth === 0) {
            setDisplayedMonth(11);
            setDisplayedYear(p => p - 1);
        } else {
            setDisplayedMonth(p => p - 1);
        }
    };

    const handleNextMonth = () => {
        if (displayedMonth === 11) {
            setDisplayedMonth(0);
            setDisplayedYear(p => p + 1);
        } else {
            setDisplayedMonth(p => p + 1);
        }
    };

    const handleDayClick = (dayStr: string) => {
        const dateObj = new Date(dayStr + "T00:00:00");
        const dateTimestamp = dateObj.getTime();

        const formattedDate = `${dayStr}T00:00:00`;

        if (!startDate || (startDate && endDate && !isPickingSecond)) {
            // First date click (or starting over a new selection)
            const nextDay = new Date(dateObj);
            nextDay.setDate(nextDay.getDate() + 1);
            const ny = nextDay.getFullYear();
            const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
            const nd = String(nextDay.getDate()).padStart(2, '0');
            const nextDayStr = `${ny}-${nm}-${nd}T00:00:00`;

            setStartDate(formattedDate);
            setEndDate(nextDayStr);
            setIsPickingSecond(true);
        } else {
            // Picking the second date
            if (dateTimestamp < startTimestamp!) {
                // If clicked date is before start date, make it the new start date
                const nextDay = new Date(dateObj);
                nextDay.setDate(nextDay.getDate() + 1);
                const ny = nextDay.getFullYear();
                const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
                const nd = String(nextDay.getDate()).padStart(2, '0');
                const nextDayStr = `${ny}-${nm}-${nd}T00:00:00`;

                setStartDate(formattedDate);
                setEndDate(nextDayStr);
                setIsPickingSecond(true);
            } else {
                // It is same or after start date. Close the interval.
                const nextDay = new Date(dateObj);
                nextDay.setDate(nextDay.getDate() + 1);
                const ny = nextDay.getFullYear();
                const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
                const nd = String(nextDay.getDate()).padStart(2, '0');
                const nextDayStr = `${ny}-${nm}-${nd}T00:00:00`;

                setEndDate(nextDayStr);
                setIsPickingSecond(false);
            }
        }
    };

    const clearSelection = () => {
        setStartDate("");
        setEndDate("");
        setIsPickingSecond(false);
        setHoveredDateStr(null);
    };

    // Quick select presets
    const selectPreset = (type: 'today' | 'yesterday' | 'week' | 'month') => {
        const today = new Date();
        const yStr = today.getFullYear();
        const mStr = String(today.getMonth() + 1).padStart(2, '0');
        const dStr = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yStr}-${mStr}-${dStr}`;

        const getTomorrowStr = (d: Date) => {
            const temp = new Date(d);
            temp.setDate(temp.getDate() + 1);
            return `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}-${String(temp.getDate()).padStart(2, '0')}`;
        };

        if (type === 'today') {
            const tom = getTomorrowStr(today);
            setStartDate(`${todayStr}T00:00:00`);
            setEndDate(`${tom}T00:00:00`);
            setIsPickingSecond(false);
        } else if (type === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            setStartDate(`${yesStr}T00:00:00`);
            setEndDate(`${todayStr}T00:00:00`);
            setIsPickingSecond(false);
        } else if (type === 'week') {
            const currentDay = today.getDay(); // 0 is Sunday
            // Start of week (Sunday)
            const sunday = new Date(today);
            sunday.setDate(today.getDate() - currentDay);
            const sunStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

            // End of week (Saturday inclusive, next day is Sunday)
            const nextSunday = new Date(sunday);
            nextSunday.setDate(sunday.getDate() + 7);
            const sunNextStr = `${nextSunday.getFullYear()}-${String(nextSunday.getMonth() + 1).padStart(2, '0')}-${String(nextSunday.getDate()).padStart(2, '0')}`;

            setStartDate(`${sunStr}T00:00:00`);
            setEndDate(`${sunNextStr}T00:00:00`);
            setIsPickingSecond(false);
        } else if (type === 'month') {
            // Filter month of the current report, or today's month
            const yearVal = reportYear || today.getFullYear();
            const monthVal = reportMonth ? reportMonth - 1 : today.getMonth();

            const startMonth = `${yearVal}-${String(monthVal + 1).padStart(2, '0')}-01`;
            const numDaysNext = daysInMonth(yearVal, monthVal);
            
            const lastDayObj = new Date(yearVal, monthVal, numDaysNext);
            const nextMonthObj = new Date(lastDayObj);
            nextMonthObj.setDate(nextMonthObj.getDate() + 1);

            const nYear = nextMonthObj.getFullYear();
            const nMonth = String(nextMonthObj.getMonth() + 1).padStart(2, '0');
            const nDay = String(nextMonthObj.getDate()).padStart(2, '0');
            const endMonthStr = `${nYear}-${nMonth}-${nDay}`;

            setStartDate(`${startMonth}T00:00:00`);
            setEndDate(`${endMonthStr}T00:00:00`);
            setIsPickingSecond(false);

            setDisplayedMonth(monthVal);
            setDisplayedYear(yearVal);
        }
    };

    return (
        <div className="flex flex-col gap-1.5 bg-[#18181b] border border-zinc-800 rounded-xl p-2.5 w-full">
            {/* Header with Display Text & Reset Button */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-zinc-100">{displayRangeText}</span>
                </div>
                {startDate && (
                    <button
                        onClick={clearSelection}
                        className="text-[9px] text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-0.5 uppercase tracking-wider font-bold"
                        type="button"
                    >
                        <RotateCcw className="w-2.5 h-2.5" /> Limpar
                    </button>
                )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 py-0.5">
                <button
                    onClick={() => selectPreset('today')}
                    className="px-1.5 py-0.5 bg-zinc-800/40 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded transition-colors font-medium border border-zinc-800/65"
                    type="button"
                >
                    Hoje
                </button>
                <button
                    onClick={() => selectPreset('yesterday')}
                    className="px-1.5 py-0.5 bg-zinc-800/40 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded transition-colors font-medium border border-zinc-800/65"
                    type="button"
                >
                    Ontem
                </button>
                <button
                    onClick={() => selectPreset('week')}
                    className="px-1.5 py-0.5 bg-zinc-800/40 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded transition-colors font-medium border border-zinc-800/65"
                    type="button"
                >
                    Esta Semana
                </button>
                <button
                    onClick={() => selectPreset('month')}
                    className="px-1.5 py-0.5 bg-zinc-800/40 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded transition-colors font-medium border border-zinc-800/65"
                    type="button"
                >
                    Mês ({reportMonth ? String(reportMonth).padStart(2, '0') : MONTH_NAMES[new Date().getMonth()].substring(0, 3)})
                </button>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between pt-0.5">
                <button
                    onClick={handlePrevMonth}
                    className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                    type="button"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                    {MONTH_NAMES[displayedMonth]} {displayedYear}
                </span>
                <button
                    onClick={handleNextMonth}
                    className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                    type="button"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Grid of Days */}
            <div className="grid grid-cols-7 gap-0.5 text-center mt-1">
                {WEEKDAY_NAMES.map(d => (
                    <span key={d} className="text-[9px] font-bold text-zinc-500 uppercase py-0.5">
                        {d}
                    </span>
                ))}

                {calendarGrid.map((cell, idx) => {
                    const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                    const cellTimestamp = new Date(cellDateStr + "T00:00:00").getTime();

                    const isStart = startTimestamp !== null && cellTimestamp === startTimestamp;
                    const isEnd = endTimestampInclusive !== null && cellTimestamp === endTimestampInclusive;

                    // Hover range highlight math
                    const isHoveredRange =
                        isPickingSecond &&
                        startTimestamp !== null &&
                        hoveredDateStr !== null &&
                        cellTimestamp > startTimestamp &&
                        cellTimestamp <= new Date(hoveredDateStr + "T00:00:00").getTime();

                    const isInRange =
                        startTimestamp !== null &&
                        endTimestampInclusive !== null &&
                        cellTimestamp >= startTimestamp &&
                        cellTimestamp <= endTimestampInclusive;

                    const isCurrentSelection = isStart || isEnd;

                    let bgClass = "text-zinc-300 hover:bg-zinc-850 hover:text-white rounded";
                    let textClass = "";

                    if (!cell.isCurrentMonth) {
                        textClass = "text-zinc-650 ";
                    }

                    if (isCurrentSelection) {
                        bgClass = "bg-emerald-600 text-white rounded font-bold z-10 scale-102";
                    } else if (isInRange) {
                        bgClass = "bg-emerald-950/40 text-emerald-300 rounded";
                    } else if (isHoveredRange) {
                        bgClass = "bg-emerald-950/15 text-emerald-400/80 rounded";
                    }

                    return (
                        <button
                            key={`${cellDateStr}-${idx}`}
                            onClick={() => handleDayClick(cellDateStr)}
                            onMouseEnter={() => isPickingSecond && setHoveredDateStr(cellDateStr)}
                            onMouseLeave={() => isPickingSecond && setHoveredDateStr(null)}
                            className={`py-1 text-[10px] transition-all relative font-medium focus:outline-none ${bgClass} ${textClass}`}
                            type="button"
                        >
                            {cell.day}
                        </button>
                    );
                })}
            </div>
            {isPickingSecond && (
                <div className="text-[8px] text-emerald-500/80 italic text-center pt-1">
                    Defina o final do período no calendário.
                </div>
            )}
        </div>
    );
};
