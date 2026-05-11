import React, { createContext, useContext, useState, useMemo } from 'react';
import { Report, GlobalConfig } from './types';

type Mode = 'historical' | 'current' | 'default';

interface FinancialContextType {
  dailySpentMode: Mode;
  setDailySpentMode: (mode: Mode) => void;
  surplusProjectionMode: Mode;
  setSurplusProjectionMode: (mode: Mode) => void;

  // Resolved values based on current context
  dailySpentValues: { historical: number; current: number; default: number };
  surplusValues: { historical: number; current: number; default: number };

  selectedDailyValue: number;
  selectedSurplusValue: number;

  // We'll also expose the stats for the "active" report as calculated by the context
  activeReportStats: any;
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

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{
  children: React.ReactNode;
  reports: Report[];
  activeReport: Report | null;
  config: GlobalConfig | null;
}> = ({ children, reports, activeReport, config }) => {
  const [dailySpentMode, setDailySpentMode] = useState<Mode>('historical');
  const [surplusProjectionMode, setSurplusProjectionMode] = useState<Mode>('current');

  // 1. Calculate Historical Averages
  const historicalAverages = useMemo(() => {
    if (reports.length === 0) return { surplus: 0, dailySpent: config?.daily_spent_avg || 0 };

    const now = new Date();
    const finalizedReports = reports.filter(r => {
      const endParts = r.end_date.split('-');
      const endDate = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]), 23, 59, 59);
      return endDate < now;
    });

    if (finalizedReports.length === 0) return { surplus: 0, dailySpent: config?.daily_spent_avg || 0 };

    let totalSurplus = 0;
    let totalDiscretionarySpent = 0;
    let totalReportDays = 0;
    let reportCount = 0;

    finalizedReports.forEach(r => {
      if (!r.transactions) return;
      const income = r.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.value), 0);
      const expense = r.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.value), 0);
      const mandatory = r.transactions.filter(t => t.type === 'expense' && t.is_mandatory).reduce((sum, t) => sum + Number(t.value), 0);

      const startDate = getInitialDate(r.start_date);
      const endDate = getFinalDate(r.end_date);

      const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

      totalSurplus += (income - expense);
      totalDiscretionarySpent += (expense - mandatory);
      totalReportDays += days;
      reportCount++;
    });

    return {
      surplus: totalSurplus / (reportCount || 1),
      dailySpent: totalReportDays > 0 ? totalDiscretionarySpent / totalReportDays : (config?.daily_spent_avg || 0)
    };
  }, [reports, config]);

  // 2. Calculate Current Stats for the Active Report
  const activeReportStats = useMemo(() => {
    let targetReport = activeReport;

    // If activeReport is provided but missing transactions, try to find the full version in reports
    if (targetReport && (!targetReport.transactions || targetReport.transactions.length === 0) && reports.length > 0) {
      const found = reports.find(r => r.id === targetReport!.id);
      if (found && found.transactions && found.transactions.length > 0) {
        targetReport = found;
      }
    }

    // Fallback: Pick current or latest report if none active
    if (!targetReport && reports.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const sortedReports = [...reports].sort((a, b) => {
        const startA = new Date(a.start_date + "T00:00:00");
        const startB = new Date(b.start_date + "T00:00:00");
        return startB.getTime() - startA.getTime();
      });

      targetReport = sortedReports.find(r => {
        const start = new Date(r.start_date + "T00:00:00");
        return start <= now;
      }) || sortedReports[0];
    }

    if (!targetReport || !targetReport.transactions) return null;

    const now = new Date();
    const transactions = targetReport.transactions || [];
    // Use local date for comparison
    const nowStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    const allKnownIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
    const allKnownExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);
    const allMandatoryExpense = transactions.filter(t => t.type === 'expense' && t.is_mandatory).reduce((acc, t) => acc + Number(t.value), 0);

    const actualExpense = transactions.filter(t => t.type === 'expense' && t.date <= nowStr).reduce((acc, t) => acc + Number(t.value), 0);
    const actualMandatoryExpense = transactions.filter(t => t.type === 'expense' && t.is_mandatory && t.date <= nowStr).reduce((acc, t) => acc + Number(t.value), 0);

    const start = new Date(targetReport.start_date + "T00:00:00");
    const end = new Date(targetReport.end_date + "T23:59:59");

    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysFromStart = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Days passed context: capped between 0 and totalDays. 
    // If today is day 1, daysPassed is 1.
    const daysPassed = Math.max(0, Math.min(totalDays, daysFromStart));
    const daysRemaining = totalDays - daysPassed;

    // Average: (Total Discretionary in report) / (Days Passed)
    const totalDiscretionary = allKnownExpenses - allMandatoryExpense;
    const currentDailyAvg = daysPassed > 0 ? totalDiscretionary / daysPassed : 0;

    // Resolve daily spent base for projection
    let dailyBase = historicalAverages.dailySpent;
    if (dailySpentMode === 'current') dailyBase = currentDailyAvg;
    if (dailySpentMode === 'default') dailyBase = config?.daily_spent_estimate_default || 0;

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
  }, [activeReport, reports, dailySpentMode, historicalAverages, config]);

  const dailySpentValues = {
    historical: historicalAverages.dailySpent,
    current: activeReportStats?.currentDailyAvg || 0,
    default: config?.daily_spent_estimate_default || 0
  };

  const surplusValues = {
    historical: historicalAverages.surplus,
    current: activeReportStats?.expectedSurplus || 0,
    default: config?.okr_min_default || 0
  };

  const selectedDailyValue = dailySpentValues[dailySpentMode];
  const selectedSurplusValue = surplusValues[surplusProjectionMode];

  return (
    <FinancialContext.Provider value={{
      dailySpentMode,
      setDailySpentMode,
      surplusProjectionMode,
      setSurplusProjectionMode,
      dailySpentValues,
      surplusValues,
      selectedDailyValue,
      selectedSurplusValue,
      activeReportStats
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
