import { useState, useEffect } from "react";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { useDatabase } from "../../database";
import { Liability } from "../../types";

export const useGetLiabilities = () => {
	const db = useDatabase();
	const [liabilities, setLiabilities] = useState<Liability[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await LiabilityRepository.getAll(db);
			setLiabilities(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch liabilities");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	return { liabilities, loading, error, refresh };
};
