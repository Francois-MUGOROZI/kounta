import { useState } from "react";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { useDatabase } from "../../database";
import { Transaction } from "../../types";

export const useCreateTransaction = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createTransaction = async (
		transaction: Omit<Transaction, "id">
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await TransactionRepository.create(db, transaction);
		} catch (err: any) {
			setError(err.message || "Failed to create transaction");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { createTransaction, loading, error };
};
