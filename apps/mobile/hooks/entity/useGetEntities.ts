import { useState, useEffect, useCallback } from "react";
import { EntityRepository } from "../../repositories/EntityRepository";
import { useDatabase } from "../../database";
import { Entity } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export const useGetEntities = () => {
	const db = useDatabase();
	const [entities, setEntities] = useState<Entity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await EntityRepository.getAll(db);
			setEntities(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch entities");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		refresh();
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			refresh();
		});
		return () => {
			subscription.remove();
		};
	}, [refresh]);

	return { entities, loading, error, refresh };
};
