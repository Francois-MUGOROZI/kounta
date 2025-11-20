import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { EnvelopeRepository } from "@/repositories/EnvelopeRepository";

export function useAddToEnvelope() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addToEnvelope = useCallback(
		async (envelopeId: number, amount: number) => {
			setLoading(true);
			setError(null);
			try {
				await EnvelopeRepository.addToEnvelope(db, envelopeId, amount);
			} catch (e: any) {
				setError(e.message || "Failed to add to envelope");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { addToEnvelope, loading, error };
}
