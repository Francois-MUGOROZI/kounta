import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { Envelope } from "../../types";
import { EnvelopeRepository } from "@/repositories/EnvelopeRepository";
import { addEventListener, EVENTS } from "../../utils/events";

export function useGetEnvelopes() {
	const db = useDatabase();
	const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchEnvelopes = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await EnvelopeRepository.getAll(db);
			setEnvelopes(data);
		} catch (e: any) {
			setError(e.message || "Failed to load envelopes");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetchEnvelopes();

		// Subscribe to global data changes to keep the envelopes list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			fetchEnvelopes();
		});

		return () => {
			subscription.remove();
		};
	}, [fetchEnvelopes]);

	return { envelopes, loading, error, refresh: fetchEnvelopes };
}
