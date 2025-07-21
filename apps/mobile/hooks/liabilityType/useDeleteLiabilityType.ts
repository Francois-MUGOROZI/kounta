import { useState } from "react";
import { LiabilityTypeRepository } from "../../repositories/LiabilityTypeRepository";
import { useDatabase } from "../../database";

export function useDeleteLiabilityType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteLiabilityType = async (id: number) => {
		setLoading(true);
		setError(null);
		try {
			await LiabilityTypeRepository.delete(db, id);
		} catch (e: any) {
			setError(e.message || "Failed to delete liability type");
			throw e;
		} finally {
			setLoading(false);
		}
	};

	return { deleteLiabilityType, loading, error };
}
