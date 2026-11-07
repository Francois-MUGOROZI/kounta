import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { EnvelopeRepository } from "@/repositories/EnvelopeRepository";
import { Envelope } from "../../types";

/** Envelopes that can receive money moved out of `source`. */
export const moveTargets = (source: Envelope, envelopes: Envelope[]): Envelope[] =>
	envelopes.filter((e) => e.id !== source.id && e.currency === source.currency);

export const canMoveFrom = (source: Envelope, envelopes: Envelope[]): boolean =>
	source.current_balance > 0 && moveTargets(source, envelopes).length > 0;

export function useMoveBetweenEnvelopes() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const moveBetweenEnvelopes = useCallback(
		async (fromId: number, toId: number, amount: number) => {
			setLoading(true);
			setError(null);
			try {
				await EnvelopeRepository.move(db, fromId, toId, amount);
			} catch (e: any) {
				setError(e.message || "Failed to move money");
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { moveBetweenEnvelopes, loading, error };
}
