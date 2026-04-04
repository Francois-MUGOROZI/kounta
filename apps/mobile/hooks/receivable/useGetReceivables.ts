import { useState, useEffect, useCallback } from "react";
import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { useDatabase } from "../../database";
import { Receivable, ReceivableStatus } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export const useGetReceivables = (filter?: {
	status?: ReceivableStatus;
	entityId?: number;
}) => {
	const db = useDatabase();
	const [receivables, setReceivables] = useState<Receivable[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await ReceivableRepository.getAll(db, filter);
			setReceivables(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch receivables");
		} finally {
			setLoading(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [db, JSON.stringify(filter)]);

	useEffect(() => {
		refresh();
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			refresh();
		});
		return () => {
			subscription.remove();
		};
	}, [refresh]);

	return { receivables, loading, error, refresh };
};
