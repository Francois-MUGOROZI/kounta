import { useEffect, useState, useCallback } from "react";
import {
	SavingsGoalRepository,
	SavingsGoal,
} from "../repositories/SavingsGoalRepository";

export function useSavingsGoals() {
	const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSavingsGoals = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await SavingsGoalRepository.getAll();
			setSavingsGoals(data);
		} catch (e: any) {
			setError(e.message || "Failed to load savings goals");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSavingsGoals();
	}, [fetchSavingsGoals]);

	return { savingsGoals, loading, error, refresh: fetchSavingsGoals };
}
