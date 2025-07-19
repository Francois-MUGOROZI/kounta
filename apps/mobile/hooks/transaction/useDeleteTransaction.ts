import { useState } from "react";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { useDatabase } from "../../database";

export const useDeleteTransaction = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteTransaction = async (id: number): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await TransactionRepository.delete(db, id);
		} catch (err: any) {
			setError(err.message || "Failed to delete transaction");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { deleteTransaction, loading, error };
};
