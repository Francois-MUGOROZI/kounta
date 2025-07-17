import { useEffect, useState, useCallback } from "react";
import { BudgetRepository, Budget } from "../repositories/BudgetRepository";

export function useBudgets() {
	const [budgets, setBudgets] = useState<Budget[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchBudgets = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await BudgetRepository.getAll();
			setBudgets(data);
		} catch (e: any) {
			setError(e.message || "Failed to load budgets");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchBudgets();
	}, [fetchBudgets]);

	return { budgets, loading, error, refresh: fetchBudgets };
}
