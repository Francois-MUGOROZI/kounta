import { useEffect, useState, useCallback } from "react";
import {
	AssetTypeRepository,
	AssetType,
} from "../repositories/AssetTypeRepository";

export function useAssetTypes() {
	const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAssetTypes = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await AssetTypeRepository.getAll();
			setAssetTypes(data);
		} catch (e: any) {
			setError(e.message || "Failed to load asset types");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAssetTypes();
	}, [fetchAssetTypes]);

	return { assetTypes, loading, error, refresh: fetchAssetTypes };
}
