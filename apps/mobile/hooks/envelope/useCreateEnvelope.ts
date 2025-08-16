import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { Envelope } from "../../types";
import { EnvelopeRepository } from "@/repositories/EnvelopeRepository";

export function useCreateEnvelope() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createEnvelope = useCallback(
		async (envelope: Omit<Envelope, "id">) => {
			setLoading(true);
			setError(null);
			try {
				await EnvelopeRepository.create(db, envelope);
			} catch (e: any) {
				setError(e.message || "Failed to create envelope");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { createEnvelope, loading, error };
}
