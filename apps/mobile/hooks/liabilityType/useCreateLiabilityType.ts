import { useState } from "react";
import { LiabilityTypeRepository } from "../../repositories/LiabilityTypeRepository";
import { useDatabase } from "../../database";

export function useCreateLiabilityType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createLiabilityType = async (data: { name: string }) => {
		setLoading(true);
		setError(null);
		try {
			await LiabilityTypeRepository.create(db, data.name);
		} catch (e: any) {
			setError(e.message || "Failed to create liability type");
			throw e;
		} finally {
			setLoading(false);
		}
	};

	return { createLiabilityType, loading, error };
}
