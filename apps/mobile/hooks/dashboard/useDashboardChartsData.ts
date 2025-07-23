import { useEffect, useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { DashboardRepository } from "../../repositories/DashboardRepository";
import type { CategoryTotal } from "../../types";
export interface IncomeExpenseByMonthDatum {
	month: string; // e.g. "2024-06"
	income: number;
	expense: number;
}

export function useDashboardChartsData(currency: string) {
	const db = useDatabase();
	const [expensesByCategory, setExpensesByCategory] = useState<CategoryTotal[]>(
		[]
	);
	const [incomeByCategory, setIncomeByCategory] = useState<CategoryTotal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [expenses, income] = await Promise.all([
				DashboardRepository.getExpensesByCategoryThisMonth(db, currency),
				DashboardRepository.getIncomeByCategoryThisMonth(db, currency),
			]);
			setExpensesByCategory(expenses);
			setIncomeByCategory(income);
		} catch (e: any) {
			setError(e.message || "Failed to load chart data");
		} finally {
			setLoading(false);
		}
	}, [db, currency]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		expensesByCategory,
		incomeByCategory,
		loading,
		error,
		refresh: fetchData,
	};
}
