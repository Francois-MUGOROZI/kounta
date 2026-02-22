import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AssetRepository } from "../../repositories/AssetRepository";

export function useAddToAsset() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addToAsset = useCallback(
		async (assetId: number, amount: number) => {
			setLoading(true);
			setError(null);
			try {
				await AssetRepository.addToAsset(db, assetId, amount);
			} catch (e: any) {
				setError(e.message || "Failed to add value to asset");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { addToAsset, loading, error };
}
