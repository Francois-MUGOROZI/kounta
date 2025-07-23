import { useEffect, useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { DashboardRepository } from "../../repositories/DashboardRepository";
import type { DashboardTotals } from "../../types";

export type DashboardStats = {
	[currency: string]: DashboardTotals;
};

export function useDashboardStats() {
	const db = useDatabase();
	const [stats, setStats] = useState<DashboardStats>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const totals = await DashboardRepository.getTotalsByCurrency(db);
			// Convert array to object keyed by currency for UI compatibility
			const result: DashboardStats = {};
			for (const t of totals) {
				result[t.currency] = t;
			}
			setStats(result);
		} catch (e: any) {
			setError(e.message || "Failed to load dashboard stats");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	return { stats, loading, error, refresh: fetchStats };
}
