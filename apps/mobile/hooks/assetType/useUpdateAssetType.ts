import { useState } from "react";
import { AssetTypeRepository } from "../../repositories/AssetTypeRepository";
import { useDatabase } from "../../database";

export function useUpdateAssetType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateAssetType = async (id: number, data: { name: string }) => {
		setLoading(true);
		setError(null);
		try {
			await AssetTypeRepository.update(db, id, data.name);
		} catch (e: any) {
			setError(e.message || "Failed to update asset type");
			throw e;
		} finally {
			setLoading(false);
		}
	};

	return { updateAssetType, loading, error };
}
