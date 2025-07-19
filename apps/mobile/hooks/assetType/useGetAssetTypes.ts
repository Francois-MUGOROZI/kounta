import { useState, useEffect } from "react";
import { AssetTypeRepository } from "../../repositories/AssetTypeRepository";
import { useDatabase } from "../../database";
import { AssetType } from "../../types";

export const useGetAssetTypes = () => {
	const db = useDatabase();
	const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await AssetTypeRepository.getAll(db);
			setAssetTypes(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch asset types");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	return { assetTypes, loading, error, refresh };
};
