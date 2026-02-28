import { useState, useEffect, useCallback } from "react";
import { AssetRepository } from "../../repositories/AssetRepository";
import { useDatabase } from "../../database";
import { Asset } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export const useGetAssets = () => {
	const db = useDatabase();
	const [assets, setAssets] = useState<Asset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
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
	}, [db]);

	useEffect(() => {
		refresh();

		// Subscribe to global data changes to keep the assets list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			refresh();
		});

		return () => {
			subscription.remove();
		};
	}, [refresh]);

	return { assets, loading, error, refresh };
};
