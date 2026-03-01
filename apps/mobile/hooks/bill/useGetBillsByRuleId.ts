import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { BillsRepository } from "../../repositories/BillsRepository";
import { Bill } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export function useGetBillsByRuleId(ruleId: number) {
	const db = useDatabase();
	const [bills, setBills] = useState<Bill[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchBills = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await BillsRepository.getBillsByRuleId(db, ruleId);
			setBills(data);
		} catch (e: any) {
			setError(e.message || "Failed to load bills for rule");
		} finally {
			setLoading(false);
		}
	}, [db, ruleId]);

	useEffect(() => {
		fetchBills();

		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			fetchBills();
		});

		return () => {
			subscription.remove();
		};
	}, [fetchBills]);

	return { bills, loading, error, refresh: fetchBills };
}
