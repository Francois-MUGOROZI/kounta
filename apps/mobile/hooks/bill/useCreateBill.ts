import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { BillsRepository } from "../../repositories/BillsRepository";
import { Bill } from "../../types";

export function useCreateBill() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createBill = useCallback(
		async (bill: Omit<Bill, "id">) => {
			setLoading(true);
			setError(null);
			try {
				await BillsRepository.createBill(db, bill);
			} catch (e: any) {
				setError(e.message || "Failed to create bill");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { createBill, loading, error };
}
