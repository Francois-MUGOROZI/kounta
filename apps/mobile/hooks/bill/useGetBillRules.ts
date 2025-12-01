import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { BillsRepository } from "../../repositories/BillsRepository";
import { BillRule } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export function useGetBillRules() {
	const db = useDatabase();
	const [billRules, setBillRules] = useState<BillRule[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchBillRules = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await BillsRepository.getAllRules(db);
			// Convert SQLite integers to booleans
			const converted = data.map((rule) => ({
				...rule,
				is_active: Boolean(rule.is_active),
				auto_next: Boolean(rule.auto_next),
			}));
			setBillRules(converted);
		} catch (e: any) {
			setError(e.message || "Failed to load bill rules");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetchBillRules();

		// Subscribe to global data changes to keep the bill rules list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			fetchBillRules();
		});

		return () => {
			subscription.remove();
		};
	}, [fetchBillRules]);

	return { billRules, loading, error, refresh: fetchBillRules };
}
