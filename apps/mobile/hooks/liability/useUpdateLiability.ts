import { useState } from "react";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { useDatabase } from "../../database";
import { Liability } from "../../types";

export const useUpdateLiability = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateLiability = async (
		id: number,
		updates: Partial<Liability>
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await LiabilityRepository.update(db, id, updates);
		} catch (err: any) {
			setError(err.message || "Failed to update liability");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { updateLiability, loading, error };
};
