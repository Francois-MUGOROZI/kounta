import { useEffect, useState, useCallback } from "react";
import {
	LiabilityTypeRepository,
	LiabilityType,
} from "../repositories/LiabilityTypeRepository";

export function useLiabilityTypes() {
	const [liabilityTypes, setLiabilityTypes] = useState<LiabilityType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchLiabilityTypes = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await LiabilityTypeRepository.getAll();
			setLiabilityTypes(data);
		} catch (e: any) {
			setError(e.message || "Failed to load liability types");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLiabilityTypes();
	}, [fetchLiabilityTypes]);

	return { liabilityTypes, loading, error, refresh: fetchLiabilityTypes };
}
