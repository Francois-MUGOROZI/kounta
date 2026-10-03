import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AssetRepository } from "../../repositories/AssetRepository";

/**
 * @deprecated Use useUpdateValuation instead
 */
export function useAddToAsset() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addToAsset = useCallback(
		async (assetId: number, amount: number) => {
			setLoading(true);
			setError(null);
			try {
				// Redirect to updateValuation for backwards compatibility
				await AssetRepository.updateValuation(db, assetId, amount);
			} catch (e: any) {
				setError(e.message || "Failed to update valuation");
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { addToAsset, loading, error };
}
