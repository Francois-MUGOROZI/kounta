import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { BillsRepository } from "../../repositories/BillsRepository";
import { BillRule } from "../../types";

export function useCreateBillRule() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createBillRule = useCallback(
		async (billRule: Omit<BillRule, "id">) => {
			setLoading(true);
			setError(null);
			try {
				await BillsRepository.createRule(db, billRule);
			} catch (e: any) {
				setError(e.message || "Failed to create bill rule");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { createBillRule, loading, error };
}
