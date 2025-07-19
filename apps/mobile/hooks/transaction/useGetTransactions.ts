import { useState, useEffect } from "react";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { useDatabase } from "../../database";
import { Transaction } from "../../types";

export const useGetTransactions = () => {
	const db = useDatabase();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await TransactionRepository.getAll(db);
			setTransactions(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch transactions");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	return { transactions, loading, error, refresh };
};
