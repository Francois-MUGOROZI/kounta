import { useState } from "react";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { useDatabase } from "../../database";

export const useDeleteLiability = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteLiability = async (id: number): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await LiabilityRepository.delete(db, id);
		} catch (err: any) {
			setError(err.message || "Failed to delete liability");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { deleteLiability, loading, error };
};
