import { useState } from "react";
import { AssetRepository } from "../../repositories/AssetRepository";
import { useDatabase } from "../../database";

export const useDeleteAsset = () => {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteAsset = async (id: number): Promise<void> => {
		try {
			setLoading(true);
			setError(null);
			await AssetRepository.delete(db, id);
		} catch (err: any) {
			setError(err.message || "Failed to delete asset");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { deleteAsset, loading, error };
};
