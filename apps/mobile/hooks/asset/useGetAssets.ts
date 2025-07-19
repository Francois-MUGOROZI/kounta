import { useState, useEffect } from "react";
import { AssetRepository } from "../../repositories/AssetRepository";
import { useDatabase } from "../../database";
import { Asset } from "../../types";

export const useGetAssets = () => {
	const db = useDatabase();
	const [assets, setAssets] = useState<Asset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await AssetRepository.getAll(db);
			setAssets(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch assets");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	return { assets, loading, error, refresh };
};
