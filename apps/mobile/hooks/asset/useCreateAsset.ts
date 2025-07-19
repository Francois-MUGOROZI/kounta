import { useState } from "react";
import { AssetRepository } from "../../repositories/AssetRepository";
import { useDatabase } from "../../database";
import { Asset } from "../../types";

export const useCreateAsset = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createAsset = async (asset: Omit<Asset, "id">): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await AssetRepository.create(db, asset);
		} catch (err: any) {
			setError(err.message || "Failed to create asset");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { createAsset, loading, error };
};
