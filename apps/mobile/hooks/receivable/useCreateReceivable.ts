import { useState } from "react";
import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { useDatabase } from "../../database";
import { Receivable } from "../../types";

export const useCreateReceivable = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createReceivable = async (
		receivable: Omit<Receivable, "id">,
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await ReceivableRepository.create(db, receivable);
		} catch (err: any) {
			setError(err.message || "Failed to create receivable");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { createReceivable, loading, error };
};
