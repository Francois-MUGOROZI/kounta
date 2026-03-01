import { useState } from "react";
import { AssetRepository } from "../../repositories/AssetRepository";
import { useDatabase } from "../../database";
import { Asset } from "../../types";

export const useUpdateAsset = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateAsset = async (
		id: number,
		updates: Partial<Pick<Asset, "name" | "asset_type_id" | "notes">>
	): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await AssetRepository.update(db, id, updates);
		} catch (err: any) {
			setError(err.message || "Failed to update asset");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { updateAsset, loading, error };
};
