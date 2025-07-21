import { useState } from "react";
import { LiabilityTypeRepository } from "../../repositories/LiabilityTypeRepository";
import { useDatabase } from "../../database";

export function useUpdateLiabilityType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateLiabilityType = async (id: number, data: { name: string }) => {
		setLoading(true);
		setError(null);
		try {
			await LiabilityTypeRepository.update(db, id, data.name);
		} catch (e: any) {
			setError(e.message || "Failed to update liability type");
			throw e;
		} finally {
			setLoading(false);
		}
	};

	return { updateLiabilityType, loading, error };
}
