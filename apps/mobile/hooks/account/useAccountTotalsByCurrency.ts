import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountRepository } from "../../repositories/AccountRepository";
import { addEventListener, EVENTS } from "../../utils/events";

/**
 * Lightweight hook that returns account balance totals grouped by currency.
 * Uses a single aggregate SQL query instead of fetching all account rows.
 */
export function useAccountTotalsByCurrency() {
	const db = useDatabase();
	const [totals, setTotals] = useState<{ [currency: string]: number }>({});
	const [loading, setLoading] = useState(true);

	const fetch = useCallback(async () => {
		setLoading(true);
		try {
			const rows = await AccountRepository.getTotalsByCurrency(db);
			const map: { [currency: string]: number } = {};
			rows.forEach((r) => {
				map[r.currency] = r.total ?? 0;
			});
			setTotals(map);
		} catch {
			// Silently fail — totals are supplementary
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetch();
		const subscription = addEventListener(EVENTS.DATA_CHANGED, fetch);
		return () => subscription.remove();
	}, [fetch]);

	return { totals, loading };
}
