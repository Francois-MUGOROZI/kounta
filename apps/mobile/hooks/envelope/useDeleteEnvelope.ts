import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { EnvelopeRepository } from "@/repositories/EnvelopeRepository";

export function useDeleteEnvelope() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteEnvelope = useCallback(
		async (id: number) => {
			setLoading(true);
			setError(null);
			try {
				await EnvelopeRepository.delete(db, id);
			} catch (e: any) {
				setError(e.message || "Failed to delete envelope");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { deleteEnvelope, loading, error };
}
