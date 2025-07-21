import { useState, useEffect, useCallback } from "react";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { useDatabase } from "../../database";
import { Transaction, TransactionFilter } from "../../types";

export const useGetTransactions = (filter?: TransactionFilter) => {
	const db = useDatabase();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await TransactionRepository.getAll(db, filter);
			setTransactions(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch transactions");
		} finally {
			setLoading(false);
		}
	}, [db, filter]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { transactions, loading, error, refresh };
};
