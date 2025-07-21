import { useState } from "react";
import { AssetTypeRepository } from "../../repositories/AssetTypeRepository";
import { useDatabase } from "../../database";

export function useDeleteAssetType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteAssetType = async (id: number) => {
		setLoading(true);
		setError(null);
		try {
			await AssetTypeRepository.delete(db, id);
		} catch (e: any) {
			setError(e.message || "Failed to delete asset type");
			throw e;
		} finally {
			setLoading(false);
		}
	};

	return { deleteAssetType, loading, error };
}
