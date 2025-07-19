import { useState } from "react";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { useDatabase } from "../../database";
import { Transaction } from "../../types";

export const useUpdateTransaction = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateTransaction = async (
		id: number,
		updates: Partial<Transaction>
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await TransactionRepository.update(db, id, updates);
		} catch (err: any) {
			setError(err.message || "Failed to update transaction");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { updateTransaction, loading, error };
};
