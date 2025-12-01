import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { BillsRepository } from "../../repositories/BillsRepository";
import { BillRule } from "../../types";

export function useUpdateBillRule() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateBillRule = useCallback(
		async (id: number, updates: Partial<BillRule>) => {
			setLoading(true);
			setError(null);
			try {
				await BillsRepository.updateRule(db, id, updates);
			} catch (e: any) {
				setError(e.message || "Failed to update bill rule");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { updateBillRule, loading, error };
}
