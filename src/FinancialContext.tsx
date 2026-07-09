import React, { createContext, useContext, useState, useMemo } from 'react';
import { Report, GlobalConfig } from './types';

type Mode = 'historical' | 'current' | 'default';

interface FinancialContextType {
  reports: Report[];
  dailySpentMode: Mode;
  setDailySpentMode: (mode: Mode) => void;

  // Resolved values based on current context
  dailySpentValues: { historical: number; current: number; default: number };

  selectedDailyValue: number;

  // We'll also expose the stats for the "active" report as calculated by the context
  activeReportStats: any;
}

function getNow() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getFinalDate(dateStr: any) {
  const date = new Date(dateStr);
  date.setHours(date.getHours() + 3);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getInitialDate(dateStr: any) {
  const date = new Date(dateStr);
  date.setHours(date.getHours() + 3);
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

  // Find the report that includes the current date (for the home page fallback)
  const refReport = useMemo(() => {
    const now = new Date();
    const nowStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    const matches = reports
      .filter(r => r.start_date <= nowStr && r.end_date >= nowStr)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    return matches.length > 0 ? matches[0] : null;
  }, [reports]);

  // Helper to calculate historical daily spent for any target report
  const getHistoricalSpentForReport = useMemo(() => {
    return (targetReport: Report | null): number => {
      if (!targetReport) return config?.daily_spent_avg || 0;

      const priorReports = reports.filter(r => r.start_date < targetReport.start_date);
      if (priorReports.length === 0) return config?.daily_spent_avg || 0;

      let totalDiscretionaryRecurring = 0;
      let totalPriorDays = 0;

      priorReports.forEach(r => {
        if (!r.transactions) return;
        const recurringDiscretionary = r.transactions
          .filter(t => t.type === 'expense' && !t.is_mandatory && !t.is_non_recurring_mandatory && !!t.is_recurring)
          .reduce((sum, t) => sum + Number(t.value), 0);

        const startDate = getInitialDate(r.start_date);
        const endDate = getFinalDate(r.end_date);
        const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

        totalDiscretionaryRecurring += recurringDiscretionary;
        totalPriorDays += days;
      });

      return totalPriorDays > 0 ? totalDiscretionaryRecurring / totalPriorDays : (config?.daily_spent_avg || 0);
    };
  }, [reports, config]);

  // Historical Daily Spent for the current view context
  const historicalDailySpent = useMemo(() => {
    const reportToUse = activeReport || refReport;
    return getHistoricalSpentForReport(reportToUse);
  }, [activeReport, refReport, getHistoricalSpentForReport]);

  // 1. Calculate Historical Averages (kept for surplus)
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
      const mandatory = r.transactions.filter(t => t.type === 'expense' && (t.is_mandatory || t.is_non_recurring_mandatory)).reduce((sum, t) => sum + Number(t.value), 0);

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

    console.log({ targetReport })

    const now = getNow();
    const transactions = targetReport.transactions || [];

    const allKnownIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
    const allKnownExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);
    const allMandatoryExpense = transactions.filter(t => t.type === 'expense' && (t.is_mandatory || t.is_non_recurring_mandatory)).reduce((acc, t) => acc + Number(t.value), 0);

    const startDate = getInitialDate((targetReport.start_date));
    const endDate = getFinalDate((targetReport.end_date));

    const nowIsOnPeriod = now >= startDate && now <= endDate;

    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.min(totalDays, Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
    let daysRemaining = (Math.ceil(Math.max(0, Math.min(totalDays - daysPassed, totalDays)))) - (nowIsOnPeriod ? 1 : 0);
    if (daysRemaining < 0) daysRemaining = 0;

    // Average: (Total Discretionary Recurring in report) / (Days Passed)
    const totalDiscretionaryRecurring = transactions
      .filter(t => t.type === 'expense' && !t.is_mandatory && !t.is_non_recurring_mandatory && !!t.is_recurring)
      .reduce((sum, t) => sum + Number(t.value), 0);
    const currentDailyAvg = daysPassed > 0 ? totalDiscretionaryRecurring / daysPassed : 0;

    // Resolve daily spent base for projection
    let dailyBase = getHistoricalSpentForReport(targetReport);
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
  }, [activeReport, reports, dailySpentMode, getHistoricalSpentForReport, config]);

  const dailySpentValues = {
    historical: historicalDailySpent,
    current: activeReportStats?.currentDailyAvg || 0,
    default: config?.daily_spent_estimate_default || 0
  };

  const selectedDailyValue = dailySpentValues[dailySpentMode];

  return (
    <FinancialContext.Provider value={{
      reports,
      dailySpentMode,
      setDailySpentMode,
      dailySpentValues,
      selectedDailyValue,
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
