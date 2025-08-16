import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { Envelope } from "../../types";
import { EnvelopeRepository } from "@/repositories/EnvelopeRepository";

export function useUpdateEnvelope() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateEnvelope = useCallback(
		async (id: number, updates: Partial<Envelope>) => {
			setLoading(true);
			setError(null);
			try {
				await EnvelopeRepository.update(db, id, updates);
			} catch (e: any) {
				setError(e.message || "Failed to update envelope");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { updateEnvelope, loading, error };
}
