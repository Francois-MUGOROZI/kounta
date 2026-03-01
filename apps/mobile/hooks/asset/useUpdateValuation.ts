import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AssetRepository } from "../../repositories/AssetRepository";

export function useUpdateValuation() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateValuation = useCallback(
		async (assetId: number, newValuation: number) => {
			setLoading(true);
			setError(null);
			try {
				await AssetRepository.updateValuation(db, assetId, newValuation);
			} catch (e: any) {
				setError(e.message || "Failed to update valuation");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { updateValuation, loading, error };
}
