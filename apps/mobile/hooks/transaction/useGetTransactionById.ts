import { useState, useEffect, useCallback } from "react";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { useDatabase } from "../../database";
import { Transaction } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export const useGetTransactionById = (id: number) => {
	const db = useDatabase();
	const [transaction, setTransaction] = useState<Transaction | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await TransactionRepository.getById(db, id);
			setTransaction(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch transaction");
		} finally {
			setLoading(false);
		}
	}, [db, id]);

	useEffect(() => {
		refresh();
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			refresh();
		});
		return () => {
			subscription.remove();
		};
	}, [refresh]);

	return { transaction, loading, error, refresh };
};
