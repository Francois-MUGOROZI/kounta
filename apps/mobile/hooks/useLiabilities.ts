import { useEffect, useState, useCallback } from "react";
import { Liability } from "../types";
import { LiabilityRepository } from "../repositories/LiabilityRepository";

export function useLiabilities() {
	const [liabilities, setLiabilities] = useState<Liability[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchLiabilities = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await LiabilityRepository.getAll();
			setLiabilities(data);
		} catch (e: any) {
			setError(e.message || "Failed to load liabilities");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLiabilities();
	}, [fetchLiabilities]);

	return { liabilities, loading, error, refresh: fetchLiabilities };
}
