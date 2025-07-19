import { useState } from "react";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { useDatabase } from "../../database";
import { Liability } from "../../types";

export const useCreateLiability = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createLiability = async (
		liability: Omit<Liability, "id">
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await LiabilityRepository.create(db, liability);
		} catch (err: any) {
			setError(err.message || "Failed to create liability");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { createLiability, loading, error };
};
