import { useState } from "react";
import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { useDatabase } from "../../database";
import { Receivable } from "../../types";

export const useUpdateReceivable = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateReceivable = async (
		id: number,
		updates: Partial<Receivable>,
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await ReceivableRepository.update(db, id, updates);
		} catch (err: any) {
			setError(err.message || "Failed to update receivable");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { updateReceivable, loading, error };
};
