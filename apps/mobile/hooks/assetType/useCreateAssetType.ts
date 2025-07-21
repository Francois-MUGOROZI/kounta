import { useState } from "react";
import { AssetTypeRepository } from "../../repositories/AssetTypeRepository";
import { useDatabase } from "../../database";

export function useCreateAssetType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createAssetType = async (data: { name: string }) => {
		setLoading(true);
		setError(null);
		try {
			await AssetTypeRepository.create(db, data.name);
		} catch (e: any) {
			setError(e.message || "Failed to create asset type");
			throw e;
		} finally {
			setLoading(false);
		}
	};

	return { createAssetType, loading, error };
}
