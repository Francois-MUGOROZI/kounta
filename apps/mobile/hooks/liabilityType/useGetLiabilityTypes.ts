import { useState, useEffect } from "react";
import { LiabilityTypeRepository } from "../../repositories/LiabilityTypeRepository";
import { useDatabase } from "../../database";
import { LiabilityType } from "../../types";

export const useGetLiabilityTypes = () => {
	const db = useDatabase();
	const [liabilityTypes, setLiabilityTypes] = useState<LiabilityType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await LiabilityTypeRepository.getAll(db);
			setLiabilityTypes(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch liability types");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	return { liabilityTypes, loading, error, refresh };
};
