import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { BillsRepository } from "../../repositories/BillsRepository";
import { Bill, BillStatus } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export function useGetBills(status?: BillStatus, unpaid?: boolean) {
	const db = useDatabase();
	const [bills, setBills] = useState<Bill[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchBills = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			let data: Bill[];
			if (status) {
				data = await BillsRepository.getBillsByStatus(db, status);
			} else if (unpaid) {
				data = await BillsRepository.getUnpaidBills(db);
			} else {
				data = await BillsRepository.getAllBills(db);
			}
			setBills(data);
		} catch (e: any) {
			setError(e.message || "Failed to load bills");
		} finally {
			setLoading(false);
		}
	}, [db, status, unpaid]);

	useEffect(() => {
		fetchBills();

		// Subscribe to global data changes to keep the bills list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			fetchBills();
		});

		return () => {
			subscription.remove();
		};
	}, [fetchBills]);

	return { bills, loading, error, refresh: fetchBills };
}
