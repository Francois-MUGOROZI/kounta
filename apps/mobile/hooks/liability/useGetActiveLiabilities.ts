import { useState, useEffect, useCallback } from "react";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { useDatabase } from "../../database";
import { Liability } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export const useGetActiveLiabilities = () => {
	const db = useDatabase();
	const [liabilities, setLiabilities] = useState<Liability[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await LiabilityRepository.getActive(db);
			setLiabilities(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch active liabilities");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		refresh();

		// Subscribe to global data changes to keep the liabilities list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			refresh();
		});

		return () => {
			subscription.remove();
		};
	}, [refresh]);

	return { liabilities, loading, error, refresh };
};
