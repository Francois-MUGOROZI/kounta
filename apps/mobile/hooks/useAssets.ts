import { useEffect, useState, useCallback } from "react";
import { Asset } from "../types";
import { AssetRepository } from "../repositories/AssetRepository";

export function useAssets() {
	const [assets, setAssets] = useState<Asset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAssets = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await AssetRepository.getAll();
			setAssets(data);
		} catch (e: any) {
			setError(e.message || "Failed to load assets");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAssets();
	}, [fetchAssets]);

	return { assets, loading, error, refresh: fetchAssets };
}
