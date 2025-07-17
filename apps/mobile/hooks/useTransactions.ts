import { useEffect, useState, useCallback } from "react";
import { Transaction } from "../types";
import { TransactionRepository } from "../repositories/TransactionRepository";

export function useTransactions() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTransactions = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await TransactionRepository.getAll();
			setTransactions(data);
		} catch (e: any) {
			setError(e.message || "Failed to load transactions");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTransactions();
	}, [fetchTransactions]);

	return { transactions, loading, error, refresh: fetchTransactions };
}
