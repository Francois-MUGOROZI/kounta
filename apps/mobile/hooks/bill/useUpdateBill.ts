import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { BillsRepository } from "../../repositories/BillsRepository";
import { Bill } from "../../types";

export function useUpdateBill() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateBill = useCallback(
		async (id: number, updates: Partial<Bill>) => {
			setLoading(true);
			setError(null);
			try {
				await BillsRepository.updateBill(db, id, updates);
			} catch (e: any) {
				setError(e.message || "Failed to update bill");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { updateBill, loading, error };
}
